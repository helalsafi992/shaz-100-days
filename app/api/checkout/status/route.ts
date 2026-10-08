import { accountSession, access, liveMode } from "@/lib/auth";
import { db } from "@/lib/db";
import { failure } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const s = await accountSession(req.headers);
    const granted = await access(req.headers)
      .then(() => true)
      .catch(() => false);
    const orders = await db().query(
      "SELECT status FROM shaz_orders WHERE user_id=$1 AND livemode=$2 ORDER BY created_at DESC LIMIT 1",
      [s.user.id, liveMode()],
    );
    const checkout = await db().query(
      "SELECT state FROM shaz_checkout WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [s.user.id],
    );
    return Response.json(
      {
        email: s.user.email,
        verified: s.user.emailVerified,
        granted,
        status: granted
          ? "paid"
          : orders.rows[0]?.status || (checkout.rowCount ? "pending" : "none"),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
