import {z} from 'zod';
import {access} from '@/lib/auth';
import {body,sameOrigin,failure} from '@/lib/security';
import {latestGenerated,createGeneratedPlan,applyGeneratedPlan} from '@/lib/ai/generated-plan-store';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=120;
const reply=(v:unknown)=>Response.json(v,{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('generate'),profile:z.unknown(),answers:z.unknown(),expectedVersion:z.number().int().positive()}).strict(),
 z.object({action:z.literal('apply'),id:z.string().uuid()}).strict()
]);
export async function GET(req:Request){try{const s=await access(req.headers);return reply(await latestGenerated(s.user.id));}catch(e){return failure(e);}}
export async function POST(req:Request){try{sameOrigin(req);const s=await access(req.headers),v=input.parse(await body(req));return reply(v.action==='generate'?await createGeneratedPlan(s.user.id,v.profile,v.answers,v.expectedVersion):await applyGeneratedPlan(s.user.id,v.id));}catch(e){return failure(e);}}
