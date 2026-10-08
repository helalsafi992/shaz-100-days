import { auth } from "@/lib/auth";
import { sameOrigin, failure, rate, HttpError } from "@/lib/security";
import { schema } from "@/lib/db";
import { isolatedTest } from "@/lib/test-environment";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const endpoint = new URL(req.url).pathname.replace("/api/auth/", "");
    if (!["sign-out", "sign-in/email", "sign-up/email", "request-password-reset", "reset-password", "send-verification-email", "change-password"].includes(endpoint))
      return new Response("Not found", { status: 404 });
    await schema();
    await rate("auth:" + endpoint + ":" + (req.headers.get("x-forwarded-for") || "unknown"), 20);
    if (["sign-up/email", "request-password-reset", "send-verification-email"].includes(endpoint) && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM))
      throw new HttpError(503, isolatedTest() ? "Brug den udleverede testkonto. E-mail er endnu ikke tilsluttet dette testmiljø." : "Kontooprettelse og e-mail er ved at blive gjort klar.");
    return auth().handler(req);
  } catch (e) {
    return failure(e);
  }
}
export function GET() {
  return new Response("Not found", { status: 404 });
}
