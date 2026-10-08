import { db, transaction, audit } from "./db";
import {
  profileSchema,
  profileFields,
  defaults,
  Profile,
  localDate,
  dayNumber,
  addDays,
} from "./profile";
import { generatePlan, Exercise, DayPlan } from "./training";
import { catalog } from "./content";
import { HttpError } from "./security";
export async function profile(user: string) {
  const r = await db().query(
    "SELECT *,start_date::text FROM shaz_profile WHERE user_id=$1",
    [user],
  );
  return (
    r.rows[0] || {
      user_id: user,
      step: 0,
      data: { ...defaults, startDate: localDate() },
      start_date: null,
      version: 1,
    }
  );
}
export async function saveProfile(user: string, data: unknown, step: number) {
  const p = (step < 7 ? profileFields : profileSchema).parse(data);
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
  const p = profileSchema.parse(old.data);
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
  await audit(user, "activate", user, { startDate: p.startDate });
}
export async function changeFuture(user: string, data: unknown) {
  const old = await profile(user),
    p = profileSchema.parse(data);
  p.startDate = old.start_date || p.startDate;
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
        `UPDATE shaz_days SET plan=$3,status=$4,updated_at=now() WHERE user_id=$1 AND day=$2 AND scheduled_date>($5::date) AND status IN ('planned','rest') AND log='{}'::jsonb`,
        [
          user,
          d.day,
          JSON.stringify(d),
          d.kind === "rest" ? "rest" : "planned",
          localDate(),
        ],
      );
  });
  await audit(user, "change_future_plan", user);
}
export async function snapshot(user: string) {
  const p = await profile(user);
  const [days, meals, favorites, checks, weights, shopping, rs, xs] =
    await Promise.all([
      db().query(
        "SELECT id,day,scheduled_date::text,plan,status,log,completed_at FROM shaz_days WHERE user_id=$1 ORDER BY day",
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
        "SELECT week,ingredient_id,checked FROM shaz_shopping WHERE user_id=$1",
        [user],
      ),
      catalog("recipe"),
      catalog("exercise"),
    ]);
  const expired = p.start_date && dayNumber(p.start_date) > 100;
  const help = await catalog("help");
  return {
    help,
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
