import { createHash } from "node:crypto";
import { db, transaction, audit } from "./db";
import { profile, validatePlanProfile } from "./platform";
import {
  profileSchema,
  normalizeProfile,
  localDate,
  addDays,
  sessionProfile,
  type Profile,
} from "./profile";
import { catalog } from "./content";
import { generatePlan, type Exercise, type DayPlan } from "./training";
import { generateCardio, cardioRule } from "./cardio";
import { HttpError } from "./security";
import { makeMealDay } from "./meal-plan";
import { requirePlanningRules } from "./planning-store";
import type { Recipe } from "./recipes";

type Change = {
  data?: unknown;
  id?: string;
  locationId?: string;
  minutes?: number;
  scope?: "session" | "week" | "future";
  expectedVersion?: number;
  fingerprint?: string;
};
export async function trainingChange(
  user: string,
  input: Change,
  confirm = false,
) {
  const old = await profile(user);
  if (!old.start_date) throw new HttpError(409, "Aktivér først dit forløb.");
  if (localDate() > addDays(old.start_date, 99))
    throw new HttpError(403, "Forløbet er afsluttet. Din historik bevares.");
  const p = normalizeProfile(profileSchema.parse(input.data ?? old.data));
  p.startDate = old.start_date;
  p.deficitReviewUntil = old.data.deficitReviewUntil;
  p.aggressiveDaysUsed = old.data.aggressiveDaysUsed;
  validatePlanProfile(p);
  if (p.nutrition === "portions")
    for (const key of [
      "age",
      "height",
      "weight",
      "sex",
      "activity",
      "everydayActivity",
      "trainingActivity",
      "dataConsent",
      "calculationSuitable",
      "pregnantOrBreastfeeding",
      "medicalNutrition",
      "eatingDisorderHistory",
    ] as (keyof Profile)[])
      delete p[key];
  const xs = (await catalog("exercise")) as Exercise[];
  const rule = await requirePlanningRules();
  const rs = (await catalog("recipe")) as Recipe[];
  const cardioPolicy =
    (await catalog("cardio-rule")).find((r) => r.id === cardioRule.id) ||
    cardioRule;
  const rows = (
    await db().query(
      "SELECT *,scheduled_date::text FROM shaz_days WHERE user_id=$1 ORDER BY day",
      [user],
    )
  ).rows;
  const drafts = (
    await db().query(
      "SELECT day_id,data,revision FROM shaz_workout_drafts WHERE user_id=$1 ORDER BY day_id",
      [user],
    )
  ).rows;
  const cardios = (
    await db().query(
      "SELECT id,revision,status,scheduled_date::text,log FROM shaz_cardio WHERE user_id=$1 ORDER BY id",
      [user],
    )
  ).rows;
  const mealRows = (
    await db().query(
      "SELECT date::text,version,data FROM shaz_meal_days WHERE user_id=$1 AND date>=$2 ORDER BY date",
      [user, localDate()],
    )
  ).rows;
  const selected = input.id ? rows.find((r) => r.id === input.id) : undefined;
  if (input.id && !selected) throw new HttpError(404, "Passet findes ikke.");
  if (
    selected &&
    (selected.status === "completed" || selected.scheduled_date < localDate())
  )
    throw new HttpError(409, "Et afsluttet eller historisk pas ændres ikke.");
  if (input.locationId && !p.locations!.some((l) => l.id === input.locationId))
    throw new HttpError(400, "Vælg en af dine lokationer.");
  const generated = generatePlan(p, xs, undefined, old.version + 1);
  const changes: {
    id: string;
    date: string;
    before: DayPlan;
    after: DayPlan;
  }[] = [];
  for (const r of rows) {
    const hasWork =
      Object.keys(r.log || {}).length > 0 ||
      drafts.some(
        (d) =>
          d.day_id === r.id &&
          d.data.sets?.some((s: { reps: number }) => s.reps > 0),
      );
    if (
      r.status === "completed" ||
      r.status === "skipped" ||
      r.scheduled_date < localDate()
    )
      continue;
    if (
      !selected &&
      (r.scheduled_date === localDate() ||
        hasWork ||
        r.scheduled_date !== r.plan.date)
    )
      continue;
    if (selected) {
      const scope = input.scope || "session";
      if (scope === "session" && r.id !== selected.id) continue;
      if (scope === "week" && r.plan.week !== selected.plan.week) continue;
      if (scope === "future" && r.scheduled_date < selected.scheduled_date)
        continue;
      if (r.plan.kind !== "workout") continue;
    }
    let next = generated.find((d) => d.day === r.day)!;
    if (selected) {
      const w = new Date(r.scheduled_date + "T12:00:00Z").getUTCDay();
      const modified = normalizeProfile({
        ...p,
        schedule: p.schedule!.map((s) =>
          s.weekday === w
            ? {
                ...s,
                locationId: input.locationId || s.locationId,
                minutes: input.minutes || s.minutes,
              }
            : s,
        ),
      });
      profileSchema.parse(modified);
      next = generatePlan(modified, xs, undefined, old.version + 1).find(
        (d) => d.day === r.day,
      )!;
      // A moved session retains its original movement distribution.
      if (next.kind !== "workout")
        throw new HttpError(
          409,
          "Dette flyttede pas skal tilpasses fra sin ugeplan; den valgte lokation eller dag matcher ikke skabelonen.",
        );
      if (hasWork)
        next = {
          ...next,
          archivedExercises: [
            ...(r.plan.archivedExercises || []),
            ...r.plan.exercises.filter((e: Exercise) =>
              drafts.some(
                (d) =>
                  d.day_id === r.id &&
                  d.data.sets?.some(
                    (s: { exercise: string; reps: number }) =>
                      s.exercise === e.id && s.reps > 0,
                  ),
              ),
            ),
          ],
        };
    }
    if (JSON.stringify(next) !== JSON.stringify(r.plan))
      changes.push({
        id: r.id,
        date: r.scheduled_date,
        before: r.plan,
        after: next,
      });
  }
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        request: {
          profile: p,
          id: input.id,
          locationId: input.locationId,
          minutes: input.minutes,
          scope: input.scope,
        },
        version: old.version,
        rows: rows.map((r) => [
          r.id,
          r.revision,
          r.scheduled_date,
          r.plan,
          r.log,
          r.status,
        ]),
        drafts,
        cardios,
        mealRows: mealRows.map((m) => [m.date, m.version]),
      }),
    )
    .digest("hex");
  if (!confirm)
    return {
      version: old.version,
      fingerprint,
      changes,
      profile: p,
      explanation:
        "Udført arbejde og registrerede måltider bevares. Kaloriemål ændres kun, hvis du udtrykkeligt ændrer kostindstillingerne. Aktivitetsantagelsen bør gennemgås ved ændret træningsmængde.",
    };
  if (
    input.expectedVersion !== old.version ||
    input.fingerprint !== fingerprint
  )
    throw new HttpError(
      409,
      "Planen eller en kladde er ændret på en anden enhed. Se en ny forhåndsvisning.",
    );
  const newCardio = selected ? [] : generateCardio(p, cardioPolicy);
  const newMeals = selected
    ? []
    : mealRows.map((d) => ({
        ...d,
        data: makeMealDay(p, d.date, rs, d.data, rule),
      }));
  await transaction(async (c) => {
    const lock = await c.query(
      "SELECT version FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
      [user],
    );
    if (lock.rows[0]?.version !== input.expectedVersion)
      throw new HttpError(
        409,
        "Profilen er ændret. Genindlæs forhåndsvisningen.",
      );
    const locked = await c.query(
      "SELECT id,revision,plan,log,status,scheduled_date::text FROM shaz_days WHERE user_id=$1 ORDER BY day FOR UPDATE",
      [user],
    );
    if (
      locked.rows.some((r) => {
        const o = rows.find((x) => x.id === r.id);
        return (
          !o ||
          r.revision !== o.revision ||
          JSON.stringify(r.plan) !== JSON.stringify(o.plan) ||
          JSON.stringify(r.log) !== JSON.stringify(o.log) ||
          r.status !== o.status ||
          r.scheduled_date !== o.scheduled_date
        );
      })
    )
      throw new HttpError(409, "Et pas er ændret. Hent et nyt preview.");
    const currentDrafts = (
      await c.query(
        "SELECT day_id,data,revision FROM shaz_workout_drafts WHERE user_id=$1 ORDER BY day_id FOR UPDATE",
        [user],
      )
    ).rows;
    const currentCardio = (
      await c.query(
        "SELECT id,revision,status,scheduled_date::text,log FROM shaz_cardio WHERE user_id=$1 ORDER BY id FOR UPDATE",
        [user],
      )
    ).rows;
    if (
      JSON.stringify(currentDrafts) !== JSON.stringify(drafts) ||
      JSON.stringify(currentCardio) !== JSON.stringify(cardios)
    )
      throw new HttpError(
        409,
        "En kladde eller cardio er ændret. Hent et nyt preview.",
      );
    await c.query(
      "UPDATE shaz_profile SET data=$2,version=version+1,updated_at=now() WHERE user_id=$1",
      [user, JSON.stringify(selected ? old.data : p)],
    );
    for (const change of changes)
      await c.query(
        "UPDATE shaz_days SET plan=$3,status=$4,revision=revision+1,updated_at=now() WHERE user_id=$1 AND id=$2",
        [
          user,
          change.id,
          JSON.stringify(change.after),
          change.after.kind === "rest" ? "rest" : "planned",
        ],
      );
    if (!selected) {
      await c.query(
        "UPDATE shaz_cardio SET status='removed',revision=revision+1 WHERE user_id=$1 AND scheduled_date>$2 AND status='planned' AND log='{}'::jsonb",
        [user, localDate()],
      );
      for (const d of newCardio)
        if (d.date > localDate())
          await c.query(
            "INSERT INTO shaz_cardio(id,user_id,day,scheduled_date,plan) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,day) DO UPDATE SET plan=$5,scheduled_date=$4,status='planned',revision=shaz_cardio.revision+1 WHERE shaz_cardio.status IN ('planned','removed') AND shaz_cardio.log='{}'::jsonb AND shaz_cardio.scheduled_date>$6",
            [
              crypto.randomUUID(),
              user,
              d.day,
              d.date,
              JSON.stringify(d),
              localDate(),
            ],
          );
      for (const m of newMeals) {
        const result = await c.query(
          "UPDATE shaz_meal_days SET data=$3,version=version+1 WHERE user_id=$1 AND date=$2 AND version=$4",
          [user, m.date, JSON.stringify(m.data), m.version],
        );
        if (!result.rowCount)
          throw new HttpError(409, "Et måltid er ændret. Se et nyt preview.");
      }
    }
  });
  await audit(user, "training_change", user, {
    scope: input.scope || "future",
    sessions: changes.length,
  });
  return {
    ok: true,
    message: "Planen er gemt. Dine gennemførte pas og sæt er bevaret.",
  };
}
