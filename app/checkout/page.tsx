import { headers } from "next/headers";
import { session } from "@/lib/auth";
import Checkout from "@/components/Checkout";
import { salesOpen } from "@/lib/payments";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const account = await session(await headers()).catch(() => null);
  return (
    <Checkout
      open={salesOpen()}
      email={account?.user.email}
      cancelled={(await searchParams).cancelled === "1"}
    />
  );
}
