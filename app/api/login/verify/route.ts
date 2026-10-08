import { auth } from "@/lib/auth";
import { sameOrigin, body, failure, rate } from "@/lib/security";
import { schema } from "@/lib/db";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await schema();
    await rate(
      "verify:" + (req.headers.get("x-forwarded-for") || "unknown"),
      20,
    );
    const { token } = z
      .object({ token: z.string().min(20).max(512) })
      .parse(await body(req));
    const result = await auth().api.magicLinkVerify({
      query: {
        token,
        callbackURL: "/app",
        newUserCallbackURL: "/onboarding",
        errorCallbackURL: "/login?error=expired",
      },
      headers: req.headers,
      asResponse: true,
    });
    const location = result.headers.get("location") || "";
    if (location.includes("error="))
      return Response.json(
        { error: "Linket er udløbet eller brugt. Bed om et nyt link." },
        { status: 400 },
      );
    const headers = new Headers({ "Content-Type": "application/json" });
    for (const cookie of result.headers.getSetCookie())
      headers.append("Set-Cookie", cookie);
    return new Response(JSON.stringify({ ok: true }), { headers });
  } catch (e) {
    return failure(e);
  }
}
