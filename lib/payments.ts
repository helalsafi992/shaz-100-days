import Stripe from "stripe";
import { db, schema, transaction, audit } from "./db";
import { baseURL, HttpError, hash, opaque } from "./security";
import { requestLogin, liveMode } from "./auth";
import { sendMail } from "./mail";
export const TERMS_VERSION = "2026-10-platform-1";
export const termsText =
  "SHAZ — 100 DAY TRANSFORMATION er et selvstyret digitalt trænings- og kostforløb for voksne. Samlet pris 399 DKK. Engangsbetaling uden abonnement. 100 kalenderdages aktiv adgang fra den dato, du vælger ved aktivering. Købet starter ikke dag 1 automatisk. Du beholder 14 dages fortrydelsesret fra aftalens indgåelse, også hvis du starter straks. Brug Profil → Mit køb eller kontakt support. Ingen resultatgaranti eller 1:1-coaching.";
export function missingConfiguration() {
  const required = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_ID",
    "BETTER_AUTH_SECRET",
    "RESEND_API_KEY",
    "RESEND_WEBHOOK_SECRET",
    "EMAIL_FROM",
    "SUPPORT_EMAIL",
    "SELLER_NAME",
    "SELLER_CVR",
    "SELLER_ADDRESS",
  ];
  return required.filter((k) => !process.env[k]);
}
export function salesOpen() {
  return (
    process.env.SALES_ENABLED === "true" &&
    missingConfiguration().length === 0 &&
    ["LEGAL_APPROVED", "CONTENT_APPROVED", "DELIVERY_VERIFIED"].every(
      (k) => process.env[k] === "true",
    )
  );
}
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new HttpError(503, "Betaling er endnu ikke åbnet.");
  const key = process.env.STRIPE_SECRET_KEY;
  if (
    (liveMode() && !key.startsWith("sk_live_")) ||
    (!liveMode() && !key.startsWith("sk_test_"))
  )
    throw new Error("STRIPE_MODE_MISMATCH");
  return new Stripe(key);
}
function receiptSnapshot() {
  return {
    termsText,
    termsVersion: TERMS_VERSION,
    seller: process.env.SELLER_NAME,
    cvr: process.env.SELLER_CVR,
    address: process.env.SELLER_ADDRESS,
    support: process.env.SUPPORT_EMAIL,
  };
}
export async function createCheckout(email: string) {
  if (!salesOpen())
    throw new HttpError(
      503,
      "Vi gør SHAZ klar. Rigtige køb er endnu ikke åbnet.",
    );
  await schema();
  const published = await db().query(
    "SELECT kind,count(DISTINCT id)::int AS n FROM shaz_content WHERE status='published' GROUP BY kind",
  );
  const counts = Object.fromEntries(published.rows.map((r) => [r.kind, r.n]));
  if (
    (counts.recipe || 0) < 30 ||
    (counts.exercise || 0) < 25 ||
    (counts.template || 0) < 12 ||
    (counts.focus || 0) < 15
  )
    throw new HttpError(503, "Indholdet afventer afsluttende gennemgang.");
  const price = await stripe().prices.retrieve(process.env.STRIPE_PRICE_ID!);
  if (
    price.unit_amount !== 39900 ||
    price.currency !== "dkk" ||
    price.type !== "one_time" ||
    !price.active ||
    price.livemode !== liveMode() ||
    price.tax_behavior === "exclusive"
  )
    throw new Error("PRICE_MISMATCH");
  const id = crypto.randomUUID(),
    token = opaque();
  await db().query(
    "INSERT INTO shaz_checkout(id,token_hash,terms_version,receipt) VALUES($1,$2,$3,$4)",
    [id, hash(token), TERMS_VERSION, JSON.stringify(receiptSnapshot())],
  );
  const s = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      customer_email: email,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: baseURL() + "/checkout/success",
      cancel_url: baseURL() + "/checkout?cancelled=1",
      client_reference_id: id,
      metadata: { product: "shaz-100-days", terms_version: TERMS_VERSION },
      payment_intent_data: { metadata: { product: "shaz-100-days" } },
      allow_promotion_codes: false,
      automatic_tax: { enabled: false },
      custom_text: {
        submit: {
          message:
            "399 DKK i alt. Én betaling. 100 dages adgang fra din valgte startdato. 14 dages fortrydelsesret.",
        },
      },
    },
    { idempotencyKey: id },
  );
  await db().query("UPDATE shaz_checkout SET checkout_id=$2 WHERE id=$1", [
    id,
    s.id,
  ]);
  return { url: s.url, token };
}
export function validatePaidSession(s: Stripe.Checkout.Session) {
  const items = s.line_items?.data || [];
  if (
    s.payment_status !== "paid" ||
    s.mode !== "payment" ||
    s.amount_total !== 39900 ||
    s.currency !== "dkk" ||
    s.livemode !== liveMode() ||
    s.metadata?.product !== "shaz-100-days" ||
    items.length !== 1 ||
    items[0].price?.id !== process.env.STRIPE_PRICE_ID ||
    items[0].quantity !== 1 ||
    !s.customer_details?.email
  )
    throw new Error("PAYMENT_VALIDATION_FAILED");
}
export async function processEvent(
  event: Stripe.Event,
  retrieve = (id: string) =>
    stripe().checkout.sessions.retrieve(id, {
      expand: ["line_items", "payment_intent.latest_charge"],
    }),
) {
  await schema();
  if (event.livemode !== liveMode()) throw new Error("EVENT_MODE_MISMATCH");
  const object = event.data.object;
  let paid: Stripe.Checkout.Session | undefined;
  if (
    [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ].includes(event.type)
  ) {
    const s = object as Stripe.Checkout.Session;
    if (
      s.payment_status === "paid" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      paid = await retrieve(s.id);
      validatePaidSession(paid);
    }
  }
  const outcome = await transaction(async (c) => {
    const inserted = await c.query(
      "INSERT INTO shaz_events(id,type) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING id",
      [event.id, event.type],
    );
    if (!inserted.rowCount) return null;
    if (paid) {
      const s = paid;
      const email = s.customer_details!.email!.toLowerCase();
      const reference = await c.query(
        "SELECT id,terms_version,receipt FROM shaz_checkout WHERE checkout_id=$1 AND id=$2",
        [s.id, s.client_reference_id],
      );
      if (!reference.rowCount) throw new Error("CHECKOUT_REFERENCE_MISMATCH");
      const id = crypto.randomUUID();
      const receipt = Object.keys(reference.rows[0].receipt).length
        ? reference.rows[0].receipt
        : receiptSnapshot();
      if (
        s.metadata?.terms_version &&
        s.metadata.terms_version !== reference.rows[0].terms_version
      )
        throw new Error("CONSENT_VERSION_MISMATCH");
      const charge =
        typeof s.payment_intent === "object" &&
        s.payment_intent &&
        typeof s.payment_intent.latest_charge === "object"
          ? s.payment_intent.latest_charge
          : null;
      const status = charge?.refunded
        ? "refunded"
        : charge?.disputed
          ? "disputed"
          : "paid";
      const r = await c.query(
        `INSERT INTO shaz_orders(id,checkout_id,payment_id,email,amount,currency,livemode,status,product,paid_at,terms_version,receipt) VALUES($1,$2,$3,$4,39900,'dkk',$5,$8,'shaz-100-days',now(),$6,$7) ON CONFLICT(checkout_id) DO NOTHING RETURNING id`,
        [
          id,
          s.id,
          typeof s.payment_intent === "string"
            ? s.payment_intent
            : s.payment_intent?.id,
          email,
          s.livemode,
          TERMS_VERSION,
          JSON.stringify(receipt),
          status,
        ],
      );
      await c.query("UPDATE shaz_checkout SET email=$2 WHERE checkout_id=$1", [
        s.id,
        email,
      ]);
      return r.rowCount ? { id, email, ...receipt } : null;
    }
    if (event.type === "charge.refunded") {
      const charge = object as Stripe.Charge;
      const pid =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
      await c.query(
        "UPDATE shaz_orders SET refunded_amount=GREATEST(refunded_amount,$2),status=CASE WHEN GREATEST(refunded_amount,$2)>=amount THEN 'refunded' ELSE status END WHERE payment_id=$1",
        [pid, charge.amount_refunded],
      );
    }
    if (
      event.type === "charge.dispute.created" ||
      event.type === "charge.dispute.closed"
    ) {
      const d = object as Stripe.Dispute;
      const pid =
        typeof d.payment_intent === "string"
          ? d.payment_intent
          : d.payment_intent?.id;
      await c.query(
        "UPDATE shaz_orders SET status=CASE WHEN refunded_amount>=amount THEN 'refunded' WHEN $2='won' THEN 'paid' ELSE 'disputed' END,last_dispute_at=$3 WHERE payment_id=$1 AND last_dispute_at<=$3",
        [
          pid,
          event.type === "charge.dispute.closed" ? d.status : "open",
          event.created || 0,
        ],
      );
    }
    return null;
  });
  const delivery =
    outcome ||
    (paid
      ? (
          await db().query(
            "SELECT id,email,receipt FROM shaz_orders WHERE checkout_id=$1",
            [paid.id],
          )
        ).rows[0]
      : null);
  if (delivery) {
    await sendMail(
      delivery.email,
      "receipt",
      { order: delivery.id, ...(delivery.receipt || delivery) },
      "receipt-" + delivery.id,
    );
    const sent = await db().query("SELECT 1 FROM shaz_mail WHERE id=$1", [
      "first-login-" + delivery.id,
    ]);
    if (!sent.rowCount)
      try {
        await requestLogin(
          delivery.email,
          new Headers({ origin: baseURL() }),
          delivery.id,
        );
      } catch {
        await audit(null, "login_delivery_error", delivery.id);
      }
  }
}
