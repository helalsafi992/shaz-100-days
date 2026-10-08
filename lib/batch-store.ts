import { db, transaction } from "./db";
import { planningPeriod } from "./platform";
import { addDays, localDate } from "./profile";
import { requirePlanningRules } from "./planning-store";
import { catalog } from "./content";
import { batchPlan } from "./meal-batch";
import { hash, HttpError } from "./security";
import type { MealDay } from "./meal-plan";
import type { Recipe } from "./recipes";
type Input = {
  date: string;
  slot: string;
  targetSlot: string;
  fingerprint?: string;
};
export async function mealBatch(user: string, input: Input, confirm: boolean) {
  const p = await planningPeriod(user),
    next = addDays(input.date, 1);
  if (
    input.date < localDate() ||
    input.date < p.start_date ||
    next > addDays(p.start_date, 99)
  )
    throw new HttpError(
      400,
      "Vælg i dag eller en fremtidig dag med plads til næste dag i forløbet.",
    );
  const rule = await requirePlanningRules(),
    library = (await catalog("recipe")) as Recipe[];
  const rows = (
    await db().query(
      "SELECT date::text,data,version FROM shaz_meal_days WHERE user_id=$1 AND date BETWEEN $2 AND $3 ORDER BY date",
      [user, input.date, next],
    )
  ).rows;
  if (rows.length !== 2)
    throw new HttpError(
      409,
      "Åbn madplanen for begge dage først, og prøv igen.",
    );
  const fingerprint = hash(
    JSON.stringify({
      profile: p.version,
      rows,
      input: {
        date: input.date,
        slot: input.slot,
        targetSlot: input.targetSlot,
      },
      rule,
      library,
    }),
  );
  const result = batchPlan(
    p.data,
    rows[0].data,
    rows[1].data,
    input.slot,
    input.targetSlot,
    library,
    rule,
    confirm ? crypto.randomUUID() : "preview",
  );
  if (!confirm) return { ...result, fingerprint };
  if (input.fingerprint !== fingerprint)
    throw new HttpError(
      409,
      "Madplanen eller dine valg er ændret. Se en ny forhåndsvisning.",
    );
  await transaction(async (c) => {
    const locked = await c.query(
      "SELECT version FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
      [user],
    );
    if (locked.rows[0]?.version !== p.version)
      throw new HttpError(409, "Profilen er ændret. Se en ny forhåndsvisning.");
    const current = await c.query(
      "SELECT date::text,version FROM shaz_meal_days WHERE user_id=$1 AND date BETWEEN $2 AND $3 ORDER BY date FOR UPDATE",
      [user, input.date, next],
    );
    if (
      JSON.stringify(current.rows) !==
      JSON.stringify(rows.map((r) => ({ date: r.date, version: r.version })))
    )
      throw new HttpError(
        409,
        "Et måltid er ændret på en anden enhed. Se en ny forhåndsvisning.",
      );
    for (const data of [result.first, result.second])
      await c.query(
        "UPDATE shaz_meal_days SET data=$3,version=version+1,updated_at=now() WHERE user_id=$1 AND date=$2",
        [user, data.date, JSON.stringify(data)],
      );
  });
  return { ok: true };
}
export async function unlinkBatch(user: string, id: string) {
  await planningPeriod(user);
  await transaction(async (c) => {
    await c.query(
      "SELECT user_id FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
      [user],
    );
    const rows = await c.query(
      `SELECT date::text,data FROM shaz_meal_days WHERE user_id=$1 AND EXISTS(SELECT 1 FROM jsonb_array_elements(data->'slots') s WHERE s->'batch'->>'id'=$2) ORDER BY date FOR UPDATE`,
      [user, id],
    );
    if (!rows.rowCount)
      throw new HttpError(404, "Sammenkædningen findes ikke på din konto.");
    const lockedCooking = rows.rows.some(
      (r) =>
        r.date < localDate() ||
        (r.data as MealDay).slots.some(
          (s) => s.batch?.id === id && s.status !== "planned",
        ),
    );
    let changed = false;
    for (const r of rows.rows) {
      const d = r.data as MealDay;
      if (r.date < localDate()) continue;
      let rowChanged = false;
      for (const s of d.slots)
        if (s.batch?.id === id && s.status === "planned") {
          delete s.batch;
          // Do not rewrite a cooking/purchase snapshot that is already history.
          // Release future leftovers as empty slots; a new choice is explicit.
          if (lockedCooking) {
            s.previous = s.selected;
            s.selected = null;
          }
          rowChanged = true;
          changed = true;
        }
      if (!rowChanged) continue;
      await c.query(
        "UPDATE shaz_meal_days SET data=$3,version=version+1,updated_at=now() WHERE user_id=$1 AND date=$2",
        [user, r.date, JSON.stringify(d)],
      );
    }
    if (!changed)
      throw new HttpError(
        409,
        "Madlavningen er allerede registreret. Historiske måltider og indkøb bevares.",
      );
  });
  return { ok: true };
}
