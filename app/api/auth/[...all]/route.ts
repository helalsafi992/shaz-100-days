import { auth, adminRole, admin } from "@/lib/auth";
import { sameOrigin, failure, rate, HttpError } from "@/lib/security";
import { schema, db } from "@/lib/db";
import { recordAdminFactor } from "@/lib/admin-mfa";
import { isolatedTest } from "@/lib/test-environment";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const endpoint = new URL(req.url).pathname.replace("/api/auth/", "");
    if (
      ![
        "sign-out",
        "sign-in/email",
        "sign-up/email",
        "request-password-reset",
        "reset-password",
        "send-verification-email",
        "change-password",
        "two-factor/enable",
        "two-factor/verify-totp",
        "two-factor/verify-backup-code",
        "two-factor/generate-backup-codes",
      ].includes(endpoint)
    )
      return new Response("Not found", { status: 404 });
    await schema();
    if (endpoint === "two-factor/enable") {
      const s = await adminRole(req.headers);
      if (s.user.twoFactorEnabled) await admin(req.headers);
      await db().query("DELETE FROM shaz_admin_mfa WHERE user_id=$1", [
        s.user.id,
      ]);
    }
    if (endpoint === "two-factor/generate-backup-codes")
      await admin(req.headers);
    await rate(
      "auth:" +
        endpoint +
        ":" +
        (req.headers.get("x-forwarded-for") || "unknown"),
      20,
    );
    if (
      [
        "sign-up/email",
        "request-password-reset",
        "send-verification-email",
      ].includes(endpoint) &&
      !(
        process.env.APP_ENV === "test" && process.env.MAIL_TRANSPORT === "test"
      ) &&
      (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    )
      throw new HttpError(
        503,
        isolatedTest()
          ? "Brug den udleverede testkonto. E-mail er endnu ikke tilsluttet dette testmiljø."
          : "Kontooprettelse og e-mail er ved at blive gjort klar.",
      );
    const response = await auth().handler(req);
    if (
      ["two-factor/verify-totp", "two-factor/verify-backup-code"].includes(
        endpoint,
      )
    )
      await recordAdminFactor(req, response);
    response.headers.set("Cache-Control", "no-store");
    if (endpoint === "sign-up/email" && response.ok) {
      const data = await response.clone().json();
      if (data.user?.email)
        await auth().api.sendVerificationEmail({
          body: { email: data.user.email, callbackURL: "/checkout" },
          headers: req.headers,
        });
    }
    return response;
  } catch (e) {
    return failure(e);
  }
}
export function GET() {
  return new Response("Not found", { status: 404 });
}
