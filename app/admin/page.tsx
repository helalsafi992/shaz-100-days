import { headers } from "next/headers";
import { session, admin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Admin from "@/components/Admin";
import Gate from "@/components/Gate";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administration · SHAZ",
  robots: { index: false, follow: false },
};
export default async function Page() {
  let s;
  try {
    s = await session(await headers());
  } catch {
    redirect("/login");
  }
  try {
    await admin(await headers());
  } catch (error) {
    if ((error as { status?: number }).status === 428)
      redirect("/admin/security");
    const invitation = await db().query(
      "SELECT 1 FROM shaz_invites WHERE lower(email)=lower($1) AND used_at IS NULL AND expires>now()",
      [s.user.email],
    );
    if (!invitation.rowCount)
      return (
        <Gate message="Denne side kræver en verificeret administratorinvitation." />
      );
  }
  return <Admin />;
}
