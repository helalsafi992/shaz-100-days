import { schema, db, audit } from "../lib/db";
import { opaque, hash, baseURL } from "../lib/security";
import { sendMail } from "../lib/mail";
// Run only from an authorized operator's environment. No secret or invitation is printed.
if (
  !process.env.BETTER_AUTH_SECRET ||
  !process.env.OWNER_EMAIL ||
  !process.env.RESEND_API_KEY ||
  !process.env.EMAIL_FROM
)
  throw new Error("OWNER_EMAIL, RESEND_API_KEY and EMAIL_FROM are required");
await schema();
const email = process.env.OWNER_EMAIL.toLowerCase();
const token = opaque();
await db().query(
  "INSERT INTO shaz_invites(token_hash,email,role,expires) VALUES($1,$2,'owner',now()+interval '24 hours')",
  [hash(token), email],
);
await sendMail(email, "invite", { url: baseURL() + "/admin#invite=" + token });
await audit(null, "owner_invitation_created", hash(email));
console.log(
  "Owner invitation queued. Verify delivery status before relying on it.",
);
await db().end();
