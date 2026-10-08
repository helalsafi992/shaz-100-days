import { requestLogin } from "@/lib/auth";
import { sameOrigin, body, failure, rate } from "@/lib/security";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { email } = z
      .object({ email: z.email().max(254) })
      .parse(await body(req));
    await rate("login:" + email.toLowerCase(), 4);
    await rate(
      "login-ip:" + (req.headers.get("x-forwarded-for") || "unknown"),
      20,
    );
    await requestLogin(email, req.headers);
    return Response.json({
      message:
        "Hvis der findes et køb eller en invitation til adressen, er et loginlink på vej. Kontrollér også spam.",
    });
  } catch (e) {
    return failure(e);
  }
}
