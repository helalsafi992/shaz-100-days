import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminRole } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminSecurity from "@/components/AdminSecurity";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administratorsikkerhed · SHAZ",
  robots: { index: false, follow: false },
};
export default async function Page() {
  let s;
  try {
    s = await adminRole(await headers());
  } catch {
    redirect("/login");
  }
  const accounts = await db().query(
    `SELECT 1 FROM shaz_account WHERE "userId"=$1 AND "providerId"='credential'`,
    [s.user.id],
  );
  return (
    <AdminSecurity
      enabled={!!s.user.twoFactorEnabled}
      hasPassword={!!accounts.rowCount}
    />
  );
}
