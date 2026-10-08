import { schema, db, audit } from "../lib/db";
import { requireTestDatabase } from "../lib/test-environment";
import { auth } from "../lib/auth";
import { resetTestProfile } from "../lib/test-profile";
await requireTestDatabase();
await schema();
const email = process.env.TEST_ACCOUNT_EMAIL;
const password = process.env.TEST_ACCOUNT_PASSWORD;
if (!email || !password || password.length < 20) throw new Error("TEST_ACCOUNT_CREDENTIALS_REQUIRED");
const existing = await db().query("SELECT id FROM shaz_user WHERE lower(email)=lower($1)", [email]);
if (!existing.rowCount) {
  const result = await auth().api.signUpEmail({ body: { name: "SHAZ Test", email, password } });
  const user = result.user.id;
  await db().query('UPDATE shaz_user SET "emailVerified"=true WHERE id=$1', [user]);
  await db().query("INSERT INTO shaz_test_access(user_id,expires_at) VALUES($1,now()+interval '180 days')", [user]);
  await db().query("INSERT INTO shaz_roles(user_id,role) VALUES($1,'owner')", [user]);
  await resetTestProfile(user, true);
  await audit(user, "isolated_test_seed", user);
}
console.log("Isolated test account ready. No credentials are printed.");
await db().end();
