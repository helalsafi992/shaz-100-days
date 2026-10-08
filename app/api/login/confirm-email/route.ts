import { auth } from "@/lib/auth";
import { sameOrigin, failure, body, rate } from "@/lib/security";
import { schema } from "@/lib/db";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    sameOrigin(req); await schema();
    await rate("confirm-email:" + (req.headers.get("x-forwarded-for") || "unknown"), 15);
    const { token } = z.object({ token: z.string().min(1).max(4000) }).parse(await body(req));
    const r = await auth().api.verifyEmail({ query: { token, callbackURL: "/checkout" }, headers: req.headers, asResponse: true });
    const headers = new Headers({ "Content-Type": "application/json" });
    for (const cookie of r.headers.getSetCookie()) headers.append("Set-Cookie", cookie);
    if (r.status >= 400 || r.headers.get("location")?.includes("error=")) return Response.json({ error: "Linket er udløbet. Bed om et nyt." }, { status: 400 });
    return new Response(JSON.stringify({ ok: true }), { headers });
  } catch (e) { return failure(e); }
}
