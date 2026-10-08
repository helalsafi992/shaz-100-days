import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import { db, schema } from "./db";
import { HttpError } from "./errors";
export { HttpError } from "./errors";
export const baseURL = () => process.env.APP_URL || "http://localhost:3100";
export const hash = (v: string) => createHash("sha256").update(v).digest("hex");
export const opaque = () => randomBytes(32).toString("base64url");
export function sameOrigin(req: Request) {
  if (req.headers.get("origin") !== new URL(baseURL()).origin)
    throw new HttpError(
      403,
      "Forespørgslen blev afvist. Genindlæs siden og prøv igen.",
    );
}
export async function rate(key: string, max = 8, minutes = 15) {
  await schema();
  const result = await db().query(
    `INSERT INTO shaz_rate(key,count,expires) VALUES($1,1,now()+($2*interval '1 minute')) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN shaz_rate.expires<now() THEN 1 ELSE shaz_rate.count+1 END,expires=CASE WHEN shaz_rate.expires<now() THEN excluded.expires ELSE shaz_rate.expires END RETURNING count`,
    [hash(key), minutes],
  );
  if (result.rows[0].count > max)
    throw new HttpError(429, "For mange forsøg. Prøv igen om lidt.");
}
function encryptionKey() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET_REQUIRED");
  return Buffer.from(hash(secret), "hex");
}
export function seal(value: string) {
  const iv = randomBytes(12);
  const key = encryptionKey();
  const c = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([c.update(value, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString("base64");
}
export function unseal(value: string) {
  const b = Buffer.from(value, "base64");
  const c = createDecipheriv("aes-256-gcm", encryptionKey(), b.subarray(0, 12));
  c.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([c.update(b.subarray(28)), c.final()]).toString("utf8");
}
export async function body(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 100000)
    throw new HttpError(413, "Indholdet er for stort.");
  const txt = await req.text();
  if (txt.length > 100000) throw new HttpError(413, "Indholdet er for stort.");
  try {
    return JSON.parse(txt);
  } catch {
    throw new HttpError(400, "Ugyldigt input.");
  }
}
export function failure(e: unknown) {
  if (e instanceof Error && e.message === "MEAL_BATCH_LOCKED")
    return Response.json(
      {
        error:
          "En fremtidig madlavning har sammenkædede rester. Opløs sammenkædningen på Mad før du ændrer den samlede plan; allerede spist mad ændres ikke.",
      },
      { status: 409 },
    );
  if (e instanceof Error && e.message === "MISSING_EXERCISE_VARIANT")
    return Response.json(
      {
        error:
          "Der findes ingen egnet øvelse til en af programmets bevægelsesfunktioner med dit udstyr og dine fravalg. Gennemgå frivillige fravalg eller vælg andet udstyr. Begrænsninger tilsidesættes ikke automatisk.",
      },
      { status: 400 },
    );
  if (e instanceof HttpError)
    return Response.json({ error: e.message }, { status: e.status });
  if (e && typeof e === "object" && "issues" in e)
    return Response.json(
      {
        error:
          (e.issues as { code?: string; message?: string }[])
            .filter((i) => i.code === "custom")
            .map((i) => i.message)
            .slice(0, 3)
            .join(" ") || "Kontrollér de indtastede oplysninger.",
      },
      { status: 400 },
    );
  console.error(
    JSON.stringify({
      event: "request_failed",
      code: e instanceof Error ? e.name : "UNKNOWN",
    }),
  );
  return Response.json(
    {
      error:
        "Det kunne ikke gemmes lige nu. Dine indtastninger er bevaret. Prøv igen.",
    },
    { status: 503 },
  );
}
