import { z } from "zod";
import { sameOrigin, body, failure, rate } from "@/lib/security";
import { db, schema, audit } from "@/lib/db";
import { accountSession } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await schema();
    await rate(
      "support:" + (req.headers.get("x-forwarded-for") || "unknown"),
      10,
      60,
    );
    const v = z
      .object({
        kind: z.enum(["support", "withdrawal"]),
        name: z.string().trim().min(1).max(100),
        email: z.email().max(254),
        orderReference: z.string().trim().max(100),
        message: z.string().max(3000),
        idempotencyKey: z.string().uuid(),
        confirmed: z.literal(true),
      })
      .refine(
        (v) => v.kind !== "withdrawal" || Boolean(v.orderReference),
        "Angiv ordrenummer eller købsdato.",
      )
      .parse(await body(req));
    let user: string | null = null;
    try {
      user = (await accountSession(req.headers)).user.id;
    } catch {}
    const text =
      v.kind === "withdrawal"
        ? `Jeg, ${v.name}, meddeler herved, at jeg ønsker at fortryde aftalen om SHAZ — 100 dages forløb. Reference: ${v.orderReference}. Kvittering til ${v.email}.`
        : v.name + ": " + v.message;
    const result = await db().query(
      "INSERT INTO shaz_requests(id,user_id,kind,email,order_reference,message,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(idempotency_key) DO UPDATE SET idempotency_key=excluded.idempotency_key WHERE shaz_requests.email=excluded.email AND shaz_requests.kind=excluded.kind RETURNING id,created_at",
      [
        crypto.randomUUID(),
        user,
        v.kind,
        v.email.toLowerCase(),
        v.orderReference,
        text,
        v.idempotencyKey,
      ],
    );
    if (!result.rowCount)
      return Response.json(
        { error: "Genstart formularen; anmodningsnøglen kan ikke genbruges." },
        { status: 409 },
      );
    const r = result.rows[0];
    await audit(user, v.kind + "_received", r.id);
    await sendMail(
      v.email.toLowerCase(),
      "request-receipt",
      { id: r.id, kind: v.kind, createdAt: r.created_at, statement: text },
      "request-" + r.id,
    );
    return Response.json(
      {
        id: r.id,
        createdAt: r.created_at,
        mailConfigured: Boolean(
          process.env.RESEND_API_KEY && process.env.EMAIL_FROM,
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
