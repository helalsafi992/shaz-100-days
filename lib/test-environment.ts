import { db } from "./db";
import { HttpError } from "./security";

// A test entitlement is valid only in this isolated deployment and database.
export function isolatedTest() {
  return process.env.APP_ENV === "staging" &&
    process.env.TEST_ACCESS_ENABLED === "true" &&
    process.env.RAILWAY_PROJECT_ID === "6a019412-cb8a-4ac1-a8ae-a1c315f7b211" &&
    process.env.APP_URL === "https://shaz-test-staging.up.railway.app" &&
    process.env.STRIPE_MODE !== "live";
}
export async function requireTestDatabase() {
  if (!isolatedTest()) throw new HttpError(404, "Siden findes ikke.");
  const r = await db().query("SELECT current_database() AS name");
  if (r.rows[0]?.name !== "shaz_test") throw new Error("TEST_DATABASE_REQUIRED");
}
export async function testGrant(user: string) {
  if (!isolatedTest()) return null;
  await requireTestDatabase();
  const r = await db().query("SELECT user_id,expires_at FROM shaz_test_access WHERE user_id=$1 AND expires_at>now()", [user]);
  return r.rows[0] || null;
}
