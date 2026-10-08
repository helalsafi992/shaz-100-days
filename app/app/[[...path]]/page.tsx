import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { access, session } from "@/lib/auth";
import { snapshot } from "@/lib/platform";
import Portal, { type PlatformState } from "@/components/Portal";
import Account from "@/components/Account";
import Gate from "@/components/Gate";
import { HttpError } from "@/lib/security";
import { testGrant } from "@/lib/test-environment";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Dit forløb · SHAZ",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const view = (await params).path?.[0] || "today";
  try {
    if (view === "profile") {
      const s = await session(await headers());
      const orders = await db().query(
        "SELECT id,status,amount,currency,created_at,livemode,receipt FROM shaz_orders WHERE user_id=$1 OR lower(email)=lower($2) ORDER BY created_at DESC",
        [s.user.id, s.user.email],
      );
      return (
        <Account
          email={s.user.email}
          test={Boolean(await testGrant(s.user.id))}
          orders={JSON.parse(JSON.stringify(orders.rows))}
        />
      );
    }
    const s = await access(await headers());
    const state = await snapshot(s.user.id);
    if (!state.profile.start_date) redirect("/onboarding");
    if (state.day > 100 && ["food", "training"].includes(view))
      redirect("/app");
    return (
      <Portal
        initial={JSON.parse(JSON.stringify(state)) as PlatformState}
        view={
          ["today", "training", "food", "progress"].includes(view)
            ? view
            : "today"
        }
      />
    );
  } catch (e) {
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
    if (e instanceof HttpError && e.status === 401) redirect("/login");
    return (
      <Gate
        message={
          e instanceof HttpError
            ? e.message
            : "Kundeområdet er ved at blive gjort klar. Prøv igen om lidt."
        }
      />
    );
  }
}
