import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { db, schema, transaction } from "./db";
import { baseURL, HttpError, hash } from "./security";
import { sendMail } from "./mail";
import { isolatedTest, testGrant } from "./test-environment";
function createAuth() {
  if (!process.env.BETTER_AUTH_SECRET)
    throw new HttpError(503, "Login er ikke åbnet endnu.");
  return betterAuth({
    appName: "SHAZ",
    baseURL: baseURL(),
    secret: process.env.BETTER_AUTH_SECRET,
    database: db(),
    user: { modelName: "shaz_user" },
    session: {
      modelName: "shaz_session",
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    account: { modelName: "shaz_account" },
    verification: { modelName: "shaz_verification" },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }) => {
        await sendMail(user.email, "password-reset", {
          url: baseURL() + "/login#reset=" + encodeURIComponent(token),
        });
      },
    },
    emailVerification: {
      // The route queues verification after signup commits, avoiding nested DB pool waits.
      sendOnSignUp: false,
      sendOnSignIn: !isolatedTest(),
      autoSignInAfterVerification: true,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, token }) => {
        await sendMail(user.email, "verify-email", {
          url: baseURL() + "/login#verify=" + encodeURIComponent(token),
        });
      },
    },
    advanced: { database: { generateId: () => crypto.randomUUID() } },
    rateLimit: { enabled: false },
    trustedOrigins: [baseURL()],
    plugins: [
      magicLink({
        expiresIn: 900,
        storeToken: "hashed",
        sendMagicLink: async ({ email, token, metadata }) => {
          await sendMail(
            email,
            "login",
            { url: baseURL() + "/login#token=" + encodeURIComponent(token) },
            metadata?.orderId
              ? "first-login-" + String(metadata.orderId)
              : undefined,
          );
        },
      }),
    ],
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function auth() {
  return (instance ??= createAuth());
}
export async function session(headers: Headers) {
  await schema();
  const s = await auth().api.getSession({ headers });
  if (!s?.user.emailVerified)
    throw new HttpError(401, "Log ind og bekræft din e-mail.");
  return s;
}
export const liveMode = () => process.env.STRIPE_MODE === "live";
export async function access(headers: Headers) {
  const s = await session(headers);
  if (await testGrant(s.user.id))
    return { ...s, order: { id: "isolated-test-access", status: "test" } };
  const q = await db().query(
    `UPDATE shaz_orders SET user_id=$1 WHERE lower(email)=lower($2) AND user_id IS NULL`,
    [s.user.id, s.user.email],
  );
  void q;
  const o = await db().query(
    `SELECT id,created_at,status,paid_at FROM shaz_orders WHERE user_id=$1 AND status='paid' AND livemode=$2 ORDER BY paid_at DESC LIMIT 1`,
    [s.user.id, liveMode()],
  );
  if (!o.rowCount)
    throw new HttpError(
      403,
      "Din konto har ikke et gyldigt køb. Kontakt support, hvis du har betalt.",
    );
  return { ...s, order: o.rows[0] };
}
export async function admin(headers: Headers, owner = false) {
  const s = await session(headers);
  const r = await db().query("SELECT role FROM shaz_roles WHERE user_id=$1", [
    s.user.id,
  ]);
  if (!r.rowCount || (owner && r.rows[0].role !== "owner"))
    throw new HttpError(403, "Denne side kræver administratoradgang.");
  return { ...s, role: r.rows[0].role as "owner" | "editor" };
}
export async function requestLogin(
  email: string,
  headers: Headers,
  orderId?: string,
) {
  await schema();
  const allowed = await db().query(
    `SELECT 1 FROM shaz_orders WHERE lower(email)=lower($1) AND status IN ('paid','refunded','disputed') UNION ALL SELECT 1 FROM shaz_invites WHERE lower(email)=lower($1) AND expires>now() AND used_at IS NULL UNION ALL SELECT 1 FROM shaz_user WHERE lower(email)=lower($1) LIMIT 1`,
    [email],
  );
  if (allowed.rowCount)
    await auth().api.signInMagicLink({
      body: {
        email: email.toLowerCase(),
        metadata: orderId ? { orderId } : undefined,
        callbackURL: "/app",
        newUserCallbackURL: "/onboarding",
        errorCallbackURL: "/login?error=expired",
      },
      headers,
    });
}
export async function acceptInvite(headers: Headers, token: string) {
  const s = await session(headers);
  await transaction(async (c) => {
    const r = await c.query(
      `UPDATE shaz_invites SET used_at=now() WHERE token_hash=$1 AND lower(email)=lower($2) AND used_at IS NULL AND expires>now() RETURNING role`,
      [hash(token), s.user.email],
    );
    if (!r.rowCount)
      throw new HttpError(
        400,
        "Invitationen er udløbet eller tilhører en anden e-mail.",
      );
    await c.query(
      "INSERT INTO shaz_roles(user_id,role) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role",
      [s.user.id, r.rows[0].role],
    );
  });
}
