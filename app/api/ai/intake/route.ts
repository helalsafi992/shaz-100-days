import { access } from "@/lib/auth";
import { storedIntake, storeIntake, revokeIntake } from "@/lib/ai/intake-store";
import { body, sameOrigin, rate, failure } from "@/lib/security";
import { intakeVersion } from "@/lib/ai/intake";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (data: unknown, status = 200) => Response.json(data, {
  status,
  headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }
});
export async function GET(req: Request) {
  try {
    const s = await access(req.headers);
    return reply({ version: intakeVersion, draft: await storedIntake(s.user.id) });
  } catch (e) { return failure(e); }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const s = await access(req.headers);
    await rate("intake:" + s.user.id, 60, 10);
    const intake = await storeIntake(s.user.id, await body(req));
    return reply({ ok: true, version: intake.version, hasSafetyScreen: !!intake.safety });
  } catch (e) { return failure(e); }
}
export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    const s = await access(req.headers);
    await revokeIntake(s.user.id);
    return reply({ ok: true, deleted: true });
  } catch (e) { return failure(e); }
}
