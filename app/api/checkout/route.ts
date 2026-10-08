import { session } from "@/lib/auth";
import { createCheckout } from "@/lib/payments";
import { sameOrigin, body, failure, rate } from "@/lib/security";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await rate(
      "checkout:" + (req.headers.get("x-forwarded-for") || "unknown"),
      10,
    );
    z.object({ adult: z.literal(true), terms: z.literal(true) }).parse(
      await body(req),
    );
    const account = await session(req.headers);
    const result = await createCheckout(account.user.email);
    return Response.json(
      { url: result.url },
      {
        headers: {
          "Set-Cookie": `shaz_checkout=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
        },
      },
    );
  } catch (e) {
    return failure(e);
  }
}
