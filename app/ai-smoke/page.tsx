import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { access } from "@/lib/auth";
import { isolatedTest } from "@/lib/test-environment";
import AISmokeTest from "@/components/AISmokeTest";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page(){
  if(!isolatedTest())notFound();
  try { await access(await headers()); } catch { redirect("/login"); }
  return <AISmokeTest/>;
}
