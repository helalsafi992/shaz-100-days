import { db, transaction, audit } from "./db";
import {
  profileSchema,
  profileFields,
  defaults,
  Profile,
  localDate,
  dayNumber,
  addDays,
  normalizeProfile,
} from "./profile";
import { generatePlan, Exercise, DayPlan } from "./training";
import { catalog } from "./content";
import { estimate } from "./nutrition";
import { weekProblems } from "./cardio";
import { HttpError } from "./security";
export async function profile(user: string) {
  const r = await db().query(
    "SELECT *,start_date::text FROM shaz_profile WHERE user_id=$1",
    [user],
  );
  const result = r.rows[0] || {
    user_id: user,
    step: 0,
    data: { ...defaults, startDate: localDate() },
    start_date: null,
    version: 1,
  };
  result.data = normalizeProfile(result.data);
  return result;
}
export async function saveProfile(user: string, data: unknown, step: number) {
  const p = normalizeProfile(
    (step < 7 ? profileFields : profileSchema).parse(data),
  );
  const old = await profile(user);
  p.deficitReviewUntil = old.data.deficitReviewUntil;
  p.aggressiveDaysUsed = old.data.aggressiveDaysUsed;
  if (step >= 7) validatePlanProfile(p);
  if (p.nutrition === "portions") {
    delete p.age;
    delete p.height;
    delete p.weight;
    delete p.sex;
    delete p.activity;
    delete p.dataConsent;
    delete p.calculationSuitable;
  }
  await db().query(
    `INSERT INTO shaz_profile(user_id,step,data) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET step=$2,data=$3,updated_at=now()`,
    [user, step, JSON.stringify(p)],
  );
  return p;
}
export async function activate(user: string) {
  const old = await profile(user);
  const p = normalizeProfile(profileSchema.parse(old.data));
  validatePlanProfile(p);
  if (p.startDate < localDate() || p.startDate > addDays(localDate(), 90))
    throw new HttpError(
      400,
      "Vælg en startdato fra i dag og højst 90 dage frem.",
    );
  const [xs, fs, templates] = await Promise.all([
    catalog("exercise"),
    catalog("focus"),
    catalog("template"),
  ]);
  const template =
    templates.find((t) => t.id === `${p.place}-${p.level}-${p.days}`) ||
    templates.find(
      (t) => t.place === p.place && t.level === p.level && t.days === p.days,
    );
  if (!template)
    throw new HttpError(503, "Programmet afventer indholdsgennemgang.");
  const plan = generatePlan(
    p,
    xs as Exercise[],
    Array.from(
      { length: 15 },
      (_, i) => fs.find((f) => f.id === String(i + 1))?.text || "",
    ),
    1,
    template,
  );
  await transaction(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [user]);
    const r = await c.query(
      "SELECT start_date FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
      [user],
    );
    if (r.rows[0]?.start_date)
      throw new HttpError(409, "Forløbet er allerede aktiveret.");
    await c.query(
      "UPDATE shaz_profile SET start_date=$2,updated_at=now() WHERE user_id=$1",
      [user, p.startDate],
    );
    for (const d of plan)
      await c.query(
        "INSERT INTO shaz_days(id,user_id,day,scheduled_date,plan,status) VALUES($1,$2,$3,$4,$5,$6)",
        [
          crypto.randomUUID(),
          user,
          d.day,
          d.date,
          JSON.stringify({ ...d, templateVersion: template.version }),
          d.kind === "rest" ? "rest" : "planned",
        ],
      );
  });
  await (await import("./cardio-store")).syncCardio(user, p, p.startDate);
  await audit(user, "activate", user, { startDate: p.startDate });
}
export async function changeFuture(user: string, data: unknown) {
  const old = await profile(user),
    p = profileSchema.parse(data);
  p.startDate = old.start_date || p.startDate;
  p.deficitReviewUntil = old.data.deficitReviewUntil;
  p.aggressiveDaysUsed = old.data.aggressiveDaysUsed;
  validatePlanProfile(p);
  if (p.nutrition === "portions") {
    delete p.age;
    delete p.height;
    delete p.weight;
    delete p.sex;
    delete p.activity;
    delete p.dataConsent;
    delete p.calculationSuitable;
  }
  const templates = await catalog("template");
  const template = templates.find(
    (t) => t.place === p.place && t.level === p.level && t.days === p.days,
  );
  const plan = generatePlan(
    p,
    (await catalog("exercise")) as Exercise[],
    undefined,
    (old.version || 1) + 1,
    template,
  );
  await transaction(async (c) => {
    await c.query(
      "SELECT user_id FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
      [user],
    );
    await c.query(
      "UPDATE shaz_profile SET data=$2,version=version+1,updated_at=now() WHERE user_id=$1",
      [user, JSON.stringify(p)],
    );
    for (const d of plan)
      await c.query(
        `UPDATE shaz_days SET plan=$3,status=$4,updated_at=now() WHERE user_id=$1 AND day=$2 AND scheduled_date>($5::date) AND status IN ('planned','rest') AND log='{}'::jsonb AND NOT EXISTS(SELECT 1 FROM shaz_workout_drafts wd WHERE wd.day_id=shaz_days.id)`,
        [
          user,
          d.day,
          JSON.stringify(d),
          d.kind === "rest" ? "rest" : "planned",
          localDate(),
        ],
      );
  });
  await (
    await import("./cardio-store")
  ).syncCardio(user, p, addDays(localDate(), 1));
  const rs = await catalog("recipe");
  const { makeMealDay } = await import("./meal-plan");
  const hasMeals = await db().query(
    "SELECT 1 FROM shaz_meal_days WHERE user_id=$1 LIMIT 1",
    [user],
  );
  if (hasMeals.rowCount) {
    const rule = await (
      await import("./planning-store")
    ).requirePlanningRules();
    await transaction(async (c) => {
      const rows = await c.query(
        "SELECT date::text,data FROM shaz_meal_days WHERE user_id=$1 AND date>=$2 FOR UPDATE",
        [user, localDate()],
      );
      for (const d of rows.rows)
        await c.query(
          "UPDATE shaz_meal_days SET data=$3,version=version+1 WHERE user_id=$1 AND date=$2",
          [
            user,
            d.date,
            JSON.stringify(
              makeMealDay(
                p,
                d.date,
                rs as import("./recipes").Recipe[],
                d.data,
                rule,
              ),
            ),
          ],
        );
    });
  }
  await audit(user, "change_future_plan", user);
}
export async function snapshot(user: string) {
  const p = await profile(user);
  const [days, meals, favorites, checks, weights, shopping, rs, xs] =
    await Promise.all([
      db().query(
        "SELECT id,day,scheduled_date::text,plan,status,log,completed_at,revision FROM shaz_days WHERE user_id=$1 ORDER BY day",
        [user],
      ),
      db().query(
        "SELECT *,date::text FROM shaz_meals WHERE user_id=$1 ORDER BY shaz_meals.date,slot",
        [user],
      ),
      db().query("SELECT recipe_id FROM shaz_favorites WHERE user_id=$1", [
        user,
      ]),
      db().query(
        "SELECT *,created_at::text FROM shaz_checkins WHERE user_id=$1 ORDER BY week",
        [user],
      ),
      db().query(
        "SELECT date::text,kg FROM shaz_weights WHERE user_id=$1 ORDER BY date",
        [user],
      ),
      db().query(
        "SELECT week,ingredient_id,checked,checked_grams FROM shaz_shopping WHERE user_id=$1",
        [user],
      ),
      catalog("recipe"),
      catalog("exercise"),
    ]);
  const expired = p.start_date && dayNumber(p.start_date) > 100;
  const help = await catalog("help");
  return {
    help,
    accountId: user,
    drafts: (
      await db().query(
        "SELECT day_id,data,revision,updated_at FROM shaz_workout_drafts WHERE user_id=$1",
        [user],
      )
    ).rows,
    cardio: await (await import("./cardio-store")).cardioRows(user),
    profile: p,
    day: p.start_date ? dayNumber(p.start_date) : 0,
    today: localDate(),
    days: expired
      ? days.rows.map((d) => ({
          ...d,
          plan: {
            ...d.plan,
            warmup: [],
            exercises:
              d.status === "completed"
                ? d.plan.exercises.map((e: Exercise) => ({
                    ...e,
                    instructions: [],
                    cue: "",
                    videoId: undefined,
                  }))
                : [],
          },
        }))
      : days.rows,
    meals: meals.rows,
    favorites: favorites.rows.map((r) => r.recipe_id),
    checkins: checks.rows,
    weights: weights.rows,
    shopping: shopping.rows,
    recipes: expired ? [] : rs,
    exercises: expired ? [] : xs,
    reviewMode: process.env.STRIPE_MODE !== "live",
  };
}
export async function ownedDay(user: string, id: string) {
  const r = await db().query(
    "SELECT *,scheduled_date::text FROM shaz_days WHERE id=$1 AND user_id=$2",
    [id, user],
  );
  if (!r.rowCount) throw new HttpError(404, "Træningen blev ikke fundet.");
  return r.rows[0] as {
    id: string;
    plan: DayPlan;
    scheduled_date: string;
    status: string;
    log: Record<string, unknown>;
  };
}
export async function activePeriod(user: string) {
  const p = await profile(user);
  if (
    !p.start_date ||
    dayNumber(p.start_date) < 1 ||
    dayNumber(p.start_date) > 100
  )
    throw new HttpError(
      403,
      "Registrering er tilgængelig i dine 100 aktive dage. Dit overblik bevares.",
    );
  return p;
}
export async function planningPeriod(user: string) {
  const p = await profile(user);
  if (!p.start_date || dayNumber(p.start_date) > 100)
    throw new HttpError(
      403,
      "Planlægning er tilgængelig fra valgt start og gennem dine 100 dage.",
    );
  return p;
}

export function validatePlanProfile(p: Profile) {
  const issues = weekProblems(p);
  if (issues.length) throw new HttpError(400, issues.join(" "));
  if (p.nutrition === "calculated") {
    const e = estimate(p, localDate());
    if (!e.available || !e.allowed)
      throw new HttpError(400, e.available ? e.reason : e.explanation);
  }
}
