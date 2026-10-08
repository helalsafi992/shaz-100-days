import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { hash } from "@/lib/security";
import Confirmation from "@/components/Confirmation";
export const dynamic = "force-dynamic";
export default async function Page() {
  let email = "",
    paid = false;
  const token = (await cookies()).get("shaz_checkout")?.value;
  if (token) {
    await schema();
    const r = await db().query(
      `SELECT c.email,o.status FROM shaz_checkout c LEFT JOIN shaz_orders o ON o.checkout_id=c.checkout_id WHERE c.token_hash=$1 AND c.created_at>now()-interval '24 hours'`,
      [hash(token)],
    );
    if (r.rowCount) {
      email = r.rows[0].email || "";
      paid = r.rows[0].status === "paid";
    }
  }
  return <Confirmation email={email} paid={paid} />;
}
