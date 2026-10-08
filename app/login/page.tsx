export const dynamic = "force-dynamic";
import { isolatedTest } from "@/lib/test-environment";
import Login from "@/components/Login";
export const metadata = {
  title: "Log ind · SHAZ",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <Login test={isolatedTest()} />;
}
