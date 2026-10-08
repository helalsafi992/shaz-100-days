import { auth } from "@/lib/auth";
import { sameOrigin, failure } from "@/lib/security";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    if (!new URL(req.url).pathname.endsWith("/sign-out"))
      return new Response("Not found", { status: 404 });
    return auth().handler(req);
  } catch (e) {
    return failure(e);
  }
}
export function GET() {
  return new Response("Not found", { status: 404 });
}
