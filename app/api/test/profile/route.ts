import { access } from "@/lib/auth";
import { sameOrigin, failure, body } from "@/lib/security";
import { resetTestProfile } from "@/lib/test-profile";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const s = await access(req.headers);
    const { populated } = z.object({ populated: z.boolean() }).parse(await body(req));
    await resetTestProfile(s.user.id, populated);
    return Response.json({ ok: true });
  } catch (e) { return failure(e); }
}
