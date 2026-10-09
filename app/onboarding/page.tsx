import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { access } from "@/lib/auth";
import { profile } from "@/lib/platform";
import { HttpError } from "@/lib/security";
import Onboarding from "@/components/Onboarding";
import Gate from "@/components/Gate";
export const dynamic="force-dynamic";
export const metadata={title:"Din plan · SHAZ",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{edit?:string}>}){
 let user;try{user=await access(await headers());}catch(e){if(e instanceof HttpError&&e.status===401)redirect('/login?returnTo='+encodeURIComponent('/onboarding'+((await searchParams).edit==='1'?'?edit=1':'')));return <Gate message={e instanceof HttpError?e.message:'Kundeområdet er ved at blive gjort klar.'}/>;}
 const p=await profile(user.user.id),editing=(await searchParams).edit==='1';if(p.start_date&&!editing)redirect('/app');
 return <Onboarding initial={JSON.parse(JSON.stringify(p.data))} initialStep={editing?0:p.step} initialVersion={p.version} editing={editing}/>;
}
