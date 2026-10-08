import Checkout from "@/components/Checkout";
import { salesOpen } from "@/lib/payments";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  return (
    <Checkout
      open={salesOpen()}
      cancelled={(await searchParams).cancelled === "1"}
    />
  );
}
