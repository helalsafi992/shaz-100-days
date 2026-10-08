import { accountSession } from "@/lib/auth";
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
    const account = await accountSession(req.headers);
    const result = await createCheckout(account.user);
    return Response.json({ url: result.url });
  } catch (e) {
    return failure(e);
  }
}
