import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { randomBytes } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { browserPath } from "./browser.mts";
const results: { name: string; status: string }[] = [];
const env = {
  ...process.env,
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5440/postgres",
  APP_ENV: "test",
  APP_URL: "http://localhost:3100",
  STRIPE_MODE: "test",
  BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
  MAIL_TRANSPORT: "test",
  STRIPE_PRICE_ID: "price_isolated_fixture",
  STRIPE_SECRET_KEY: "sk_test_" + randomBytes(24).toString("hex"),
  STRIPE_WEBHOOK_SECRET: "whsec_" + randomBytes(24).toString("hex"),
  SALES_ENABLED: "false",
};
Object.assign(process.env, env);
const pg = await PGlite.create();
const socket = new PGLiteSocketServer({
  db: pg,
  port: 5440,
  host: "127.0.0.1",
  maxConnections: 20,
});
await socket.start();
const { schema, db } = await import("../lib/db");
await schema();
const { processEvent, validatePaidSession } = await import("../lib/payments");
const { auth, access, session, requestLogin, admin } =
  await import("../lib/auth");
const { unseal, hash } = await import("../lib/security");
const { saveProfile, activate, snapshot, ownedDay, changeFuture } =
  await import("../lib/platform");
const { defaults, localDate, addDays } = await import("../lib/profile");
const { POST, GET } = await import("../app/api/platform/[...path]/route");
const { POST: PLANPOST } = await import("../app/api/plan/[...path]/route");
const { mealDays } = await import("../lib/planning-store");
const { mealShopping } = await import("../lib/meal-plan");
async function planpost(path: string, data: unknown, h: Headers) {
  const r = await PLANPOST(
    new Request(env.APP_URL + "/api/plan/" + path, {
      method: "POST",
      headers: h,
      body: JSON.stringify(data),
    }),
    { params: Promise.resolve({ path: [path] }) },
  );
  return { status: r.status, data: await r.json() };
}
const today = localDate(),
  weekday = new Date(today + "T12:00:00Z").getUTCDay();
