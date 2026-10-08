import { db, transaction } from "./db";
import { profile, activePeriod } from "./platform";
import { localDate, addDays, profileSchema, type Profile } from "./profile";
import {
  generateCardio,
  weekProblems,
  cardioRule,
  type CardioPlan,
} from "./cardio";
import { catalog } from "./content";
import { HttpError } from "./security";
import { estimate } from "./nutrition";
import { requirePlanningRules } from "./planning-store";
export async function syncCardio(user: string, p: Profile, from = localDate()) {
  const rule =
    (await catalog("cardio-rule")).find((r) => r.id === cardioRule.id) ||
    cardioRule;
  const plans = generateCardio(p, rule);
  await transaction(async (c) => {
    await c.query(
      "SELECT user_id FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
      [user],
    );
    await c.query(
      "UPDATE shaz_cardio SET status='removed',updated_at=now() WHERE user_id=$1 AND scheduled_date>=$2 AND status='planned' AND log='{}'::jsonb",
      [user, from],
    );
    for (const d of plans)
      if (d.date >= from)
        await c.query(
          `INSERT INTO shaz_cardio(id,user_id,day,scheduled_date,plan) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,day) DO UPDATE SET plan=$5,scheduled_date=$4,status='planned',updated_at=now() WHERE shaz_cardio.status IN ('planned','removed') AND shaz_cardio.log='{}'::jsonb AND shaz_cardio.scheduled_date>=$6`,
          [crypto.randomUUID(), user, d.day, d.date, JSON.stringify(d), from],
        );
  });
}
export async function cardioRows(user: string) {
  return (
    await db().query(
      "SELECT id,day,scheduled_date::text,plan,status,log FROM shaz_cardio WHERE user_id=$1 ORDER BY scheduled_date",
      [user],
    )
  ).rows;
}
export async function cardioSettings(
  user: string,
  input: Record<string, unknown>,
  confirm: boolean,
) {
  const nutritionRule = await requirePlanningRules();
  const old = await activePeriod(user),
    p = profileSchema.parse({
      ...old.data,
      cardio: input.cardio,
      startDate: old.start_date,
    });
  const rule =
    (await catalog("cardio-rule")).find((r) => r.id === cardioRule.id) ||
    cardioRule;
  const energy = estimate(p, localDate(), nutritionRule);
  if (p.nutrition === "calculated" && (!energy.available || !energy.allowed))
    throw new HttpError(
      400,
      "Tilpas først dit kaloriemål i beregneren: " +
        (energy.available ? energy.reason : energy.explanation),
    );
  const issues = weekProblems(p, rule);
  if (issues.length) throw new HttpError(400, issues.join(" "));
  const weeklyMinutes =
    p.days * p.minutes + (p.cardio?.days || 0) * (p.cardio?.minutes || 0);
  const suggestion =
    weeklyMinutes > 300 ? "heavy" : weeklyMinutes < 150 ? "light" : "regular";
  if (!confirm)
    return {
      plan: generateCardio(p, rule)
        .filter((d) => d.date >= localDate())
        .slice(0, 4),
      version: old.version,
      activitySuggestion: suggestion,
      explanation:
        "Ændringen påvirker ikke dit kaloriemål. Hvis din samlede træning er ændret, kan du selv godkende en ny aktivitetsantagelse i beregneren.",
    };
  const r = await db().query(
    "UPDATE shaz_profile SET data=$2,version=version+1,updated_at=now() WHERE user_id=$1 AND version=$3 RETURNING user_id",
    [user, JSON.stringify(p), input.expectedVersion],
  );
  if (!r.rowCount)
    throw new HttpError(409, "Profilen er ændret. Se en ny forhåndsvisning.");
  await syncCardio(user, p);
  return { ok: true };
}
export async function editCardio(
  user: string,
  v: {
    id: string;
    action: string;
    option?: string;
    date?: string;
    minutes?: number;
    distance?: number;
    effort?: number;
  },
) {
  const p = await activePeriod(user);
  await requirePlanningRules();
  await transaction(async (c) => {
    const q = await c.query(
      "SELECT *,scheduled_date::text FROM shaz_cardio WHERE id=$1 AND user_id=$2 FOR UPDATE",
      [v.id, user],
    );
    if (!q.rowCount) throw new HttpError(404, "Passet findes ikke.");
    const row = q.rows[0],
      plan = row.plan as CardioPlan;
    if (v.action === "log") {
      if (row.scheduled_date > localDate() || row.status === "removed")
        throw new HttpError(400, "Passet kan ikke registreres på denne dato.");
      await c.query(
        "UPDATE shaz_cardio SET log=$3,status='completed',updated_at=now() WHERE id=$1 AND user_id=$2",
        [
          v.id,
          user,
          JSON.stringify({
            minutes: v.minutes,
            distance: v.distance,
            effort: v.effort,
          }),
        ],
      );
      return;
    }
    if (row.status === "completed" || row.scheduled_date < localDate())
      throw new HttpError(
        409,
        "Et gennemført eller historisk pas ændres ikke.",
      );
    if (v.action === "swap") {
      const option = plan.options.find((o) => o.id === v.option);
      if (!option)
        throw new HttpError(400, "Vælg et af passets egnede alternativer.");
      await c.query(
        "UPDATE shaz_cardio SET plan=$3,updated_at=now() WHERE id=$1 AND user_id=$2",
        [v.id, user, JSON.stringify({ ...plan, selected: option })],
      );
    } else if (v.action === "move") {
      if (!v.date || v.date < localDate() || v.date > addDays(p.start_date, 98))
        throw new HttpError(400, "Vælg en dato før afslutningsdagen.");
      const strength = await c.query(
        "SELECT 1 FROM shaz_days WHERE user_id=$1 AND scheduled_date=$2 AND plan->>'kind'='workout' AND status<>'skipped'",
        [user, v.date],
      );
      const other = await c.query(
        "SELECT 1 FROM shaz_cardio WHERE user_id=$1 AND id<>$2 AND scheduled_date=$3 AND status IN ('planned','completed')",
        [user, v.id, v.date],
      );
      if (
        other.rowCount ||
        (strength.rowCount &&
          (p.data.cardio?.intensity !== "easy" || plan.selected.minutes > 20))
      )
        throw new HttpError(
          400,
          "Den dag har allerede belastning, der ikke passer sammen med dette pas. Vælg en anden dag.",
        );
      const dates = await c.query(
        "SELECT scheduled_date::text AS date FROM shaz_days WHERE user_id=$1 AND plan->>'kind'='workout' AND status<>'skipped' UNION SELECT scheduled_date::text FROM shaz_cardio WHERE user_id=$1 AND id<>$2 AND status IN ('planned','completed')",
        [user, v.id],
      );
      const active = new Set([...dates.rows.map((r) => r.date), v.date]);
      for (let offset = -6; offset <= 0; offset++) {
        const start = addDays(v.date, offset);
        if (
          Array.from({ length: 7 }, (_, i) => addDays(start, i)).every((d) =>
            active.has(d),
          )
        )
          throw new HttpError(
            400,
            "Flytningen fjerner den sidste restitutionsdag. Vælg en anden dato.",
          );
      }
      await c.query(
        "UPDATE shaz_cardio SET scheduled_date=$3,updated_at=now() WHERE id=$1 AND user_id=$2",
        [v.id, user, v.date],
      );
    } else
      await c.query(
        "UPDATE shaz_cardio SET status=$3,updated_at=now() WHERE id=$1 AND user_id=$2",
        [v.id, user, v.action === "skip" ? "skipped" : "removed"],
      );
  });
}
