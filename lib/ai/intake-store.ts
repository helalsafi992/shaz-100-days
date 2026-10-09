import { db, schema } from "../db";
import { seal, unseal } from "../security";
import { intakeDraftSchema, type IntakeDraft } from "./intake-draft";

export async function storedIntake(user: string): Promise<IntakeDraft | null> {
  await schema();
  const r = await db().query("SELECT encrypted_answers FROM shaz_ai_intake WHERE user_id=$1", [user]);
  if (!r.rows[0]) return null;
  // Never return a failed schema parse as a safe default.
  return intakeDraftSchema.parse(JSON.parse(unseal(r.rows[0].encrypted_answers)));
}
export async function storeIntake(user: string, input: unknown): Promise<IntakeDraft> {
  const data = intakeDraftSchema.parse(input);
  await schema();
  await db().query(
    `INSERT INTO shaz_ai_intake(user_id, encrypted_answers, schema_version)
       VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE
       SET encrypted_answers=excluded.encrypted_answers,
           schema_version=excluded.schema_version, updated_at=now()`,
    [user, seal(JSON.stringify(data)), data.version],
  );
  // Old model proposals must not be reused after any intake change.
  await db().query("DELETE FROM shaz_ai_proposals WHERE user_id=$1", [user]);
  return data;
}
export async function revokeIntake(user: string) {
  await schema();
  await db().query("DELETE FROM shaz_ai_proposals WHERE user_id=$1", [user]);
  await db().query("DELETE FROM shaz_ai_intake WHERE user_id=$1", [user]);
}
