import { auth } from "./auth";
import { db, audit } from "./db";

/** Record authorization freshness only AFTER Better Auth has verified the factor.
 * This is not a login/session issuer. getSession verifies the library's signed
 * cookie against its session store, including rotated enrollment/login cookies.
 */
export async function recordAdminFactor(req: Request, response: Response) {
  if (!response.ok) return;
  const cookies = new Map<string, string>();
  for (const entry of (req.headers.get("cookie") || "").split(";")) {
    const i = entry.indexOf("=");
    if (i > 0) cookies.set(entry.slice(0, i).trim(), entry.slice(i + 1).trim());
  }
  for (const entry of response.headers.getSetCookie()) {
    const pair = entry.split(";")[0],
      i = pair.indexOf("=");
    if (i > 0) cookies.set(pair.slice(0, i), pair.slice(i + 1));
  }
  const headers = new Headers(req.headers);
  headers.set("cookie", [...cookies].map(([k, v]) => `${k}=${v}`).join("; "));
  const s = await auth().api.getSession({ headers });
  if (!s || !s.user.twoFactorEnabled) return;
  const result = await db().query(
    `INSERT INTO shaz_admin_mfa(session_id,user_id,expires_at)
     SELECT $1,$2,now()+interval '30 minutes' WHERE EXISTS
       (SELECT 1 FROM shaz_roles WHERE user_id=$2)
     ON CONFLICT(session_id) DO UPDATE SET verified_at=now(),expires_at=excluded.expires_at
     RETURNING session_id`,
    [s.session.id, s.user.id],
  );
  if (result.rowCount)
    await audit(s.user.id, "admin-mfa-verified", "current-session");
}
