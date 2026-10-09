import {z} from 'zod';
import {admin} from '@/lib/auth';
import {sameOrigin,body,failure} from '@/lib/security';
import {reviewQueue,coachReview,coachSwap,publishReviewedPlan} from '@/lib/ai/generated-plan-store';
export const dynamic='force-dynamic';
const reply=(v:unknown)=>Response.json(v,{headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:Request){try{const s=await admin(req.headers,true),id=new URL(req.url).searchParams.get('id');return reply(id?await coachReview(s.user.id,z.string().uuid().parse(id)):{queue:await reviewQueue(s.user.id)});}catch(e){return failure(e);}}
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('publish'),id:z.string().uuid(),revision:z.number().int().positive(),confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('swap'),id:z.string().uuid(),revision:z.number().int().positive(),weekday:z.number().int().min(0).max(6),exercise:z.string().max(100),replacement:z.string().max(100)}).strict(),
]);
export async function POST(req:Request){try{sameOrigin(req);const s=await admin(req.headers,true),v=input.parse(await body(req));return reply(v.action==='publish'?await publishReviewedPlan(s.user.id,v.id,v.revision):await coachSwap(s.user.id,v.id,v.revision,v.weekday,v.exercise,v.replacement));}catch(e){return failure(e);}}
