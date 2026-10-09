import { access } from '@/lib/auth';
import { db } from '@/lib/db';
import { body,sameOrigin,failure,unseal } from '@/lib/security';
import { questions,intakeVersion } from '@/lib/ai/intake';
import { aiConfiguration,personalize } from '@/lib/ai/service';
import { z } from 'zod';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=120;
const reply=(v:unknown)=>Response.json(v,{headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:Request){try{const s=await access(req.headers);const r=await db().query(`SELECT encrypted_result FROM shaz_ai_proposals WHERE user_id=$1 AND status='ready' AND expires_at>now() ORDER BY created_at DESC LIMIT 1`,[s.user.id]);return reply({version:intakeVersion,questions,configuration:aiConfiguration(),latestProposal:r.rowCount?JSON.parse(unseal(r.rows[0].encrypted_result)):null});}catch(e){return failure(e);}}
export async function POST(req:Request){try{sameOrigin(req);const s=await access(req.headers);const input=z.object({intake:z.unknown(),expectedProfileVersion:z.number().int().positive()}).strict().parse(await body(req));return reply(await personalize(s.user.id,input.intake,input.expectedProfileVersion));}catch(e){return failure(e);}}
export async function DELETE(req:Request){try{sameOrigin(req);const s=await access(req.headers);await db().query('DELETE FROM shaz_ai_proposals WHERE user_id=$1',[s.user.id]);return reply({deleted:true});}catch(e){return failure(e);}}
