import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { Profile } from '../profile';
import { db,schema } from '../db';
import { HttpError,unseal } from '../security';
import { intakeDraftSchema,fullIntake } from './intake-draft';
import { screenIntake } from './intake';
/** Same existing conservative policy at activation, preview and confirmation. Not clinical clearance. */
export async function planSafety(user:string,proposed:Profile,existing?:Profile,client?:PoolClient):Promise<string>{
 if(!client)await schema();
 const r=await(client||db()).query('SELECT encrypted_answers FROM shaz_ai_intake WHERE user_id=$1',[user]);
 const required=!!(existing?.personalizationVersion||proposed.personalizationVersion||r.rowCount);
 if(!required)return 'legacy-no-intake';
 if(!r.rows[0])throw new HttpError(409,'Dine helbredssvar mangler. Gennemgå Dine hensyn før du ændrer planen.');
 const draft=intakeDraftSchema.parse(JSON.parse(unseal(r.rows[0].encrypted_answers)));
 if(!draft.safety)throw new HttpError(409,'Besvar Dine hensyn før du starter eller ændrer planen.');
 const decision=screenIntake(fullIntake(proposed,draft));
 if(!decision.automaticPlanAllowed)throw new HttpError(409,decision.status==='stop'?'Planen ændres ikke. Ved alvorlige akutte symptomer skal du søge akut hjælp.':'Dine svar kræver en faglig vurdering før vi kan lave en ny automatisk plan. Din historik er bevaret.');
 return createHash('sha256').update(JSON.stringify(draft)).digest('hex');
}
export async function assertSamePlanSafety(user:string,p:Profile,old:Profile,fingerprint:string,client:PoolClient){if(await planSafety(user,p,old,client)!==fingerprint)throw new HttpError(409,'Dine hensyn er ændret siden forhåndsvisningen. Se et nyt forslag før du bekræfter.');}