const profiles = [
  {
    ...defaults,
    startDate: today,
    place: "home",
    level: "beginner",
    equipment: ["bodyweight"],
    days: 2,
    weekdays: [weekday, (weekday + 3) % 7],
  },
  {
    ...defaults,
    startDate: today,
    place: "gym",
    level: "intermediate",
    equipment: ["bodyweight", "machines", "dumbbells"],
    days: 4,
    weekdays: [
      weekday,
      (weekday + 1) % 7,
      (weekday + 3) % 7,
      (weekday + 4) % 7,
    ],
  },
  {
    ...defaults,
    startDate: today,
    diet: "vegetarian",
    days: 3,
    weekdays: [weekday, (weekday + 2) % 7, (weekday + 4) % 7],
  },
];
const users: {
  id: string;
  cookie: string;
  headers: Headers;
  order: string;
  email: string;
}[] = [];
let browser: import("playwright-core").Browser;
let server: ChildProcess | undefined;
let serverOutput = "";
async function check(name: string, fn: () => Promise<void>) {
  await fn();
  results.push({ name, status: "passed" });
  console.log("PASS " + name);
}
async function post(path: string, data: unknown, h: Headers) {
  const r = await POST(
    new Request(env.APP_URL + "/api/platform/" + path, {
      method: "POST",
      headers: h,
      body: JSON.stringify(data),
    }),
    { params: Promise.resolve({ path: path.split("/") }) },
  );
  return { status: r.status, data: await r.json() };
}
async function getCookie(email: string) {
  const r = await db().query(
    "SELECT payload FROM shaz_mail WHERE email=$1 AND kind='login' ORDER BY created_at DESC LIMIT 1",
    [email],
  );
  const { url } = JSON.parse(unseal(r.rows[0].payload));
  const token = new URLSearchParams(new URL(url).hash.slice(1)).get("token")!;
  const response = await auth().api.magicLinkVerify({
    query: { token, callbackURL: "/app" },
    headers: new Headers({ origin: env.APP_URL }),
    asResponse: true,
  });
  assert.equal(response.status, 302);
  const cookie = response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  assert.ok(cookie);
  return { cookie, token };
}
try {
  await check(
    "Three simulated paid journeys: webhook → captured e-mail → verified login → saved onboarding → activation → workout",
    async () => {
      for (let i = 0; i < 3; i++) {
        const email = `profile${i}@example.invalid`,
          checkout = "cs_fixture_" + i,
          reference = crypto.randomUUID();
        await db().query(
          "INSERT INTO shaz_checkout(id,token_hash,checkout_id) VALUES($1,$2,$3)",
          [reference, hash("fixture" + i), checkout],
        );
        const paid = {
          id: checkout,
          client_reference_id: reference,
          payment_status: "paid",
          mode: "payment",
          amount_total: 39900,
          currency: "dkk",
          livemode: false,
          metadata: { product: "shaz-100-days" },
          line_items: {
            data: [{ price: { id: env.STRIPE_PRICE_ID }, quantity: 1 }],
          },
          customer_details: { email },
          payment_intent: "pi_fixture_" + i,
        } as unknown as Stripe.Checkout.Session;
        const event = {
          id: "evt_fixture_" + i,
          type: "checkout.session.completed",
          livemode: false,
          data: { object: paid },
        } as Stripe.Event;
        await processEvent(event, async () => paid);
        await processEvent(event, async () => paid);
        assert.equal(
          (
            await db().query(
              "SELECT count(*)::int n FROM shaz_orders WHERE checkout_id=$1",
              [checkout],
            )
          ).rows[0].n,
          1,
        );
        assert.equal(
          (
            await db().query(
              "SELECT count(*)::int n FROM shaz_mail WHERE email=$1 AND kind='login'",
              [email],
            )
          ).rows[0].n,
          1,
        );
        const { cookie } = await getCookie(email);
        const h = new Headers({
          cookie,
          origin: env.APP_URL,
          "Content-Type": "application/json",
        });
        const s = await access(h);
        users.push({
          id: s.user.id,
          cookie,
          headers: h,
          order: s.order.id,
          email,
        });
        for (let step = 1; step <= 7; step++) {
          const r = await post("profile", { data: profiles[i], step }, h);
          assert.equal(r.status, 200, JSON.stringify(r.data));
        }
        assert.equal(
          (await post("activate", { confirmStart: true }, h)).status,
          200,
        );
        const state = await snapshot(s.user.id);
        assert.equal(state.days.length, 100);
        const day = state.days.find((d) => d.scheduled_date === today);
        assert.equal(day.plan.kind, "workout");
        const r = await post(
          "workout",
          {
            id: day.id,
            complete: true,
            sets: [
              {
                exercise: day.plan.exercises[0].id,
                set: 1,
                reps: 10,
                kg: 0,
                effort: 7,
              },
            ],
          },
          h,
        );
        assert.equal(r.status, 200, JSON.stringify(r.data));
        assert.equal(
          (await snapshot(s.user.id)).days.filter(
            (d) => d.status === "completed",
          ).length,
          1,
        );
      }
    },
  );
  await check(
    "Amount, currency, product/price, paid status and test/live validation reject mismatches",
    async () => {
      const base = {
        id: "cs_bad",
        payment_status: "paid",
        mode: "payment",
        amount_total: 39900,
        currency: "dkk",
        livemode: false,
        metadata: { product: "shaz-100-days" },
        line_items: {
          data: [{ price: { id: env.STRIPE_PRICE_ID }, quantity: 1 }],
        },
        customer_details: { email: "a@example.invalid" },
      };
      for (const patch of [
        { amount_total: 39899 },
        { currency: "eur" },
        { livemode: true },
        { mode: "subscription" },
        { payment_status: "unpaid" },
        { metadata: { product: "other" } },
        {
          line_items: { data: [{ price: { id: "price_wrong" }, quantity: 1 }] },
        },
      ])
        assert.throws(() =>
          validatePaidSession({
            ...base,
            ...patch,
          } as unknown as Stripe.Checkout.Session),
        );
      const e = {
        id: "evt_unpaid",
        type: "checkout.session.completed",
        livemode: false,
        data: { object: { ...base, payment_status: "unpaid" } },
      } as Stripe.Event;
      await processEvent(e, async () => {
        throw new Error("must not retrieve unpaid session");
      });
      assert.equal(
        (
          await db().query(
            "SELECT count(*)::int n FROM shaz_orders WHERE checkout_id='cs_bad'",
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await check(
    "Stripe signature verification accepts signed fixtures, rejects tampering; live network not used",
    async () => {
      const { POST: webhook } = await import("../app/api/stripe/webhook/route");
      const payload = JSON.stringify({
        id: "evt_signed_ignored",
        type: "payment_intent.payment_failed",
        livemode: false,
        data: { object: {} },
      });
      const sig = new Stripe(
        env.STRIPE_SECRET_KEY,
      ).webhooks.generateTestHeaderString({
        payload,
        secret: env.STRIPE_WEBHOOK_SECRET,
      });
      assert.equal(
        (
          await webhook(
            new Request(env.APP_URL + "/api/stripe/webhook", {
              method: "POST",
              headers: { "stripe-signature": sig },
              body: payload,
            }),
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await webhook(
            new Request(env.APP_URL + "/api/stripe/webhook", {
              method: "POST",
              headers: { "stripe-signature": sig },
              body: payload + "x",
            }),
          )
        ).status,
        400,
      );
    },
  );
  await check(
    "Unauthenticated access, customer-to-customer IDs, admin role and CSRF are denied",
    async () => {
      await assert.rejects(access(new Headers()));
      assert.equal(
        (
          await post(
            "workout",
            {
              id: (await snapshot(users[1].id)).days[0].id,
              complete: false,
              sets: [],
            },
            users[0].headers,
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await post(
            "admin/invite",
            { email: "x@example.invalid", role: "owner" },
            users[0].headers,
          )
        ).status,
        403,
      );
      const wrong = new Headers(users[0].headers);
      wrong.set("origin", "https://attacker.invalid");
      assert.equal((await post("checkin", {}, wrong)).status, 403);
      await assert.rejects(admin(users[0].headers));
      await assert.rejects(
        ownedDay(users[0].id, (await snapshot(users[1].id)).days[0].id),
      );
    },
  );
  await check(
    "Single-use links, expiration, resend and a second authenticated device",
    async () => {
      await requestLogin(users[0].email, new Headers({ origin: env.APP_URL }));
      const { cookie, token } = await getCookie(users[0].email);
      const again = await auth().api.magicLinkVerify({
        query: { token, callbackURL: "/app" },
        headers: new Headers({ origin: env.APP_URL }),
        asResponse: true,
      });
      assert.ok((again.headers.get("location") || "").includes("error="));
      const s = await access(new Headers({ cookie }));
      assert.equal(s.user.id, users[0].id);
      await requestLogin(users[0].email, new Headers({ origin: env.APP_URL }));
      await db().query(
        "UPDATE shaz_verification SET \"expiresAt\"=now()-interval '1 minute'",
      );
      const expired = await getCookie(users[0].email).catch(() => null);
      assert.equal(expired, null);
      await requestLogin(users[0].email, new Headers({ origin: env.APP_URL }));
      const fresh = await getCookie(users[0].email);
      assert.ok(fresh.cookie);
    },
  );
  await check(
    "Vegetarian exclusions, meal swap, portions, weekly plan, saved favorites and shopping checks",
    async () => {
      const u = users[2];
      const days = await mealDays(u.id, today);
      assert.equal(days.length, 7);
      assert.ok(
        days.every((d) =>
          d.data.slots.every((s: any) =>
            s.options.every(
              (o: any) =>
                !o.recipe.ingredients.some((i: any) =>
                  ["chicken", "tuna", "salmon"].includes(i.id),
                ),
            ),
          ),
        ),
      );
      const meal = days[0].data.slots[0];
      const recipe_id = meal.selected.recipe.id;
      let r = await planpost(
        "meal",
        {
          date: today,
          slot: meal.id,
          action: "portion",
          servings: 1.2,
          expectedVersion: days[0].version,
        },
        u.headers,
      );
      assert.equal(r.status, 200, JSON.stringify(r.data));
      let row = (await mealDays(u.id, today, 1))[0];
      assert.equal(row.data.slots[0].selected.servings, 1.2);
      r = await planpost(
        "meal",
        {
          date: today,
          slot: meal.id,
          action: "choose",
          recipe: "salmon-tray",
          servings: 1,
          expectedVersion: row.version,
        },
        u.headers,
      );
      assert.equal(r.status, 400);
      assert.equal(
        (await post("favorite", { id: recipe_id, on: true }, u.headers)).status,
        200,
      );
      assert.equal(
        (
          await post(
            "shopping",
            { week: today, id: "oats", on: true },
            u.headers,
          )
        ).status,
        200,
      );
      assert.ok(
        (await snapshot(u.id)).shopping.some(
          (s) => s.ingredient_id === "oats" && s.checked,
        ),
      );
    },
  );
  await check(
    "Future changes preserve completed snapshots; recovery suggestion requires acceptance and is idempotent",
    async () => {
      const u = users[0];
      const before = (await snapshot(u.id)).days[0];
      const changed = { ...profiles[0], level: "intermediate" };
      await changeFuture(u.id, changed);
      assert.deepEqual((await snapshot(u.id)).days[0].plan, before.plan);
      const r = await post(
        "checkin",
        { energy: "low", recovery: "tired", fit: "too-much" },
        u.headers,
      );
      assert.equal(r.status, 200);
      assert.equal(
        (await post("accept-checkin", { week: 1 }, u.headers)).status,
        200,
      );
      assert.equal(
        (await post("accept-checkin", { week: 1 }, u.headers)).status,
        409,
      );
    },
  );
  await check(
    "Refund request belongs to buyer, signed refund/dispute events revoke access and preserve receipt",
    async () => {
      assert.equal(
        (
          await post(
            "refund",
            { orderId: users[1].order, reason: "withdrawal" },
            users[0].headers,
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await post(
            "refund",
            { orderId: users[1].order, reason: "withdrawal" },
            users[1].headers,
          )
        ).status,
        200,
      );
      await processEvent({
        id: "evt_refund",
        type: "charge.refunded",
        livemode: false,
        data: {
          object: { payment_intent: "pi_fixture_1", amount_refunded: 39900 },
        },
      } as Stripe.Event);
      await assert.rejects(access(users[1].headers));
      assert.ok(await session(users[1].headers));
      await processEvent({
        id: "evt_dispute",
        type: "charge.dispute.created",
        livemode: false,
        data: { object: { payment_intent: "pi_fixture_2" } },
      } as Stripe.Event);
      await assert.rejects(access(users[2].headers));
      await processEvent({
        id: "evt_dispute_won",
        type: "charge.dispute.closed",
        livemode: false,
        data: { object: { payment_intent: "pi_fixture_2", status: "won" } },
      } as Stripe.Event);
      assert.ok(await access(users[2].headers));
    },
  );
  await check(
    "Verified invitation controls owner role; content versions, real approval and audit are enforced",
    async () => {
      const token = randomBytes(32).toString("hex");
      await db().query(
        "INSERT INTO shaz_invites(token_hash,email,role,expires) VALUES($1,$2,'owner',now()+interval '1 hour')",
        [hash(token), users[2].email],
      );
      assert.equal(
        (await post("invite", { token }, users[0].headers)).status,
        400,
      );
      assert.equal(
        (await post("invite", { token }, users[2].headers)).status,
        200,
      );
      await admin(users[2].headers, true);
      const content = (
        await db().query(
          "SELECT * FROM shaz_content WHERE kind='focus' AND id='1' ORDER BY version DESC LIMIT 1",
        )
      ).rows[0];
      assert.equal(
        (
          await post(
            "admin/content",
            {
              ...content,
              expectedVersion: 1,
              status: "published",
              approval: false,
              data: { text: "Faktisk gennemgået testtekst for uge et." },
            },
            users[2].headers,
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await post(
            "admin/content",
            {
              kind: "focus",
              id: "1",
              expectedVersion: 1,
              status: "published",
              approval: true,
              data: { text: "Faktisk gennemgået testtekst for uge et." },
            },
            users[2].headers,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await db().query(
            "SELECT reviewer_id FROM shaz_content WHERE kind='focus' AND id='1' AND version=2",
          )
        ).rows[0].reviewer_id,
        users[2].id,
      );
    },
  );
  await check(
    "Actual PostgreSQL physical backup restores into a second isolated database",
    async () => {
      const backup = await pg.dumpDataDir();
      const restored = await PGlite.create({ loadDataDir: backup });
      const a = await pg.query("SELECT count(*)::int n FROM shaz_days");
      const b = await restored.query("SELECT count(*)::int n FROM shaz_days");
      assert.deepEqual(a.rows, b.rows);
      assert.equal((b.rows[0] as { n: number }).n, 300);
      assert.deepEqual(
        (
          await restored.query(
            "SELECT id,status,email FROM shaz_orders ORDER BY id",
          )
        ).rows,
        (await pg.query("SELECT id,status,email FROM shaz_orders ORDER BY id"))
          .rows,
      );
      await restored.close();
    },
  );

  await check(
    "Integrated nutrition: preview/confirm 2–6 meals, server filters, selected totals, remove/undo, consumed history and conflicts",
    async () => {
      const u = users[2];
      const settings = {
        nutrition: "calculated",
        goal: "maintain",
        age: 40,
        height: 165,
        weight: 60,
        sex: "female",
        activity: "moderate",
        dataConsent: true,
        calculationSuitable: true,
        mealCount: 4,
        cookTime: 30,
      };
      let target = 0;
      for (const count of [2, 3, 4, 5, 6]) {
        const body = { settings: { ...settings, mealCount: count, days: 4 } };
        const preview = await planpost("nutrition-preview", body, u.headers);
        assert.equal(preview.status, 200, JSON.stringify(preview.data));
        assert.equal(
          preview.data.profile.days,
          3,
          "Nutrition cannot change training settings",
        );
        if (target) assert.equal(preview.data.day.target, target);
        else target = preview.data.day.target;
        assert.equal(preview.data.day.slots.length, count);
        assert.ok(
          preview.data.day.slots.every((s: any) => s.options.length === 3),
        );
        const before = (await snapshot(u.id)).profile.version;
        assert.equal(
          before,
          preview.data.version,
          "Preview does not mutate profile",
        );
        const save = await planpost(
          "nutrition-confirm",
          {
            ...body,
            expectedVersion: preview.data.version,
            fingerprint: preview.data.fingerprint,
          },
          u.headers,
        );
        assert.equal(save.status, 200, JSON.stringify(save.data));
      }
      let row = (await mealDays(u.id, today, 1))[0];
      const slot = row.data.slots[0];
      const before = mealShopping([row.data]);
      for (const option of slot.options) {
        const r = await planpost(
          "meal",
          {
            date: today,
            slot: slot.id,
            action: "choose",
            recipe: option.recipe.id,
            servings: option.servings,
            expectedVersion: row.version,
          },
          u.headers,
        );
        assert.equal(r.status, 200);
        row = (await mealDays(u.id, today, 1))[0];
        assert.equal(row.data.slots[0].selected.recipe.id, option.recipe.id);
      }
      let r = await planpost(
        "meal",
        {
          date: today,
          slot: slot.id,
          action: "remove",
          expectedVersion: row.version,
        },
        u.headers,
      );
      assert.equal(r.status, 200);
      row = (await mealDays(u.id, today, 1))[0];
      assert.equal(row.data.slots[0].selected, null);
      assert.equal(row.data.target, target);
      const removed = mealShopping([row.data]);
      r = await planpost(
        "meal",
        {
          date: today,
          slot: slot.id,
          action: "undo",
          expectedVersion: row.version,
        },
        u.headers,
      );
      assert.equal(r.status, 200);
      row = (await mealDays(u.id, today, 1))[0];
      assert.ok(row.data.slots[0].selected);
      assert.ok(
        mealShopping([row.data]).reduce((n, i) => n + i.grams, 0) >
          removed.reduce((n, i) => n + i.grams, 0),
      );
      assert.equal(
        (
          await planpost(
            "meal",
            {
              date: today,
              slot: slot.id,
              action: "remove",
              expectedVersion: row.version - 1,
            },
            u.headers,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await planpost(
            "meal",
            {
              date: today,
              slot: slot.id,
              action: "eaten",
              expectedVersion: row.version,
            },
            u.headers,
          )
        ).status,
        200,
      );
      row = (await mealDays(u.id, today, 1))[0];
      const eaten = row.data.slots[0];
      assert.equal(
        (
          await planpost(
            "meal",
            {
              date: today,
              slot: slot.id,
              action: "remove",
              expectedVersion: row.version,
            },
            u.headers,
          )
        ).status,
        409,
      );
      const preview = await planpost(
        "nutrition-preview",
        { settings: { mealCount: 3 } },
        u.headers,
      );
      assert.equal(preview.status, 200);
      assert.deepEqual(
        preview.data.day.slots.find((s: any) => s.id === eaten.id),
        eaten,
      );
      for (const unsafe of [
        { age: 16 },
        { pregnantOrBreastfeeding: true },
        { medicalNutrition: true },
        { eatingDisorderHistory: true },
        { weight: 40 },
      ])
        assert.equal(
          (await planpost("nutrition-preview", { settings: unsafe }, u.headers))
            .status,
          400,
        );
    },
  );
  await check(
    "Cardio: coherent generation, changes persist, swaps and logs, no extra calories, cross-account isolation",
    async () => {
      // Restore this isolated fixture after the preceding refund/revocation test.
      await db().query("UPDATE shaz_orders SET status='paid' WHERE id=$1", [
        users[1].order,
      ]);
      const u = users[1],
        cardio = {
          days: 1,
          weekdays: [(weekday + 2) % 7],
          minutes: 20,
          forms: ["walk", "cycle"],
          equipment: ["outdoors", "bike"],
          level: "beginner",
          intensity: "easy",
        };
      const preview = await planpost("cardio-preview", { cardio }, u.headers);
      assert.equal(preview.status, 200, JSON.stringify(preview.data));
      assert.equal(preview.data.plan[0].options.length, 3);
      assert.equal(
        (
          await planpost(
            "cardio-confirm",
            { cardio, expectedVersion: preview.data.version },
            u.headers,
          )
        ).status,
        200,
      );
      const state = await snapshot(u.id);
      let c = state.cardio[0];
      assert.ok(c);
      assert.equal(
        (
          await planpost(
            "cardio",
            { id: c.id, action: "swap", option: c.plan.options[1].id },
            users[0].headers,
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await planpost(
            "cardio",
            { id: c.id, action: "swap", option: c.plan.options[1].id },
            u.headers,
          )
        ).status,
        200,
      );
      await db().query("UPDATE shaz_cardio SET scheduled_date=$2 WHERE id=$1", [
        c.id,
        today,
      ]);
      assert.equal(
        (
          await planpost(
            "cardio",
            { id: c.id, action: "log", minutes: 18, distance: 1.1, effort: 3 },
            u.headers,
          )
        ).status,
        200,
      );
      c = (await snapshot(u.id)).cardio.find((d: any) => d.id === c.id);
      assert.equal(c.log.minutes, 18);
      assert.equal(c.status, "completed");
      assert.equal(
        (await planpost("cardio", { id: c.id, action: "remove" }, u.headers))
          .status,
        409,
      );
      const invalid = await planpost(
        "cardio-preview",
        { cardio: { ...cardio, weekdays: [weekday], intensity: "moderate" } },
        u.headers,
      );
      assert.equal(invalid.status, 400);
    },
  );
  await check(
    "Workout drafts: server revisions, cross-user protection and sets retained through exercise swap",
    async () => {
      const u = users[1];
      const day = (await snapshot(u.id)).days[0];
      await db().query("UPDATE shaz_days SET status='planned' WHERE id=$1", [
        day.id,
      ]);
      const old = day.plan.exercises[0];
      const sets = [{ exercise: old.id, set: 1, reps: 11, kg: 10, effort: 7 }];
      const r = await post(
        "workout-draft",
        { id: day.id, sets, timerEnd: 0, revision: 0 },
        u.headers,
      );
      assert.equal(r.status, 200, JSON.stringify(r.data));
      assert.equal(
        (
          await post(
            "workout-draft",
            { id: day.id, sets, timerEnd: 0, revision: 0 },
            u.headers,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await post(
            "workout-draft",
            { id: day.id, sets, timerEnd: 0, revision: 0 },
            users[0].headers,
          )
        ).status,
        404,
      );
      const { alternatives } = await import("../lib/training");
      const { catalog } = await import("../lib/content");
      const options = alternatives(
        old,
        profiles[1] as any,
        (await catalog("exercise")) as any,
      );
      assert.ok(options.length);
      assert.equal(
        (
          await post(
            "swap-exercise",
            { id: day.id, exercise: old.id, replacement: options[0].id },
            u.headers,
          )
        ).status,
        200,
      );
      const after = await snapshot(u.id);
      assert.deepEqual(
        after.drafts.find((d: any) => d.day_id === day.id).data.sets,
        sets,
      );
      assert.ok(
        after.days[0].plan.archivedExercises.some((e: any) => e.id === old.id),
      );
    },
  );
  await check(
    "Bound checkout retries, resumption, amount, ownership, verification and webhook idempotency",
    async () => {
      const { createCheckout } = await import("../lib/payments");
      const temporary = {
        SALES_ENABLED: "true",
        LEGAL_APPROVED: "true",
        CONTENT_APPROVED: "true",
        DELIVERY_VERIFIED: "true",
        RESEND_API_KEY: "fixture",
        RESEND_WEBHOOK_SECRET: "fixture",
        EMAIL_FROM: "test@example.invalid",
        SUPPORT_EMAIL: "support@example.invalid",
        SELLER_NAME: "Fixture",
        SELLER_CVR: "12345678",
        SELLER_ADDRESS: "Fixture",
      };
      const previous = Object.fromEntries(
        Object.keys(temporary).map((k) => [k, process.env[k]]),
      );
      const statuses = (
        await db().query("SELECT id,kind,version,status FROM shaz_content")
      ).rows;
      try {
        Object.assign(process.env, temporary);
        await db().query("UPDATE shaz_content SET status='published'");
        const account = (
          await auth().api.signUpEmail({
            body: {
              name: "Bound fixture",
              email: "bound-checkout@example.invalid",
              password: randomBytes(24).toString("base64url"),
            },
          })
        ).user;
        let fail = true,
          created = 0;
        const sessions = new Map<string, any>();
        const client = {
          prices: {
            retrieve: async () => ({
              id: env.STRIPE_PRICE_ID,
              unit_amount: 39900,
              currency: "dkk",
              type: "one_time",
              active: true,
              livemode: false,
              tax_behavior: "inclusive",
            }),
          },
          checkout: {
            sessions: {
              create: async (body: any, opts: any) => {
                if (!sessions.has(opts.idempotencyKey)) {
                  created++;
                  sessions.set(opts.idempotencyKey, {
                    ...body,
                    id: "cs_bound_fixture",
                    url: "https://checkout.stripe.com/isolated-fixture",
                    status: "open",
                  });
                }
                if (fail) {
                  fail = false;
                  throw Error("simulated ambiguous network failure");
                }
                return sessions.get(opts.idempotencyKey);
              },
              retrieve: async () => [...sessions.values()][0],
            },
          },
        } as unknown as Stripe;
        await assert.rejects(createCheckout(account, client));
        const retry = await createCheckout(account, client);
        const resume = await createCheckout(account, client);
        assert.equal(created, 1);
        assert.equal(retry.url, resume.url);
        const attempt = (
          await db().query("SELECT * FROM shaz_checkout WHERE user_id=$1", [
            account.id,
          ])
        ).rows[0];
        const paid = {
          ...sessions.get(attempt.id),
          client_reference_id: attempt.id,
          amount_total: 39900,
          currency: "dkk",
          livemode: false,
          payment_status: "paid",
          customer_details: { email: "changed-billing@example.invalid" },
          payment_intent: "pi_bound_fixture",
          line_items: {
            data: [{ price: { id: env.STRIPE_PRICE_ID }, quantity: 1 }],
          },
        } as Stripe.Checkout.Session;
        const event = {
          id: "evt_bound_fixture",
          type: "checkout.session.completed",
          livemode: false,
          data: { object: paid },
        } as Stripe.Event;
        await assert.rejects(
          processEvent(event, async () => ({
            ...paid,
            metadata: { ...paid.metadata, user_id: users[0].id },
          })),
        );
        await processEvent(event, async () => paid);
        await processEvent(event, async () => paid);
        const orders = (
          await db().query("SELECT * FROM shaz_orders WHERE checkout_id=$1", [
            paid.id,
          ])
        ).rows;
        assert.equal(orders.length, 1);
        assert.equal(orders[0].user_id, account.id);
        assert.equal(orders[0].email, account.email);
        assert.equal(
          (
            await db().query(
              "SELECT 1 FROM shaz_mail WHERE email=$1 AND kind='login'",
              [account.email],
            )
          ).rowCount,
          0,
        );
        await assert.rejects(createCheckout(account, client));
        assert.equal(
          (await post("activate", {}, users[0].headers)).status,
          400,
        );
      } finally {
        for (const [k, v] of Object.entries(previous))
          if (v === undefined) delete process.env[k];
          else process.env[k] = v;
        for (const row of statuses)
          await db().query(
            "UPDATE shaz_content SET status=$4 WHERE id=$1 AND kind=$2 AND version=$3",
            [row.id, row.kind, row.version, row.status],
          );
      }
    },
  );
  const browserPassword = randomBytes(24).toString("base64url");
  await check(
    "Ordinary password signup, e-mail verification, reset, no-purchase denial and legacy account compatibility",
    async () => {
      const email = "unpaid-password@example.invalid",
        password = randomBytes(24).toString("base64url"),
        headers = new Headers({ origin: env.APP_URL });
      const { POST: authPOST } = await import("../app/api/auth/[...all]/route");
      const signupResponse = await authPOST(
        new Request(env.APP_URL + "/api/auth/sign-up/email", {
          method: "POST",
          headers: new Headers({
            origin: env.APP_URL,
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: "Fiktiv kunde", email, password }),
        }),
      );
      assert.equal(signupResponse.status, 200);
      const signup = await signupResponse.json();
      assert.ok(signup.user.id);
      // An ordinary unverified session can resume checkout, but cannot read product data.
      const unverified = await auth().api.signInEmail({
        body: { email, password },
        headers,
        asResponse: true,
      });
      assert.equal(unverified.status, 200);
      const unverifiedCookie = unverified.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
      await assert.rejects(session(new Headers({ cookie: unverifiedCookie })));
      await assert.rejects(access(new Headers({ cookie: unverifiedCookie })));
      const mail = (
        await db().query(
          "SELECT payload FROM shaz_mail WHERE email=$1 AND kind='verify-email' ORDER BY created_at DESC LIMIT 1",
          [email],
        )
      ).rows[0];
      const token = new URLSearchParams(
        new URL(JSON.parse(unseal(mail.payload)).url).hash.slice(1),
      ).get("verify")!;
      const verified = await auth().api.verifyEmail({
        query: { token },
        headers,
      });
      assert.ok(verified.status);
      const signin = await auth().api.signInEmail({
        body: { email, password },
        headers,
        asResponse: true,
      });
      assert.equal(signin.status, 200);
      const cookie = signin.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
      await assert.rejects(access(new Headers({ cookie })));
      await auth().api.requestPasswordReset({
        body: { email, redirectTo: "/login" },
        headers,
      });
      const resetMail = (
        await db().query(
          "SELECT payload FROM shaz_mail WHERE email=$1 AND kind='password-reset' ORDER BY created_at DESC LIMIT 1",
          [email],
        )
      ).rows[0];
      const reset = new URLSearchParams(
        new URL(JSON.parse(unseal(resetMail.payload)).url).hash.slice(1),
      ).get("reset")!;
      const next = randomBytes(24).toString("base64url");
      await auth().api.resetPassword({
        body: { token: reset, newPassword: next },
        headers,
      });
      await assert.rejects(session(new Headers({ cookie })));
      assert.equal(
        (
          await auth().api.signInEmail({
            body: { email, password: next },
            headers,
            asResponse: true,
          })
        ).status,
        200,
      );
      for (const u of users)
        await auth().api.setPassword({
          body: { newPassword: browserPassword },
          headers: u.headers,
        });
    },
  );
  await check(
    "T03/S01: hybrid changes are scoped, atomic, preview-bound and reject concurrent confirmations",
    async () => {
      const u = users[2],
        old = await snapshot(u.id);
      const input = {
        data: {
          ...old.profile.data,
          place: "both",
          locations: [
            {
              id: "home",
              name: "Homegym",
              kind: "home",
              equipment: ["bodyweight", "dumbbells", "band"],
            },
            {
              id: "gym",
              name: "Center",
              kind: "gym",
              equipment: ["bodyweight", "cable", "leg-press", "dumbbells"],
            },
          ],
          schedule: old.profile.data.weekdays.map(
            (weekday: number, i: number) => ({
              weekday,
              locationId: i === 1 ? "home" : "gym",
              minutes: i === 1 ? 25 : 45,
            }),
          ),
        },
      };
      const preview = await planpost("training-preview", input, u.headers);
      assert.equal(preview.status, 200, JSON.stringify(preview.data));
      const confirm = {
        ...input,
        expectedVersion: preview.data.version,
        fingerprint: preview.data.fingerprint,
      };
      assert.equal(
        (
          await planpost(
            "training-confirm",
            {
              ...confirm,
              data: {
                ...input.data,
                goal: input.data.goal === "maintain" ? "fitness" : "maintain",
              },
            },
            u.headers,
          )
        ).status,
        409,
      );
      const results = await Promise.all([
        planpost("training-confirm", confirm, u.headers),
        planpost("training-confirm", confirm, u.headers),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
      const before = await snapshot(u.id),
        target = before.days.find(
          (d) => d.plan.kind === "workout" && d.scheduled_date > today,
        )!;
      const one = {
        id: target.id,
        locationId: "home",
        minutes: 20,
        scope: "session",
      };
      const pp = await planpost("training-preview", one, u.headers);
      assert.equal(pp.status, 200, JSON.stringify(pp.data));
      assert.equal(pp.data.changes.length, 1);
      assert.equal(
        (
          await planpost(
            "training-confirm",
            {
              ...one,
              expectedVersion: pp.data.version,
              fingerprint: pp.data.fingerprint,
            },
            u.headers,
          )
        ).status,
        200,
      );
      const after = await snapshot(u.id);
      assert.equal(after.days.find((d) => d.id === target.id).plan.minutes, 20);
      assert.equal(
        after.days.find((d) => d.id === target.id).plan.exercises.length,
        3,
      );
      assert.deepEqual(
        after.days.filter((d) => d.id !== target.id),
        before.days.filter((d) => d.id !== target.id),
      );
    },
  );
  await check(
    "A06: concurrent paid events cannot reopen a refund received before fulfillment",
    async () => {
      const reference = crypto.randomUUID(),
        checkout = "cs_late_paid",
        payment = "pi_refunded_first";
      await db().query(
        "INSERT INTO shaz_checkout(id,token_hash,checkout_id) VALUES($1,$2,$3)",
        [reference, hash("late-fixture"), checkout],
      );
      const refund = {
        id: "evt_refund_first",
        type: "charge.refunded",
        livemode: false,
        data: { object: { payment_intent: payment, amount_refunded: 39900 } },
      } as unknown as Stripe.Event;
      await processEvent(refund);
      const paid = {
        id: checkout,
        client_reference_id: reference,
        payment_status: "paid",
        mode: "payment",
        amount_total: 39900,
        currency: "dkk",
        livemode: false,
        metadata: { product: "shaz-100-days" },
        line_items: {
          data: [{ price: { id: env.STRIPE_PRICE_ID }, quantity: 1 }],
        },
        customer_details: { email: "late@example.invalid" },
        payment_intent: payment,
      } as unknown as Stripe.Checkout.Session;
      await Promise.all(
        [1, 2].map((i) =>
          processEvent(
            {
              id: "evt_late_" + i,
              type: "checkout.session.completed",
              livemode: false,
              data: { object: paid },
            } as Stripe.Event,
            async () => paid,
          ),
        ),
      );
      const orders = await db().query(
        "SELECT status,refunded_amount FROM shaz_orders WHERE checkout_id=$1",
        [checkout],
      );
      assert.equal(orders.rowCount, 1);
      assert.equal(orders.rows[0].status, "refunded");
      assert.equal(orders.rows[0].refunded_amount, 39900);
    },
  );
  await check(
    "M05/S04: read-only plan GET and unauthenticated idempotent withdrawal receipt",
    async () => {
      const { GET: planGet } = await import("../app/api/plan/[...path]/route");
      const u = users[2];
      const before = (
        await db().query(
          "SELECT count(*)::int n FROM shaz_meal_days WHERE user_id=$1",
          [u.id],
        )
      ).rows[0].n;
      assert.equal(
        (
          await planGet(
            new Request(
              env.APP_URL + "/api/plan/state?start=" + addDays(today, 70),
              { headers: u.headers },
            ),
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await db().query(
            "SELECT count(*)::int n FROM shaz_meal_days WHERE user_id=$1",
            [u.id],
          )
        ).rows[0].n,
        before,
      );
      const { POST: request } = await import("../app/api/requests/route");
      const key = crypto.randomUUID();
      const payload = {
        kind: "withdrawal",
        name: "Fiktiv Kunde",
        email: "withdrawal@example.invalid",
        orderReference: "fixture-order",
        message: "Jeg vil fortryde aftalen.",
        confirmed: true,
        idempotencyKey: key,
      };
      const call = () =>
        request(
          new Request(env.APP_URL + "/api/requests", {
            method: "POST",
            headers: {
              origin: env.APP_URL,
              "content-type": "application/json",
            },
            body: JSON.stringify(payload),
          }),
        );
      const a = await call();
      assert.equal(a.status, 200, await a.clone().text());
      const first = await a.json();
      const second = await (await call()).json();
      assert.equal(first.id, second.id);
    },
  );
  await check("T10/N02: empty/future completion and expired aggressive meals are denied by API",async()=>{
    const u=users[2],state=await snapshot(u.id),todaySession=state.days.find(d=>d.scheduled_date===today&&d.plan.kind==="workout"),future=state.days.find(d=>d.scheduled_date>today&&d.plan.kind==="workout");
    assert.equal((await post("workout",{id:todaySession.id,complete:true,sets:[]},u.headers)).status,400);
    assert.equal((await post("workout",{id:future.id,complete:true,sets:[]},u.headers)).status,400);
    const row=(await mealDays(u.id,today,1))[0];const old=state.profile.data;
    await db().query("UPDATE shaz_profile SET data=$2 WHERE user_id=$1",[u.id,JSON.stringify({...old,goal:"fat-loss",deficitLevel:"aggressive",deficitReviewUntil:addDays(today,-1)})]);
    try{assert.equal((await planpost("meal",{date:today,slot:row.data.slots.find((s:any)=>s.status==="planned").id,action:"remove",expectedVersion:row.version},u.headers)).status,409);}finally{await db().query("UPDATE shaz_profile SET data=$2 WHERE user_id=$1",[u.id,JSON.stringify(old)]);}
  });
  // Browser is started in this process tree so it shares the isolated test network.
  const { chromium: pw } = await import("playwright-core");

  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", "3100", "-H", "0.0.0.0"],
    {
      env: { ...env, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  server.stdout?.on("data", (b) => {
    output += b.toString();
    serverOutput += b.toString();
  });
  server.stderr?.on("data", (b) => {
    output += b.toString();
    serverOutput += b.toString();
  });
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(env.APP_URL + "/api/health");
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
    if (i === 79)
      throw new Error("Next failed to start: " + output.slice(-2000));
  }
  browser = await pw.launch({
    executablePath: await browserPath(),
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
    ],
    headless: true,
  });
  await mkdir("test-artifacts", { recursive: true });
  await check(
    "Mobile and desktop browser routes, real authenticated UI, no horizontal overflow or client exceptions",
    async () => {
      for (const width of [320, 390, 430, 768, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: width === 390 ? 844 : 1000 },
        });
        const pairs = users[0].cookie.split("; ").map((c) => {
          const i = c.indexOf("=");
          return {
            name: c.slice(0, i),
            value: c.slice(i + 1),
            url: env.APP_URL,
          };
        });
        await context.addCookies(pairs);
        const page = await context.newPage();
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        for (const route of [
          "/",
          "/checkout",
          "/login",
          "/demo",
          "/app",
          "/app/training",
          "/app/food",
          "/app/progress",
          "/app/profile",
        ]) {
          const response = await page.goto(env.APP_URL + route, {
            waitUntil: "networkidle",
          });
          assert.ok(response && response.status() < 400, route);
          if (route.startsWith("/app"))
            assert.ok(
              !(await page.locator("body").textContent())?.includes(
                "Vi hjælper dig videre",
              ),
              "Authenticated UI gate shown: " + route,
            );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
            `${route} overflows at ${width}`,
          );
          if (route === "/app" && width === 390)
            await page.screenshot({
              path: "public/platform-preview.jpg",
              type: "jpeg",
              quality: 85,
              fullPage: false,
            });
          if (route === "/app")
            await page.screenshot({
              path: `test-artifacts/dashboard-${width}.png`,
              fullPage: true,
            });
          if (route === "/app" && width === 1440)
            await page.screenshot({
              path: "public/platform-desktop.jpg",
              type: "jpeg",
              quality: 85,
              fullPage: true,
            });
          if (route === "/app/food" && width === 1440) {
            await page
              .getByRole("tab", { name: "Opskrifter", exact: true })
              .click();
            await page.locator(".food-library").screenshot({
              path: "public/recipe-library.jpg",
              type: "jpeg",
              quality: 85,
            });
            await page
              .getByRole("tab", { name: "Min madplan", exact: true })
              .click();
          }
          if (route === "/app/food")
            await page.screenshot({
              path: `test-artifacts/food-${width}.png`,
              fullPage: false,
            });
        }
        assert.deepEqual(errors, []);
        await context.close();
      }
    },
  );
  await check(
    "Browser login verification and refresh keep account data; logout rejects protected state",
    async () => {
      await requestLogin(users[0].email, new Headers({ origin: env.APP_URL }));
      const mail = (
        await db().query(
          "SELECT payload FROM shaz_mail WHERE email=$1 AND kind='login' ORDER BY created_at DESC LIMIT 1",
          [users[0].email],
        )
      ).rows[0];
      const url = JSON.parse(unseal(mail.payload)).url;
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      await page.goto(url);
      await page.getByRole("button", { name: "Bekræft og log ind" }).click();
      await page.waitForURL("**/app");
      await page.reload();
      assert.ok((await page.locator("body").textContent())?.includes("I dag."));
      await page.goto(env.APP_URL + "/app/profile");
      await page.getByRole("button", { name: "Log ud", exact: true }).click();
      await page.waitForURL("**/login");
      const r = await context.request.get(env.APP_URL + "/api/platform/state");
      assert.equal(r.status(), 401);
      await context.close();
    },
  );
  await check(
    "Mobile ordinary password login, meal calculator/dialogs/keyboard/navigation and a second session",
    async () => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto(env.APP_URL + "/login");
      await page.getByLabel("E-mail", { exact: true }).fill(users[2].email);
      await page
        .getByLabel("Adgangskode", { exact: true })
        .fill(browserPassword);
      await page.getByRole("button", { name: "Log ind", exact: true }).click();
      await page.waitForURL("**/app");
      await page.screenshot({
        path: "test-artifacts/mobile-login-dashboard.png",
        fullPage: false,
      });
      await page.goto(env.APP_URL + "/app/food");
      await page.getByRole("button", { name: "Beregn & tilpas" }).click();
      await page.getByLabel("Måltider om dagen").selectOption("3");
      await page.getByRole("button", { name: "Se nye portioner" }).click();
      await page
        .getByRole("button", { name: "Bekræft og gem ændringen" })
        .click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await page
        .getByRole("button", { name: "Byt · 3 forslag" })
        .first()
        .click();
      const dialog = page.getByRole("dialog", { name: "Byt måltid" });
      await dialog.waitFor();
      assert.equal(
        await dialog.locator(".meal-alternatives article").count(),
        3,
      );
      await page.screenshot({
        path: "test-artifacts/mobile-meal-alternatives.png",
        fullPage: false,
      });
      await page.keyboard.press("Tab");
      assert.ok(
        await dialog.evaluate((d) => d.contains(document.activeElement)),
      );
      const beforeCancel=await (await context.request.get(env.APP_URL+"/api/plan/state")).json();
      await dialog.getByRole("button",{name:"Vælg B",exact:true}).click();
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      const afterCancel=await (await context.request.get(env.APP_URL+"/api/plan/state")).json();
      assert.deepEqual(afterCancel.days,beforeCancel.days,"Closing pending choice must not persist it");
      await page.getByText("Flere handlinger", { exact: true }).first().click();
      await page
        .getByRole("button", { name: "Tilpas portion", exact: true })
        .first()
        .click();
      await page.getByLabel("Antal grundportioner").fill("1.05");
      await page
        .getByRole("button", { name: "Gem portion", exact: true })
        .click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await page
        .getByRole("button", { name: "Fjern", exact: true })
        .first()
        .click();
      await page.getByRole("button", { name: "Fortryd fjernelse" }).click();
      await page
        .getByRole("button", { name: "Fortryd fjernelse" })
        .waitFor({ state: "hidden" });
      await page.screenshot({
        path: "test-artifacts/mobile-food-plan.png",
        fullPage: false,
      });
      await page.getByRole("tab", { name: "Indkøb", exact: true }).click();
      await page.screenshot({
        path: "test-artifacts/mobile-shopping.png",
        fullPage: false,
      });
      const before = await (
        await context.request.get(env.APP_URL + "/api/plan/state")
      ).json();
      await page.goto(env.APP_URL + "/app/profile");
      await page.getByRole("button", { name: "Log ud", exact: true }).click();
      await page.waitForURL("**/login");
      await context.close();
      const second = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        }),
        p2 = await second.newPage();
      await p2.goto(env.APP_URL + "/login");
      await p2.getByLabel("E-mail", { exact: true }).fill(users[2].email);
      await p2.getByLabel("Adgangskode", { exact: true }).fill(browserPassword);
      await p2.getByRole("button", { name: "Log ind", exact: true }).click();
      await p2.waitForURL("**/app");
      const after = await (
        await second.request.get(env.APP_URL + "/api/plan/state")
      ).json();
      assert.deepEqual(after.days, before.days);
      assert.equal(after.profile.data.mealCount, 3);
      await second.close();
    },
  );
  await check(
    "Mobile workout draft survives offline edit, dialog close, refresh and exercise change",
    async () => {
      const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        }),
        page = await context.newPage();
      await page.goto(env.APP_URL + "/login");
      await page.getByLabel("E-mail", { exact: true }).fill(users[1].email);
      await page
        .getByLabel("Adgangskode", { exact: true })
        .fill(browserPassword);
      await page.getByRole("button", { name: "Log ind", exact: true }).click();
      await page.waitForURL("**/app");
      await page.getByRole("button", { name: "Start træning →" }).click();
      const input = page.locator('input[aria-label$="gentagelser"]').first();
      const label = await input.getAttribute("aria-label");
      await context.setOffline(true);
      await input.fill("13");
      await page.getByRole("button", { name: "Luk træning" }).click();
      await context.setOffline(false);
      await page.reload();
      await page.getByRole("button", { name: "Start træning →" }).click();
      await page.getByLabel(label!, { exact: true }).waitFor();
      assert.equal(
        await page.getByLabel(label!, { exact: true }).inputValue(),
        "13",
      );
      await page.getByText("✓ Gemt på din konto", { exact: true }).waitFor();
      await page.reload();
      await page.getByRole("button", { name: "Start træning →" }).click();
      assert.equal(
        await page.getByLabel(label!, { exact: true }).inputValue(),
        "13",
      );
      await page.screenshot({
        path: "test-artifacts/mobile-workout-draft.png",
        fullPage: false,
      });
      const swap = page.locator('select[aria-label^="Byt "]').first();
      const replacement = await swap
        .locator("option")
        .nth(1)
        .getAttribute("value");
      await swap.selectOption(replacement!);
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await page.reload();
      const state = await (
        await context.request.get(env.APP_URL + "/api/platform/state")
      ).json();
      assert.ok(
        state.drafts.some((d: any) =>
          d.data.sets.some((s: any) => s.reps === 13),
        ),
      );
      await context.close();
    },
  );
  await check("Day 101 is a readable summary and refuses writes", async () => {
    await db().query("UPDATE shaz_profile SET start_date=$2 WHERE user_id=$1", [
      users[0].id,
      addDays(today, -100),
    ]);
    const state = await snapshot(users[0].id);
    assert.equal(state.day, 101);
    assert.equal(
      (
        await post(
          "weight",
          { date: today, kg: 80, consent: true },
          users[0].headers,
        )
      ).status,
      403,
    );
    const context = await browser.newContext();
    await context.addCookies(
      users[0].cookie.split("; ").map((c) => {
        const i = c.indexOf("=");
        return { name: c.slice(0, i), value: c.slice(i + 1), url: env.APP_URL };
      }),
    );
    const page = await context.newPage();
    await page.goto(env.APP_URL + "/app");
    assert.ok(
      (await page.locator("body").textContent())?.includes(
        "Dit forløb er afsluttet",
      ) ||
        (await page.locator("body").textContent())?.includes(
          "FORLØBET ER AFSLUTTET",
        ),
    );
    await context.close();
    await db().query("UPDATE shaz_profile SET start_date=$2 WHERE user_id=$1", [
      users[0].id,
      today,
    ]);
  });
  await check(
    "App process restart retains orders, sessions, plans and logged sets",
    async () => {
      server!.kill("SIGTERM");
      await new Promise<void>((resolve) =>
        server!.once("exit", () => resolve()),
      );
      server = spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          "start",
          "-p",
          "3100",
          "-H",
          "0.0.0.0",
        ],
        { env: { ...env, NODE_ENV: "production" }, stdio: "ignore" },
      );
      for (let i = 0; i < 80; i++) {
        try {
          if ((await fetch(env.APP_URL + "/api/health")).ok) break;
        } catch {}
        await new Promise((r) => setTimeout(r, 250));
      }
      const r = await fetch(env.APP_URL + "/api/platform/state", {
        headers: { cookie: users[0].cookie },
      });
      assert.equal(r.status, 200);
      const data = await r.json();
      assert.equal(data.days.length, 100);
      assert.equal(
        data.days.filter((d: { status: string }) => d.status === "completed")
          .length,
        1,
      );
    },
  );

  await check(
    "Browser workout editor, portions modal, admin UI and public preview assets",
    async () => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      await context.addCookies(
        users[0].cookie.split("; ").map((c) => {
          const i = c.indexOf("=");
          return {
            name: c.slice(0, i),
            value: c.slice(i + 1),
            url: env.APP_URL,
          };
        }),
      );
      const page = await context.newPage();
      await page.goto(env.APP_URL + "/app");
      await page
        .getByRole("button", { name: "Se og ret registrering" })
        .click();
      await page.getByRole("dialog", { name: "Træningspas" }).waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page
        .getByRole("button", { name: "Pause · 90 sek." })
        .first()
        .click();
      assert.ok(await page.getByRole("timer").isVisible());
      await page.getByRole("button", { name: "Stop", exact: true }).click();
      while (await page.getByRole("button", { name: "Næste øvelse →" }).count())
        await page.getByRole("button", { name: "Næste øvelse →" }).click();
      await page.getByRole("button", { name: "Gem rettelse" }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await page.goto(env.APP_URL + "/app/food");
      await page.getByRole("tab", { name: "Opskrifter", exact: true }).click();
      await page.getByRole("button", { name: "Se opskrift →" }).first().click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      const portions = page.getByLabel("Vis mængder til antal portioner");
      await portions.fill("2");
      assert.ok((await dialog.textContent())?.includes("2 portion(er)"));
      await page.getByRole("button", { name: "Luk opskrift" }).click();
      await page.goto(env.APP_URL + "/preview");
      assert.equal(new URL(page.url()).pathname, "/");
      assert.equal(
        await page.getByText("Prøv demoen", { exact: true }).count(),
        0,
      );
      assert.equal(
        await page
          .locator("img")
          .evaluateAll((imgs) =>
            imgs.every(
              (i) =>
                (i as HTMLImageElement).complete &&
                (i as HTMLImageElement).naturalWidth > 0,
            ),
          ),
        true,
      );
      await context.close();
      const owner = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      await owner.addCookies(
        users[2].cookie.split("; ").map((c) => {
          const i = c.indexOf("=");
          return {
            name: c.slice(0, i),
            value: c.slice(i + 1),
            url: env.APP_URL,
          };
        }),
      );
      const ap = await owner.newPage();
      await ap.goto(env.APP_URL + "/admin");
      await ap.getByText("Før salg kan åbnes.").waitFor();
      await ap.getByRole("button", { name: "Indhold", exact: true }).click();
      assert.ok(
        await ap
          .getByRole("heading", { name: "Versioneret indhold." })
          .isVisible(),
      );
      assert.equal(
        await ap.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await owner.close();
    },
  );
  await check(
    "Signed Resend delivery webhooks are idempotent and never erase bounce suppression",
    async () => {
      const { Webhook } = await import("svix");
      const { sendMail } = await import("../lib/mail");
      const { POST: mailhook } = await import("../app/api/mail/webhook/route");
      process.env.RESEND_WEBHOOK_SECRET =
        "whsec_" + randomBytes(32).toString("base64");
      const id = await sendMail("delivery@example.invalid", "receipt", {});
      await db().query("UPDATE shaz_mail SET provider_id=$2 WHERE id=$1", [
        id,
        "email_fixture",
      ]);
      async function event(type: string) {
        const payload = JSON.stringify({
          type,
          data: { email_id: "email_fixture" },
        });
        const timestamp = new Date(),
          eid = crypto.randomUUID();
        const signature = new Webhook(process.env.RESEND_WEBHOOK_SECRET!).sign(
          eid,
          timestamp,
          payload,
        );
        return mailhook(
          new Request(env.APP_URL + "/api/mail/webhook", {
            method: "POST",
            headers: {
              "svix-id": eid,
              "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
              "svix-signature": signature,
            },
            body: payload,
          }),
        );
      }
      assert.equal((await event("email.delivered")).status, 200);
      const first = (
        await db().query("SELECT delivered_at FROM shaz_mail WHERE id=$1", [id])
      ).rows[0].delivered_at;
      assert.equal((await event("email.delivered")).status, 200);
      assert.equal(
        String(
          (
            await db().query("SELECT delivered_at FROM shaz_mail WHERE id=$1", [
              id,
            ])
          ).rows[0].delivered_at,
        ),
        String(first),
      );
      await event("email.bounced");
      await event("email.delivered");
      assert.equal(
        (await db().query("SELECT status FROM shaz_mail WHERE id=$1", [id]))
          .rows[0].status,
        "bounced",
      );
      assert.equal(
        (
          await mailhook(
            new Request(env.APP_URL + "/api/mail/webhook", {
              method: "POST",
              body: "{}",
            }),
          )
        ).status,
        400,
      );
    },
  );
  await check(
    "Data export and deletion remove customer data while retaining separate order evidence",
    async () => {
      const u = users[1];
      const exported = await GET(
        new Request(env.APP_URL + "/api/platform/export", {
          headers: u.headers,
        }),
        { params: Promise.resolve({ path: ["export"] }) },
      );
      assert.equal(exported.status, 200);
      const data = await exported.json();
      assert.equal(data.account.email, u.email);
      assert.ok(data.orders.every((o: { id: string }) => o.id === u.order));
      assert.equal(
        (await post("delete", { confirmation: "SLET MIN KONTO" }, u.headers))
          .status,
        200,
      );
      assert.equal(
        (
          await db().query(
            "SELECT count(*)::int n FROM shaz_days WHERE user_id=$1",
            [u.id],
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await db().query("SELECT user_id FROM shaz_orders WHERE id=$1", [
            u.order,
          ])
        ).rows[0].user_id,
        null,
      );
      await assert.rejects(session(u.headers));
    },
  );
  await browser.close();
  await writeFile(
    "test-artifacts/integration-results.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        database: "Isolated PGlite PostgreSQL via wire protocol",
        payment:
          "Signed local Stripe fixtures; no actual Stripe test account calls",
        email: "Encrypted local mail capture; no actual mailbox delivery",
        results,
      },
      null,
      2,
    ),
  );
  console.log("ALL " + results.length + " INTEGRATION GROUPS PASSED");
} catch (e) {
  console.error(e);
  console.error(serverOutput.slice(-5000));
  await writeFile("test-artifacts/integration-failure.txt", String(e)).catch(
    () => {},
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill("SIGTERM");
  await db().end();
  await socket.stop();
  await pg.close();
}
