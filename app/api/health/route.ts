import { schema, db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await schema();
    await db().query("SELECT 1");
    return Response.json({
      status: "ok",
      service: "shaz-100-days",
      version: "customer-platform-1",
      commit: process.env.RAILWAY_GIT_COMMIT_SHA || "local",
    });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
