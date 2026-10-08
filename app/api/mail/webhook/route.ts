import { Webhook } from "svix";
import { db, schema } from "@/lib/db";
import { z } from "zod";
export async function POST(req: Request) {
  if (!process.env.RESEND_WEBHOOK_SECRET)
    return new Response("Not configured", { status: 503 });
  let p: { type: string; data: { email_id: string } };
  try {
    const raw = await req.text();
    new Webhook(process.env.RESEND_WEBHOOK_SECRET).verify(
      raw,
      Object.fromEntries(req.headers),
    );
    p = z
      .object({ type: z.string(), data: z.object({ email_id: z.string() }) })
      .parse(JSON.parse(raw));
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }
  try {
    await schema();
    const status: Record<string, string> = {
      "email.delivered": "delivered",
      "email.bounced": "bounced",
      "email.complained": "complained",
      "email.failed": "failed",
    };
    if (status[p.type])
      await db().query(
        "UPDATE shaz_mail SET status=$2,delivered_at=CASE WHEN $2='delivered' THEN COALESCE(delivered_at,now()) ELSE delivered_at END WHERE provider_id=$1 AND (status NOT IN ('bounced','complained') OR $2 IN ('bounced','complained'))",
        [p.data.email_id, status[p.type]],
      );
    return Response.json({ received: true });
  } catch {
    return new Response("Retry required", { status: 503 });
  }
}
