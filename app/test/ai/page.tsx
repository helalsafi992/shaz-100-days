import {headers} from 'next/headers';
import {notFound,redirect} from 'next/navigation';
import {access} from '@/lib/auth';
import {isolatedTest,requireTestDatabase,testGrant} from '@/lib/test-environment';
import {HttpError} from '@/lib/security';
import AIConnectionProbe from '@/components/AIConnectionProbe';
export const dynamic='force-dynamic';
export const metadata={title:'AI-forbindelsestest · SHAZ',robots:{index:false,follow:false}};
export default async function Page(){
 if(!isolatedTest())notFound();
 await requireTestDatabase();
 let session;try{session=await access(await headers());}catch(e){if(e instanceof HttpError&&e.status===401)redirect('/login');throw e;}
 if(!await testGrant(session.user.id))notFound();
 return <main className="portal p-main"><AIConnectionProbe/></main>;
}
