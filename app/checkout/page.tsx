import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accountSession, access } from "@/lib/auth";
import Checkout from "@/components/Checkout";
import { salesOpen } from "@/lib/payments";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const h = await headers();
  if (
    await access(h)
      .then(() => true)
      .catch(() => false)
  )
    redirect("/app");
  const account = await accountSession(h).catch(() => null);
  return (
    <Checkout
      open={salesOpen()}
      email={account?.user.email}
      verified={account?.user.emailVerified}
      cancelled={(await searchParams).cancelled === "1"}
    />
  );
}
