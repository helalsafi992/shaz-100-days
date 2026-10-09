import {headers} from 'next/headers';
import {admin} from '@/lib/auth';
import {redirect} from 'next/navigation';
import Gate from '@/components/Gate';
import CoachPlanReviews from '@/components/CoachPlanReviews';
export const dynamic='force-dynamic';
export default async function Page(){
 try{await admin(await headers(),true);}catch(e){const status=(e as {status?:number}).status;if(status===401)redirect('/login?returnTo=/admin/plans');if(status===428)redirect('/admin/security');return <Gate message="Coachadgang kræves for at gennemgå og frigive planer."/>;}
 return <CoachPlanReviews/>;
}
