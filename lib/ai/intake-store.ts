import { db,schema,transaction } from '../db';
import { seal,unseal } from '../security';
import { intakeDraftSchema,type IntakeDraft } from './intake-draft';
export async function storedIntake(user:string):Promise<IntakeDraft|null>{await schema();const r=await db().query('SELECT encrypted_answers FROM shaz_ai_intake WHERE user_id=$1',[user]);return r.rows[0]?intakeDraftSchema.parse(JSON.parse(unseal(r.rows[0].encrypted_answers))):null;}
export async function storeIntake(user:string,input:unknown):Promise<IntakeDraft>{
 const parsed=intakeDraftSchema.parse(input);await schema();
 return transaction(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[user]);
  const old=await c.query('SELECT encrypted_answers FROM shaz_ai_intake WHERE user_id=$1 FOR UPDATE',[user]);
  const previous=old.rows[0]?intakeDraftSchema.parse(JSON.parse(unseal(old.rows[0].encrypted_answers))):null;
  // Saving goals must not erase answered safety fields. Identical data must not invalidate a valid preview.
  const data=intakeDraftSchema.parse({...parsed,...(!parsed.safety&&previous?.safety?{safety:previous.safety}:{})});
  if(previous&&JSON.stringify(previous)===JSON.stringify(data))return data;
  await c.query(`INSERT INTO shaz_ai_intake(user_id,encrypted_answers,schema_version) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET encrypted_answers=excluded.encrypted_answers,schema_version=excluded.schema_version,updated_at=now()`,[user,seal(JSON.stringify(data)),data.version]);
  await c.query('DELETE FROM shaz_ai_proposals WHERE user_id=$1',[user]);return data;
 });
}
export async function revokeIntake(user:string){await schema();await transaction(async c=>{await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[user]);await c.query('DELETE FROM shaz_ai_proposals WHERE user_id=$1',[user]);await c.query('DELETE FROM shaz_ai_intake WHERE user_id=$1',[user]);});}
