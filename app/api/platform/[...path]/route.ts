import { scheduledStrength } from "@/lib/schedule-breaks";
import { scheduleBreaks, assertNoBreak } from "@/lib/break-store";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { access, session, admin, acceptInvite, requestLogin } from "@/lib/auth";
import { db, schema, transaction, audit } from "@/lib/db";
import {
  sameOrigin,
  body,
  failure,
  HttpError,
  rate,
  opaque,
  hash,
  baseURL,
} from "@/lib/security";
import {
  profile,
  saveProfile,
  activate,
  changeFuture,
  snapshot,
  ownedDay,
  activePeriod,
  planningPeriod,
} from "@/lib/platform";
import { profileSchema, localDate, dayNumber, addDays } from "@/lib/profile";
import { alternatives, Exercise, DayPlan } from "@/lib/training";
import { catalog, seedContent } from "@/lib/content";
import { ingredients, suitable, Recipe } from "@/lib/recipes";
import { saveDraft } from "@/lib/workout-store";
import { deliver, sendMail } from "@/lib/mail";
import { missingConfiguration, salesOpen } from "@/lib/payments";
const id = z.string().min(1).max(100),
  date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await params).path.join("/");
    const s =
      path === "export" || path === "orders"
        ? await session(req.headers)
        : path.startsWith("admin")
          ? await admin(req.headers)
          : await access(req.headers);
    if (path === "state")
      return Response.json(await snapshot(s.user.id), {
        headers: { "Cache-Control": "no-store" },
      });
    if (path === "orders") {
      const r = await db().query(
        "SELECT id,amount,currency,status,created_at,receipt,refunded_amount,livemode FROM shaz_orders WHERE user_id=$1 OR lower(email)=lower($2) ORDER BY created_at DESC",
        [s.user.id, s.user.email],
      );
      return Response.json(r.rows);
    }
    if (path === "export") {
      const result: Record<string, unknown> = {
        account: { email: s.user.email, createdAt: s.user.createdAt },
      };
      for (const table of [
        "shaz_profile",
        "shaz_meal_days",
        "shaz_cardio",
        "shaz_workout_drafts",
        "shaz_schedule_breaks",
        "shaz_days",
        "shaz_meals",
        "shaz_weights",
        "shaz_checkins",
        "shaz_favorites",
        "shaz_shopping",
        "shaz_refunds",
        "shaz_requests",
      ])
        result[table] = (
          await db().query(`SELECT * FROM ${table} WHERE user_id=$1`, [
            s.user.id,
          ])
        ).rows;
      result.orders = (
        await db().query(
          "SELECT id,amount,currency,status,created_at,receipt,refunded_amount FROM shaz_orders WHERE user_id=$1 OR lower(email)=lower($2)",
          [s.user.id, s.user.email],
        )
      ).rows;
      return Response.json(result, {
        headers: {
          "Content-Disposition": 'attachment; filename="shaz-mine-data.json"',
          "Cache-Control": "no-store",
        },
      });
    }
    if (path === "admin") {
      await seedContent();
      const role = (await admin(req.headers)).role;
      if (role === "editor") {
        const rows = await db().query(
          "SELECT DISTINCT ON(kind,id) * FROM shaz_content ORDER BY kind,id,version DESC",
        );
        return Response.json(
          {
            role,
            content: rows.rows,
            customers: [],
            orders: [],
            mail: [],
            audit: [],
            refunds: [],
            requests: [],
            missing: [],
            salesOpen: salesOpen(),
            totals: { revenue: 0, test_orders: 0, activated: 0 },
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      const [customers, orders, mail, content, log, refunds, totals] =
        await Promise.all([
          db().query(
            `SELECT u.id,u.email,u."createdAt",p.start_date,p.step,COUNT(d.id) FILTER(WHERE d.status='completed')::int AS completed FROM shaz_user u LEFT JOIN shaz_profile p ON p.user_id=u.id LEFT JOIN shaz_days d ON d.user_id=u.id GROUP BY u.id,p.start_date,p.step ORDER BY u."createdAt" DESC LIMIT 200`,
          ),
          db().query(
            "SELECT id,email,status,amount,refunded_amount,livemode,created_at FROM shaz_orders ORDER BY created_at DESC LIMIT 200",
          ),
          db().query(
            "SELECT id,kind,status,attempts,error_code,created_at,delivered_at FROM shaz_mail ORDER BY created_at DESC LIMIT 100",
          ),
          db().query(
            "SELECT DISTINCT ON(kind,id) * FROM shaz_content ORDER BY kind,id,version DESC",
          ),
          db().query(
            "SELECT * FROM shaz_audit ORDER BY created_at DESC LIMIT 100",
          ),
          db().query(
            "SELECT id,order_id,reason,status,created_at FROM shaz_refunds ORDER BY created_at DESC",
          ),
          db().query(
            "SELECT COALESCE(SUM(amount-refunded_amount) FILTER(WHERE livemode AND status='paid'),0)::int AS revenue,COUNT(*) FILTER(WHERE NOT livemode)::int AS test_orders,(SELECT count(*)::int FROM shaz_profile WHERE start_date IS NOT NULL) AS activated FROM shaz_orders",
          ),
        ]);
      return Response.json(
        {
          role,
          totals: totals.rows[0],
          customers: customers.rows,
          orders: orders.rows,
          mail: mail.rows,
          content: content.rows,
          audit: log.rows,
          refunds: refunds.rows,
          requests: (
            await db().query(
              "SELECT id,kind,email,order_reference,message,status,created_at FROM shaz_requests ORDER BY created_at DESC LIMIT 200",
            )
          ).rows,
          missing: missingConfiguration(),
          salesOpen: salesOpen(),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    throw new HttpError(404, "Siden findes ikke.");
  } catch (e) {
    return failure(e);
  }
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    sameOrigin(req);
    await schema();
    const path = (await params).path.join("/");
    const input = await body(req);
    if (path === "invite") {
      const s = await session(req.headers);
      await acceptInvite(
        req.headers,
        z.object({ token: id }).parse(input).token,
      );
      await audit(s.user.id, "accept_invitation", s.user.id);
      return Response.json({ ok: true });
    }
    if (path.startsWith("admin/")) return await adminAction(req, path, input);
    if (path === "refund") {
      const s = await session(req.headers);
      const p = z
        .object({
          orderId: id,
          reason: z.enum(["withdrawal", "access", "content", "other"]),
        })
        .parse(input);
      const own = await db().query(
        "SELECT id FROM shaz_orders WHERE id=$1 AND (user_id=$2 OR lower(email)=lower($3))",
        [p.orderId, s.user.id, s.user.email],
      );
      if (!own.rowCount) throw new HttpError(404, "Ordren findes ikke.");
      await db().query(
        `INSERT INTO shaz_refunds(id,user_id,order_id,reason) VALUES($1,$2,$3,$4) ON CONFLICT(order_id) DO NOTHING`,
        [crypto.randomUUID(), s.user.id, p.orderId, p.reason],
      );
      await audit(s.user.id, "refund_requested", p.orderId);
      return Response.json({
        message:
          "Din anmodning er gemt med dagens dato. Den afventer behandling; betalingen er ikke refunderet endnu.",
      });
    }
    if (path === "clear-weights") {
      const s = await session(req.headers);
      await db().query("DELETE FROM shaz_weights WHERE user_id=$1", [
        s.user.id,
      ]);
      return Response.json({
        message: "Dine frivillige vægtregistreringer er slettet.",
      });
    }
    if (path === "delete") {
      const s = await session(req.headers);
      z.object({ confirmation: z.literal("SLET MIN KONTO") }).parse(input);
      const role = await db().query(
        "SELECT 1 FROM shaz_roles WHERE user_id=$1",
        [s.user.id],
      );
      if (role.rowCount)
        throw new HttpError(
          409,
          "Ejerskab skal overdrages, før en administratorkonto slettes.",
        );
      await transaction(async (c) => {
        await c.query("UPDATE shaz_orders SET user_id=NULL WHERE user_id=$1", [
          s.user.id,
        ]);
        await c.query("DELETE FROM shaz_mail WHERE lower(email)=lower($1)", [
          s.user.email,
        ]);
        await c.query(
          "DELETE FROM shaz_checkout WHERE lower(email)=lower($1)",
          [s.user.email],
        );
        await c.query("DELETE FROM shaz_user WHERE id=$1", [s.user.id]);
        await c.query(
          "UPDATE shaz_audit SET actor_id=NULL,details='{}' WHERE actor_id=$1",
          [s.user.id],
        );
      });
      return Response.json({
        message:
          "Konto og forløbsdata er slettet. Nødvendige købs- og refusionsoplysninger bevares særskilt efter gældende opbevaringskrav.",
      });
    }
    const s = await access(req.headers);
    await rate("action:" + s.user.id, 180, 5);
    if (path === "profile") {
      const p = z
        .object({ data: z.unknown(), step: z.number().int().min(0).max(7) })
        .parse(input);
      const current = await profile(s.user.id);
      if (current.start_date)
        throw new HttpError(
          409,
          "Se og bekræft først ændringerne via Tilpas plan.",
        );
      else await saveProfile(s.user.id, p.data, p.step);
      return Response.json({ ok: true });
    }
    if (path === "activate") {
      z.object({ confirmStart: z.literal(true) }).parse(input);
      await activate(s.user.id);
      return Response.json({ ok: true });
    }
    const p = await ([
      "shopping",
      "favorite",
      "reschedule",
      "swap-exercise",
      "remove-exercise",
      "restore-exercise",
    ].includes(path)
      ? planningPeriod(s.user.id)
      : activePeriod(s.user.id));
    if (path === "workout-draft") {
      const v = z
        .object({
          id,
          revision: z.number().int().min(0),
          timerEnd: z
            .number()
            .min(0)
            .max(Date.now() + 60 * 60 * 1000),
          sets: z
            .array(
              z.object({
                exercise: id,
                set: z.number().int().min(1).max(4),
                reps: z.number().int().min(0).max(100),
                kg: z.number().min(0).max(500),
                effort: z.number().min(1).max(10),
              }),
            )
            .max(80),
        })
        .parse(input);
      return Response.json(await saveDraft(s.user.id, v));
    }
    if (path === "workout") {
      const v = z
        .object({
          id,
          complete: z.boolean(),
          sets: z
            .array(
              z.object({
                exercise: id,
                set: z.number().int().min(1).max(4),
                reps: z.number().int().min(0).max(100),
                kg: z.number().min(0).max(500),
                effort: z.number().min(1).max(10),
              }),
            )
            .max(80),
        })
        .parse(input);
      return await transaction(async (c) => {
        await c.query(
          "SELECT user_id FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
          [s.user.id],
        );
        const q = await c.query(
          "SELECT *,scheduled_date::text FROM shaz_days WHERE user_id=$1 AND id=$2 FOR UPDATE",
          [s.user.id, v.id],
        );
        if (!q.rowCount) throw new HttpError(404, "Træningen findes ikke.");
        const d = q.rows[0] as Awaited<ReturnType<typeof ownedDay>>;
        if (d.status !== "completed")
          await assertNoBreak(c, s.user.id, d.scheduled_date);
        if (d.plan.kind !== "workout" || d.scheduled_date > localDate())
          throw new HttpError(
            400,
            "Træningen kan først registreres på dens dato.",
          );
        if (
          v.sets.some(
            (set) =>
              ![
                ...d.plan.exercises,
                ...(d.plan.archivedExercises || []),
                ...(d.plan.removedExercises || []),
              ].some((e) => e.id === set.exercise && set.set <= e.sets),
          ) ||
          new Set(v.sets.map((x) => x.exercise + ":" + x.set)).size !==
            v.sets.length
        )
          throw new HttpError(400, "Registreringen passer ikke til træningen.");
        if (v.complete && (!v.sets.length || v.sets.every((x) => x.reps === 0)))
          throw new HttpError(400, "Registrér mindst ét gennemført sæt.");
        await c.query(
          `UPDATE shaz_days SET log=$3,status=$4,plan=$5,completed_at=CASE WHEN $4='completed' THEN COALESCE(completed_at,now()) ELSE NULL END,updated_at=now() WHERE id=$1 AND user_id=$2`,
          [
            v.id,
            s.user.id,
            JSON.stringify({ sets: v.sets }),
            v.complete ? "completed" : "planned",
            JSON.stringify(
              v.complete
                ? scheduledStrength(d, await scheduleBreaks(s.user.id, c)).plan
                : d.plan,
            ),
          ],
        );
        return Response.json({ ok: true });
      });
    }
    if (
      path === "swap-exercise" ||
      path === "remove-exercise" ||
      path === "restore-exercise"
    ) {
      const v = z
        .object({ id, exercise: id, replacement: id.optional() })
        .parse(input);
      const exerciseCatalog = (await catalog("exercise")) as Exercise[];
      return await transaction(async (c) => {
        await c.query(
          "SELECT user_id FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
          [s.user.id],
        );
        const q = await c.query(
          "SELECT *,scheduled_date::text FROM shaz_days WHERE user_id=$1 AND id=$2 FOR UPDATE",
          [s.user.id, v.id],
        );
        if (!q.rowCount) throw new HttpError(404, "Træningen findes ikke.");
        const d = q.rows[0] as Awaited<ReturnType<typeof ownedDay>>;
        if (d.status !== "completed")
          await assertNoBreak(c, s.user.id, d.scheduled_date);
        if (d.status === "completed" || d.scheduled_date < localDate())
          throw new HttpError(
            409,
            "En historisk eller påbegyndt træning ændres ikke.",
          );
        const old = [
          ...d.plan.exercises,
          ...(d.plan.removedExercises || []),
        ].find((e) => e.id === v.exercise);
        if (!old) throw new HttpError(404, "Øvelsen findes ikke.");
        if (path === "remove-exercise") {
          d.plan.removedExercises = [...(d.plan.removedExercises || []), old];
          d.plan.exercises = d.plan.exercises.filter((e) => e.id !== old.id);
          await c.query(
            "UPDATE shaz_days SET plan=$3 WHERE id=$1 AND user_id=$2",
            [v.id, s.user.id, JSON.stringify(d.plan)],
          );
          return Response.json({
            ok: true,
            message:
              "Øvelsen er fjernet. En bevægelsesfunktion mangler nu. Vælg selv en erstatning; dine registreringer er bevaret.",
          });
        }
        const option =
          old &&
          [
            old,
            ...alternatives(
              old,
              { ...p.data, equipment: d.plan.equipment || p.data.equipment },
              exerciseCatalog,
            ),
          ].find((e) => e.id === v.replacement);
        if (!old || !option)
          throw new HttpError(400, "Alternativet passer ikke til dit udstyr.");
        d.plan.archivedExercises = [
          ...(d.plan.archivedExercises || []).filter((e) => e.id !== old.id),
          old,
        ];
        if (path === "restore-exercise") {
          d.plan.exercises.push({ ...old, ...option });
          d.plan.removedExercises = (d.plan.removedExercises || []).filter(
            (e) => e.id !== old.id,
          );
        } else
          d.plan.exercises = d.plan.exercises.map((e) =>
            e.id === old.id ? { ...e, ...option } : e,
          );
        await c.query(
          "UPDATE shaz_days SET plan=$3,updated_at=now() WHERE id=$1 AND user_id=$2",
          [v.id, s.user.id, JSON.stringify(d.plan)],
        );
        return Response.json({ ok: true });
      });
    }
    if (path === "skip") {
      const v = z.object({ id }).parse(input);
      return await transaction(async (c) => {
        await c.query(
          "SELECT user_id FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
          [s.user.id],
        );
        const q = await c.query(
          "SELECT *,scheduled_date::text FROM shaz_days WHERE user_id=$1 AND id=$2 FOR UPDATE",
          [s.user.id, v.id],
        );
        if (!q.rowCount) throw new HttpError(404, "Træningen findes ikke.");
        const d = q.rows[0] as Awaited<ReturnType<typeof ownedDay>>;
        if (d.status !== "completed")
          await assertNoBreak(c, s.user.id, d.scheduled_date);
        if (d.plan.kind !== "workout" || d.status === "completed")
          throw new HttpError(400, "Dette pas kan ikke springes over.");
        await c.query(
          "UPDATE shaz_days SET status='skipped',updated_at=now() WHERE id=$1 AND user_id=$2",
          [v.id, s.user.id],
        );
        return Response.json({ ok: true });
      });
    }
    if (path === "reschedule") {
      const v = z.object({ id, date }).parse(input);
      let d = await ownedDay(s.user.id, v.id);
      if (
        d.status !== "planned" ||
        Object.keys(d.log).length ||
        v.date <= localDate() ||
        v.date > addDays(p.start_date, 98)
      )
        throw new HttpError(
          400,
          "Vælg en fremtidig restitutionsdag inden dag 100.",
        );
      await transaction(async (c) => {
        await c.query(
          "SELECT user_id FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
          [s.user.id],
        );
        const current = await c.query(
          "SELECT *,scheduled_date::text FROM shaz_days WHERE user_id=$1 AND id=$2 FOR UPDATE",
          [s.user.id, v.id],
        );
        const draft = await c.query(
          "SELECT 1 FROM shaz_workout_drafts WHERE user_id=$1 AND day_id=$2",
          [s.user.id, v.id],
        );
        d = current.rows[0];
        if (
          !d ||
          d.status !== "planned" ||
          Object.keys(d.log).length ||
          draft.rowCount
        )
          throw new HttpError(
            409,
            "Passet er allerede ændret eller påbegyndt. Genindlæs planen.",
          );
        await assertNoBreak(c, s.user.id, d.scheduled_date);
        await assertNoBreak(c, s.user.id, v.date);
        const rest = await c.query(
          "SELECT id,scheduled_date::text FROM shaz_days WHERE user_id=$1 AND scheduled_date=$2 AND status='rest' FOR UPDATE",
          [s.user.id, v.date],
        );
        const nearby = await c.query(
          "SELECT plan FROM shaz_days WHERE user_id=$1 AND id<>$2 AND plan->>'kind'='workout' AND status<>'skipped' AND scheduled_date BETWEEN $3::date-1 AND $3::date+1",
          [s.user.id, v.id, v.date],
        );
        const cardio = await c.query(
          "SELECT plan FROM shaz_cardio WHERE user_id=$1 AND scheduled_date=$2 AND status IN ('planned','completed')",
          [s.user.id, v.date],
        );
        if (
          cardio.rows.some(
            (r) =>
              r.plan.selected.minutes > 20 ||
              p.data.cardio?.intensity !== "easy",
          )
        )
          throw new HttpError(
            400,
            "Den dag har allerede cardio, som ikke passer sammen med styrkepasset. Vælg en restitutionsdag.",
          );
        if (
          !rest.rowCount ||
          nearby.rows.some(
            (r) =>
              !d.plan.split ||
              d.plan.split === "full" ||
              !r.plan.split ||
              r.plan.split === "full" ||
              r.plan.split === d.plan.split,
          )
        )
          throw new HttpError(
            400,
            "Vælg en hviledag med restitution omkring. Vi stabler ikke missede pas.",
          );
        await c.query(
          "UPDATE shaz_days SET scheduled_date=$3,revision=revision+1 WHERE user_id=$1 AND id=$2",
          [s.user.id, rest.rows[0].id, d.scheduled_date],
        );
        await c.query(
          "UPDATE shaz_days SET scheduled_date=$3,revision=revision+1 WHERE user_id=$1 AND id=$2",
          [s.user.id, d.id, v.date],
        );
      });
      return Response.json({ ok: true });
    }
    if (path === "favorite") {
      const v = z.object({ id, on: z.boolean() }).parse(input);
      if (!(await catalog("recipe")).some((r) => r.id === v.id))
        throw new HttpError(404, "Opskriften findes ikke.");
      await db().query(
        v.on
          ? "INSERT INTO shaz_favorites(user_id,recipe_id) VALUES($1,$2) ON CONFLICT DO NOTHING"
          : "DELETE FROM shaz_favorites WHERE user_id=$1 AND recipe_id=$2",
        [s.user.id, v.id],
      );
      return Response.json({ ok: true });
    }
    if (path === "meal" || path === "meal-week")
      throw new HttpError(
        409,
        "Brug den samlede madplan under Mad. Den gamle måltidseditor er erstattet.",
      );
    if (path === "meal-legacy-disabled") {
      const v = z
        .object({
          date,
          slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
          recipe: id,
          servings: z.number().min(0.5).max(12),
        })
        .parse(input);
      if (v.date < localDate() || v.date > addDays(p.start_date, 99))
        throw new HttpError(400, "Vælg en dag i dit aktive forløb.");
      const recipe = (await catalog("recipe")).find(
        (r) => r.id === v.recipe,
      ) as Recipe | undefined;
      if (
        !recipe ||
        !suitable(
          recipe,
          p.data.diet,
          p.data.avoid,
          p.data.cookTime,
          p.data.halal,
        ) ||
        recipe.category !== v.slot
      )
        throw new HttpError(
          400,
          "Måltidet passer ikke til dine valgte filtre.",
        );
      await db().query(
        `INSERT INTO shaz_meals(id,user_id,date,slot,recipe_id,servings,recipe) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(user_id,date,slot) DO UPDATE SET recipe_id=$5,servings=$6,recipe=$7`,
        [
          crypto.randomUUID(),
          s.user.id,
          v.date,
          v.slot,
          v.recipe,
          v.servings,
          JSON.stringify(recipe),
        ],
      );
      return Response.json({ ok: true });
    }
    if (path === "meal-week") {
      const v = z.object({ start: date }).parse(input);
      if (v.start < localDate() || v.start > addDays(p.start_date, 99))
        throw new HttpError(400, "Vælg en uge i forløbet.");
      const rs = ((await catalog("recipe")) as Recipe[]).filter((r) =>
        suitable(r, p.data.diet, p.data.avoid, p.data.cookTime, p.data.halal),
      );
      await transaction(async (c) => {
        for (let i = 0; i < 7; i++) {
          const d = addDays(v.start, i);
          if (d > addDays(p.start_date, 99)) break;
          for (const slot of ["breakfast", "lunch", "dinner", "snack"]) {
            const options = rs.filter((r) => r.category === slot);
            if (!options.length) continue;
            const recipe = options[i % options.length];
            await c.query(
              `INSERT INTO shaz_meals(id,user_id,date,slot,recipe_id,servings,recipe) VALUES($1,$2,$3,$4,$5,1,$6) ON CONFLICT(user_id,date,slot) DO NOTHING`,
              [
                crypto.randomUUID(),
                s.user.id,
                d,
                slot,
                recipe.id,
                JSON.stringify(recipe),
              ],
            );
          }
        }
      });
      return Response.json({ ok: true });
    }
    if (path === "shopping") {
      const v = z
        .object({
          week: date,
          id,
          on: z.boolean(),
          count: z.number().int().min(1).max(14).default(7),
        })
        .parse(input);
      if (!ingredients.some((i) => i.id === v.id))
        throw new HttpError(400, "Ukendt råvare.");
      const { mealDays } = await import("@/lib/planning-store");
      const { mealShopping } = await import("@/lib/meal-plan");
      const days = await mealDays(s.user.id, v.week, v.count);
      const grams =
        mealShopping(days.map((d) => d.data)).find((i) => i.id === v.id)
          ?.grams || 0;
      await db().query(
        `INSERT INTO shaz_shopping(user_id,week,ingredient_id,checked,checked_grams) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,week,ingredient_id) DO UPDATE SET checked=$4,checked_grams=$5`,
        [s.user.id, v.week, v.id, v.on, grams],
      );
      return Response.json({ ok: true });
    }
    if (path === "checkin") {
      const v = z
        .object({
          energy: z.enum(["low", "ok", "high"]),
          recovery: z.enum(["tired", "ok"]),
          fit: z.enum(["too-much", "fits", "more"]),
          accept: z.boolean().optional(),
        })
        .parse(input);
      const week = Math.min(15, Math.ceil(dayNumber(p.start_date) / 7));
      const suggestion =
        v.energy === "low" || v.recovery === "tired" || v.fit === "too-much"
          ? "reduce"
          : "keep";
      await db().query(
        `INSERT INTO shaz_checkins(id,user_id,week,data) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,week) DO UPDATE SET data=$4,accepted_at=shaz_checkins.accepted_at`,
        [
          crypto.randomUUID(),
          s.user.id,
          week,
          JSON.stringify({ ...v, suggestion }),
        ],
      );
      return Response.json({
        message:
          suggestion === "reduce"
            ? "Forslag: ét sæt færre pr. øvelse i de næste 7 dage (mindst ét). Det giver mere plads til restitution. Du vælger selv, om det skal bruges."
            : "Behold rytmen. Eventuel øget belastning vurderes ud fra dine registrerede sæt, ikke kalenderen.",
        suggestion,
      });
    }
    if (path === "accept-checkin") {
      const v = z
        .object({ week: z.number().int().min(1).max(15) })
        .parse(input);
      await transaction(async (c) => {
        const result = await c.query(
          "SELECT * FROM shaz_checkins WHERE user_id=$1 AND week=$2 FOR UPDATE",
          [s.user.id, v.week],
        );
        const check = result.rows[0];
        if (!check || check.accepted_at || check.data.suggestion !== "reduce")
          throw new HttpError(
            409,
            "Forslaget findes ikke eller er allerede anvendt.",
          );
        const ds = await c.query(
          "SELECT id,plan FROM shaz_days WHERE user_id=$1 AND scheduled_date>$2 AND scheduled_date<=$3 AND status='planned' AND log='{}'::jsonb",
          [s.user.id, localDate(), addDays(localDate(), 7)],
        );
        for (const d of ds.rows) {
          d.plan.exercises = d.plan.exercises.map(
            (e: DayPlan["exercises"][number]) => ({
              ...e,
              sets: Math.max(1, e.sets - 1),
            }),
          );
          await c.query("UPDATE shaz_days SET plan=$2 WHERE id=$1", [
            d.id,
            JSON.stringify(d.plan),
          ]);
        }
        await c.query(
          "UPDATE shaz_checkins SET accepted_at=now() WHERE user_id=$1 AND week=$2",
          [s.user.id, v.week],
        );
      });
      await audit(s.user.id, "accept_recovery_adjustment", s.user.id);
      return Response.json({ ok: true });
    }
    if (path === "weight") {
      const v = z
        .object({
          date,
          kg: z.number().min(30).max(350),
          consent: z.literal(true),
        })
        .parse(input);
      if (v.date > localDate() || v.date < p.start_date)
        throw new HttpError(400, "Vælg en dato i dit forløb frem til i dag.");
      await db().query(
        "INSERT INTO shaz_weights(id,user_id,date,kg) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,date) DO UPDATE SET kg=$4",
        [crypto.randomUUID(), s.user.id, v.date, v.kg],
      );
      return Response.json({ ok: true });
    }
    throw new HttpError(404, "Handlingen findes ikke.");
  } catch (e) {
    return failure(e);
  }
}
async function adminAction(req: Request, path: string, input: unknown) {
  const s = await admin(req.headers, path !== "admin/content");
  await rate("admin:" + s.user.id, 90, 5);
  if (path === "admin/request-status") {
    const p = z
      .object({
        id: z.string().uuid(),
        status: z.enum(["received", "processing", "resolved"]),
      })
      .parse(input);
    const r = await db().query(
      "UPDATE shaz_requests SET status=$2 WHERE id=$1 RETURNING id",
      [p.id, p.status],
    );
    if (!r.rowCount) throw new HttpError(404, "Sagen findes ikke.");
    await audit(s.user.id, "request_" + p.status, p.id);
    return Response.json({ ok: true });
  }
  if (path === "admin/resend") {
    const p = z.object({ userId: id }).parse(input);
    const r = await db().query("SELECT email FROM shaz_user WHERE id=$1", [
      p.userId,
    ]);
    if (!r.rowCount) throw new HttpError(404, "Kunden findes ikke.");
    await requestLogin(r.rows[0].email, req.headers);
    await audit(s.user.id, "resend_login", p.userId);
    return Response.json({ ok: true });
  }
  if (path === "admin/retry-mail") {
    const p = z.object({ id }).parse(input);
    await deliver(p.id);
    await audit(s.user.id, "retry_mail", p.id);
    return Response.json({ ok: true });
  }
  if (path === "admin/invite") {
    const p = z
      .object({ email: z.email(), role: z.enum(["owner", "editor"]) })
      .parse(input);
    const token = opaque();
    await db().query(
      `INSERT INTO shaz_invites(token_hash,email,role,expires) VALUES($1,$2,$3,now()+interval '24 hours')`,
      [hash(token), p.email.toLowerCase(), p.role],
    );
    await sendMail(p.email, "invite", {
      url: baseURL() + "/admin#invite=" + token,
    });
    await audit(s.user.id, "invite_admin", hash(p.email), { role: p.role });
    return Response.json({ ok: true });
  }
  if (path === "admin/content") {
    const p = z
      .object({
        kind: z.enum([
          "recipe",
          "exercise",
          "template",
          "focus",
          "help",
          "nutrition-rule",
          "cardio-rule",
        ]),
        id,
        status: z.enum(["draft", "review", "published"]),
        data: z.record(z.string(), z.unknown()),
        expectedVersion: z.number().int().min(1),
        approval: z.boolean().optional(),
      })
      .parse(input);
    if (p.status === "published") {
      await admin(req.headers, true);
      if (!p.approval)
        throw new HttpError(
          400,
          "Bekræft, at indholdet faktisk er gennemgået.",
        );
    }
    validateContent(p.kind, p.data);
    await transaction(async (c) => {
      await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        p.kind + ":" + p.id,
      ]);
      const latest = await c.query(
        "SELECT max(version)::int AS version FROM shaz_content WHERE kind=$1 AND id=$2",
        [p.kind, p.id],
      );
      if (latest.rows[0].version !== p.expectedVersion)
        throw new HttpError(
          409,
          "Indholdet er ændret. Genindlæs før du gemmer.",
        );
      await c.query(
        "INSERT INTO shaz_content(kind,id,version,status,data,reviewer_id,reviewed_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          p.kind,
          p.id,
          p.expectedVersion + 1,
          p.status,
          JSON.stringify({
            ...p.data,
            id: p.id,
            version: p.expectedVersion + 1,
          }),
          p.status === "published" ? s.user.id : null,
          p.status === "published" ? new Date() : null,
        ],
      );
    });
    await audit(s.user.id, "content_" + p.status, p.kind + ":" + p.id, {
      version: p.expectedVersion + 1,
    });
    return Response.json({ ok: true });
  }
  if (path === "admin/refund-status") {
    const p = z
      .object({ id, status: z.enum(["reviewing", "processed"]) })
      .parse(input);
    if (p.status === "processed") {
      const r = await db().query(
        "SELECT 1 FROM shaz_refunds f JOIN shaz_orders o ON o.id=f.order_id WHERE f.id=$1 AND o.status='refunded'",
        [p.id],
      );
      if (!r.rowCount)
        throw new HttpError(
          409,
          "Markér først færdig, når Stripe-webhook har bekræftet refunderingen.",
        );
    }
    await db().query("UPDATE shaz_refunds SET status=$2 WHERE id=$1", [
      p.id,
      p.status,
    ]);
    await audit(s.user.id, "refund_" + p.status, p.id);
    return Response.json({ ok: true });
  }
  throw new HttpError(404, "Handlingen findes ikke.");
}
function validateContent(kind: string, data: unknown) {
  if (kind === "nutrition-rule") {
    z.object({
      minMale: z.number().min(1800).max(2400),
      minFemale: z.number().min(1500).max(2200),
      maxDeficit: z.number().min(100).max(600),
      lowBmi: z.number().min(20).max(23),
      highBmi: z.number().min(25).max(35),
      maxDeficitHighLoad: z.number().min(0).max(10),
      aggressiveDays: z.number().int().min(1).max(7),
      maxAggressiveDays: z.number().int().min(0).max(14),
      proteinPerKg: z.number().min(0.83).max(2),
      fiber: z.number().min(25).max(35),
      minFatPercent: z.number().min(20).max(30),
      maxFatPercent: z.number().min(30).max(40),
    }).parse(data);
  } else if (kind === "cardio-rule") {
    z.object({
      weeklyIncrease: z.number().min(0).max(0.05),
      beginnerStart: z.number().int().min(10).max(20),
      maxCombinedEasyMinutes: z.number().int().min(10).max(20),
      maxActiveDays: z.number().int().min(3).max(6),
    }).parse(data);
  } else if (kind === "recipe") {
    const r = z
      .object({
        name: z.string().min(3).max(120),
        category: z.enum(["breakfast", "lunch", "dinner", "snack"]),
        minutes: z.number().int().min(1).max(180),
        servings: z.number().min(1).max(12),
        portionMin: z.number().min(0.25).max(1).optional(),
        portionMax: z.number().min(1).max(2.5).optional(),
        maxGrams: z.number().min(250).max(1200).optional(),
        ingredients: z
          .array(z.object({ id, grams: z.number().positive().max(3000) }))
          .min(1)
          .max(30),
        steps: z.array(z.string().min(5).max(1000)).min(2).max(15),
      })
      .parse(data);
    if (r.ingredients.some((i) => !ingredients.some((f) => f.id === i.id)))
      throw new HttpError(400, "Brug råvarer med dokumenterede næringsdata.");
  } else if (kind === "exercise")
    z.object({
      name: z.string().min(3).max(120),
      pattern: z.enum([
        "squat",
        "push",
        "pull",
        "hinge",
        "single",
        "calf",
        "core",
        "shoulder",
      ]),
      equipment: z
        .array(
          z.enum(["bodyweight", "dumbbells", "band", "machines", "barbell"]),
        )
        .min(1),
      instructions: z.array(z.string().min(5).max(1000)).min(2),
      cue: z.string().max(1000),
      videoId: z.string().uuid().optional(),
    }).parse(data);
  else if (kind === "template")
    z.object({
      place: z.enum(["home", "gym"]),
      level: z.enum(["beginner", "intermediate"]),
      days: z.union([z.literal(2), z.literal(3), z.literal(4)]),
      sets: z.number().int().min(1).max(4),
      min: z.number().int().min(5).max(12),
      max: z.number().int().min(8).max(15),
      rest: z.number().int().min(60).max(180),
      description: z.string().min(5).max(1000),
    }).parse(data);
  else z.object({ text: z.string().min(10).max(5000) }).parse(data);
}
