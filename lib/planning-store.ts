import { db, transaction } from "./db";
import { profile, activePeriod, planningPeriod } from "./platform";
import { catalog } from "./content";
import { profileSchema, localDate, addDays, type Profile } from "./profile";
import {
  makeMealDay,
  portion,
  portionBounds,
  mealQuality,
  type MealDay,
} from "./meal-plan";
import { nutritionRule, estimate, type NutritionPolicy } from "./nutrition";
import { suitable, type Recipe } from "./recipes";
import { HttpError, hash } from "./security";
import { isolatedTest } from "./test-environment";
export async function requireNoPendingBatches(user: string) {
  const rows = await db().query(
    `SELECT 1 FROM shaz_meal_days WHERE user_id=$1 AND date>=$2
    AND EXISTS(SELECT 1 FROM jsonb_array_elements(data->'slots') s WHERE s->>'status'='planned' AND s ? 'batch') LIMIT 1`,
    [user, localDate()],
  );
  if (rows.rowCount) throw new Error("MEAL_BATCH_LOCKED");
}
export async function requirePlanningRules(): Promise<NutritionPolicy> {
  await catalog("nutrition-rule");
  const review = isolatedTest() || process.env.APP_ENV === "test";
  const rows = await db().query(
    "SELECT data,version,status FROM shaz_content WHERE kind='nutrition-rule' AND id=$1 AND ($2 OR status='published') ORDER BY version DESC LIMIT 1",
    [nutritionRule.id, review],
  );
  if (!rows.rowCount || (!review && process.env.CONTENT_APPROVED !== "true"))
    throw new HttpError(
      503,
      "Beregningsreglerne afventer faglig godkendelse. Testmiljøet kan bruges med fiktive profiler.",
    );
  return {
    ...nutritionRule,
    ...rows.rows[0].data,
    version: rows.rows[0].version,
    status: rows.rows[0].status,
  };
}
export async function mealDays(
  user: string,
  start = localDate(),
  count = 7,
  prepare = true,
) {
  const p = await profile(user);
  if (!p.start_date) return [];
  const first = start < p.start_date ? p.start_date : start,
    last = addDays(p.start_date, 99);
  if (first > last) return [];
  const rule = await requirePlanningRules();
  const rs = (await catalog("recipe")) as Recipe[];
  const end =
    addDays(first, Math.max(0, count - 1)) < last
      ? addDays(first, Math.max(0, count - 1))
      : last;
  const read = () =>
    db().query(
      "SELECT date::text,data,version FROM shaz_meal_days WHERE user_id=$1 AND date BETWEEN $2 AND $3 ORDER BY date",
      [user, first, end],
    );
  let existing = await read();
  const dates = Array.from({ length: count }, (_, i) =>
    addDays(first, i),
  ).filter((d) => d <= last);
  const missing = dates.filter(
    (date) => !existing.rows.some((d) => d.date === date),
  );
  if (prepare && missing.length) {
    const calculation = estimate(p.data, localDate(), rule);
    if (
      p.data.nutrition === "calculated" &&
      (!calculation.available || !calculation.allowed)
    )
      throw new HttpError(
        409,
        calculation.available ? calculation.reason : calculation.explanation,
      );
    const oldRows = await db().query(
      "SELECT *,date::text FROM shaz_meals WHERE user_id=$1 AND date BETWEEN $2 AND $3 ORDER BY slot",
      [user, first, end],
    );
    const days = missing.map((date) => {
      const day = makeMealDay(p.data, date, rs, undefined, rule),
        legacy = oldRows.rows.filter((d) => d.date === date);
      for (let j = 0; j < Math.min(day.slots.length, legacy.length); j++)
        day.slots[j].selected = portion(
          legacy[j].recipe as Recipe,
          Number(legacy[j].servings),
        );
      return { date, data: day };
    });
    await transaction(async (c) => {
      const locked = await c.query(
        "SELECT version FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
        [user],
      );
      if (locked.rows[0]?.version !== p.version)
        throw new HttpError(409, "Profilen er ændret. Indlæs madplanen igen.");
      await c.query(
        "INSERT INTO shaz_meal_days(user_id,date,data) SELECT $1,date,data FROM jsonb_to_recordset($2::jsonb) AS item(date date,data jsonb) ON CONFLICT DO NOTHING",
        [user, JSON.stringify(days)],
      );
    });
    existing = await read();
  }
  return existing.rows.map((d) => ({ ...d, quality: mealQuality(d.data) }));
}
export async function nutritionChange(
  user: string,
  input: Record<string, unknown>,
  confirm: boolean,
) {
  const rule = await requirePlanningRules();
  const old = await planningPeriod(user);
  await requireNoPendingBatches(user);
  const keys = [
    "goal",
    "nutrition",
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
    "mealCount",
    "mealNames",
    "mealTimes",
    "deficitLevel",
    "diet",
    "halal",
    "householdSize",
    "avoid",
    "cookTime",
  ];
  const settings = Object.fromEntries(
    Object.entries(input.settings as Record<string, unknown>).filter(([k]) =>
      keys.includes(k),
    ),
  );
  const p = profileSchema.parse({
    ...old.data,
    ...settings,
    startDate: old.start_date,
    deficitReviewUntil: old.data.deficitReviewUntil,
    aggressiveDaysUsed: old.data.aggressiveDaysUsed,
  });
  if (
    p.nutrition === "calculated" &&
    p.deficitLevel === "aggressive" &&
    p.goal === "fat-loss" &&
    (!p.deficitReviewUntil || p.deficitReviewUntil < localDate())
  ) {
    if (input.reviewAggressive !== true)
      throw new HttpError(
        400,
        "Bekræft først en særskilt 7-dages evaluering. Aggressivt er aldrig standard.",
      );
    const used = p.aggressiveDaysUsed || 0;
    if (used + rule.aggressiveDays > rule.maxAggressiveDays)
      throw new HttpError(
        400,
        "Testpolitikkens maksimum på 14 aggressive dage er nået. Vælg et mindre underskud eller vedligeholdelse.",
      );
    if (used) {
      const c = await db().query(
        "SELECT data FROM shaz_checkins WHERE user_id=$1 ORDER BY week DESC LIMIT 2",
        [user],
      );
      if (
        c.rowCount !== 2 ||
        c.rows.some(
          (r) => r.data.energy === "low" || r.data.recovery === "tired",
        )
      )
        throw new HttpError(
          400,
          "En ny aggressiv uge kræver mindst to ugers registrering og tilfredsstillende restitution. Vælg moderat eller vedligeholdelse.",
        );
    }
    p.deficitReviewUntil = addDays(localDate(), rule.aggressiveDays - 1);
    p.aggressiveDaysUsed = used + rule.aggressiveDays;
  }
  const e = estimate(p, localDate(), rule);
  if (p.nutrition === "calculated" && (!e.available || !e.allowed))
    throw new HttpError(400, e.available ? e.reason : e.explanation);
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
  const rs = (await catalog("recipe")) as Recipe[];
  const previewDate =
    old.start_date > localDate() ? old.start_date : localDate();
  const existing = (
    await db().query(
      "SELECT data,version FROM shaz_meal_days WHERE user_id=$1 AND date=$2",
      [user, previewDate],
    )
  ).rows;
  const preview = makeMealDay(p, previewDate, rs, existing[0]?.data, rule);
  const mealVersions = (
    await db().query(
      "SELECT date::text,version FROM shaz_meal_days WHERE user_id=$1 AND date>=$2 ORDER BY date",
      [user, localDate()],
    )
  ).rows;
  const fingerprint = hash(
    JSON.stringify({ profile: p, version: old.version, mealVersions }),
  );
  if (!confirm)
    return {
      profile: p,
      energy: e,
      day: preview,
      quality: mealQuality(preview),
      version: old.version,
      fingerprint,
    };
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
    if (locked.rows[0]?.version !== input.expectedVersion)
      throw new HttpError(
        409,
        "Din profil er ændret. Se en ny forhåndsvisning før du gemmer.",
      );
    await c.query(
      "UPDATE shaz_profile SET data=$2,version=version+1,updated_at=now() WHERE user_id=$1",
      [user, JSON.stringify(p)],
    );
    const days = await c.query(
      "SELECT date::text,data,version FROM shaz_meal_days WHERE user_id=$1 AND date>=$2 ORDER BY date FOR UPDATE",
      [user, localDate()],
    );
    if (
      JSON.stringify(
        days.rows.map((d) => ({ date: d.date, version: d.version })),
      ) !== JSON.stringify(mealVersions)
    )
      throw new HttpError(
        409,
        "Et måltid blev ændret fra en anden session. Se en ny forhåndsvisning.",
      );
    for (const d of days.rows)
      await c.query(
        "UPDATE shaz_meal_days SET data=$3,version=version+1,updated_at=now() WHERE user_id=$1 AND date=$2",
        [
          user,
          d.date,
          JSON.stringify(makeMealDay(p, d.date, rs, d.data, rule)),
        ],
      );
  });
  return { ok: true };
}
export async function editMeal(
  user: string,
  v: {
    date: string;
    slot: string;
    action: string;
    recipe?: string;
    servings?: number;
    portionPolicy?: string;
    recipeVersion?: number;
    expectedVersion: number;
  },
) {
  const p = await planningPeriod(user);
  const policy = await requirePlanningRules();
  if (
    !["eaten", "skipped", "reopen"].includes(v.action) &&
    p.data.nutrition === "calculated"
  ) {
    const energy = estimate(
      p.data,
      localDate() > v.date ? localDate() : v.date,
      policy,
    );
    if (!energy.available || !energy.allowed)
      throw new HttpError(
        409,
        energy.available ? energy.reason : energy.explanation,
      );
  }
  if (v.date < p.start_date || v.date > addDays(p.start_date, 99))
    throw new HttpError(400, "Vælg en dato i dine 100 dage.");
  const rs = (await catalog("recipe")) as Recipe[];
  await transaction(async (c) => {
    const q = await c.query(
      "SELECT data,version FROM shaz_meal_days WHERE user_id=$1 AND date=$2 FOR UPDATE",
      [user, v.date],
    );
    if (!q.rowCount) throw new HttpError(404, "Madplanen findes ikke.");
    if (q.rows[0].version !== v.expectedVersion)
      throw new HttpError(409, "Planen er ændret. Genindlæs og prøv igen.");
    const day = q.rows[0].data as MealDay,
      s = day.slots.find((s) => s.id === v.slot);
    if (!s) throw new HttpError(404, "Måltidet findes ikke.");
    const records = ["eaten", "skipped", "reopen"].includes(v.action);
    if (s.batch && !records)
      throw new HttpError(
        409,
        "Måltidet indgår i en fælles madlavning. Opløs først sammenkædningen, så indkøb og rester ikke bliver forkerte.",
      );
    if (
      s.batch &&
      v.action === "skipped" &&
      s.batch.cookDate === v.date &&
      s.batch.cookSlot === s.id
    )
      throw new HttpError(
        409,
        "Hvis madlavningen ikke bliver lavet, skal du først opløse sammenkædningen. Derefter kan du springe måltidet over uden at efterlade planlagte rester.",
      );
    if (v.date < localDate() && !records)
      throw new HttpError(409, "Historiske måltider ændres ikke.");
    if (records) {
      if (v.date > localDate())
        throw new HttpError(
          400,
          "Du kan ikke registrere et fremtidigt måltid som spist.",
        );
      if (v.action === "eaten" && !s.selected)
        throw new HttpError(400, "Vælg en opskrift først.");
      s.status =
        v.action === "reopen" ? "planned" : (v.action as "eaten" | "skipped");
    } else {
      if (s.status !== "planned")
        throw new HttpError(
          409,
          "Måltidet er allerede registreret. Ophæv registreringen først, hvis du vil rette det.",
        );
      if (v.action === "remove") {
        s.previous = s.selected;
        s.selected = null;
      } else {
        const recipeId =
          v.action === "undo"
            ? s.previous?.recipe.id
            : v.recipe || s.selected?.recipe.id;
        const r = rs.find((r) => r.id === recipeId);
        if (
          !r ||
          !suitable(r, p.data.diet, p.data.avoid, p.data.cookTime, p.data.halal)
        )
          throw new HttpError(
            400,
            "Opskriften passer ikke til dine kostvalg og udelukkelser.",
          );
        const amount =
          v.action === "undo"
            ? s.previous?.servings
            : (v.servings ??
              s.options.find((o) => o.recipe.id === r.id)?.servings ??
              s.target / (await import("./recipes")).nutrients(r).kcal);
        const b = portionBounds(r);
        if (!amount || amount < b.min || amount > b.max)
          throw new HttpError(
            400,
            `Vælg mellem ${b.min} og ${b.max} portioner.`,
          );
        if (v.recipeVersion !== undefined && v.recipeVersion !== r.version)
          throw new HttpError(
            409,
            "Opskriften er opdateret. Hent de aktuelle alternativer før du bekræfter.",
          );
        const stored =
          v.action === "undo"
            ? s.previous
            : v.action === "choose"
              ? s.options.find(
                  (o) =>
                    o.recipe.id === r.id &&
                    o.servings === amount &&
                    o.portionPolicy === v.portionPolicy,
                )
              : null;
        if (
          stored &&
          (stored.recipe.version !== r.version ||
            !suitable(
              stored.recipe,
              p.data.diet,
              p.data.avoid,
              p.data.cookTime,
              p.data.halal,
            ))
        )
          throw new HttpError(
            409,
            "Det tidligere valg er ændret eller passer ikke længere. Vælg en ny ret.",
          );
        // Reuse the exact previewed/removed snapshot across algorithm releases.
        // Portion edits and new library options use the current cooking increments.
        const selected = stored ? structuredClone(stored) : portion(r, amount);
        if (selected.grams > b.maxGrams)
          throw new HttpError(
            400,
            "Portionen er for stor. Vælg flere måltider eller en anden ret.",
          );
        s.selected = selected;
      }
    }
    await c.query(
      "UPDATE shaz_meal_days SET data=$3,version=version+1,updated_at=now() WHERE user_id=$1 AND date=$2",
      [user, v.date, JSON.stringify(day)],
    );
  });
}
