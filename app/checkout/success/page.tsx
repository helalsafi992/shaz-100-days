import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accountSession, access } from "@/lib/auth";
import Confirmation from "@/components/Confirmation";
export const dynamic = "force-dynamic";
export default async function Page() {
  const h = await headers();
  const s = await accountSession(h).catch(() => null);
  if (!s) redirect("/login?next=checkout");
  if (
    await access(h)
      .then(() => true)
      .catch(() => false)
  )
    redirect("/app");
  return <Confirmation email={s.user.email} verified={s.user.emailVerified} />;
}
