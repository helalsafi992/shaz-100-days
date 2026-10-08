import { stripe, processEvent } from "@/lib/payments";
export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    return new Response("Not configured", { status: 503 });
  let event;
  try {
    event = stripe().webhooks.constructEvent(
      await req.text(),
      req.headers.get("stripe-signature") || "",
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  try {
    await processEvent(event);
    return Response.json({ received: true });
  } catch {
    console.error(
      JSON.stringify({ event: "payment_processing_failed", eventId: event.id }),
    );
    return new Response("Retry required", { status: 500 });
  }
}
