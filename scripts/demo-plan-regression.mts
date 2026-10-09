import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {spawn,type ChildProcess} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {browserPath} from './browser.mts';

// Only an ephemeral local database, synthetic users and a deterministic model fixture.
const env={...process.env,DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:5448/postgres',APP_ENV:'test',APP_URL:'http://localhost:3108',STRIPE_MODE:'test',MAIL_TRANSPORT:'test',BETTER_AUTH_SECRET:randomBytes(32).toString('hex'),SALES_ENABLED:'false',AI_PERSONALIZATION_ENABLED:'false',AI_PLAN_ENABLED:'true',AI_PRIVACY_APPROVED:'true',AI_CONTENT_APPROVED:'true',AI_QUESTIONS_APPROVED:'true',OPENAI_API_KEY:'fixture-not-used-for-network',OPENAI_MODEL:'fixture',PLAN_DELIVERY_MODE:'direct-preview'};
delete env.RAILWAY_PROJECT_ID;delete process.env.RAILWAY_PROJECT_ID;Object.assign(process.env,env);
const pg=await PGlite.create();const socket=new PGLiteSocketServer({db:pg,port:5448,host:'127.0.0.1',maxConnections:20});await socket.start();
const{schema,db}=await import('../lib/db');await schema();
const{auth}=await import('../lib/auth');
const{defaults,localDate}=await import('../lib/profile');
const{profile,saveProfile}=await import('../lib/platform');
const{newAnswers,asDraft}=await import('../components/PersonalizationSteps');
const{revokeIntake}=await import('../lib/ai/intake-store');
const{createGeneratedPlan,latestGenerated,applyGeneratedPlan}=await import('../lib/ai/generated-plan-store');
const{fixturePlan}=await import('./generated-plan-fixture.mts');
const today=localDate(),results:{name:string;status:string}[]=[];
async function check(name:string,fn:()=>Promise<void>){try{await fn();results.push({name,status:'passed'});console.log('PASS '+name);}catch(e){results.push({name,status:'failed'});throw e;}}
async function customer(prefix:string){
 const email=prefix+'@example.invalid',password=randomBytes(24).toString('base64url');
 const signed=await auth().api.signUpEmail({body:{name:'Fiktiv demokunde',email,password}}),id=signed.user.id;
 await db().query('UPDATE shaz_user SET "emailVerified"=true WHERE id=$1',[id]);
 await db().query("INSERT INTO shaz_orders(id,checkout_id,email,user_id,amount,currency,livemode,status,product,terms_version,paid_at) VALUES($1,$2,$3,$4,39900,'dkk',false,'paid','fixture','test',now())",[randomUUID(),randomUUID(),email,id]);
 const login=await auth().api.signInEmail({body:{email,password},headers:new Headers({origin:env.APP_URL}),asResponse:true});assert.equal(login.status,200);
 return{id,cookie:login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')};
}
const generator=async(c:Parameters<typeof fixturePlan>[0])=>({plan:fixturePlan(c),model:'fixture',usage:{input:1,output:1}});
let server:ChildProcess|undefined,browser:import('playwright-core').Browser|undefined;
try{
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3108','-H','0.0.0.0'],{env:{...env,NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});
 let logs='';server.stdout?.on('data',b=>{logs+=String(b);});server.stderr?.on('data',b=>{logs+=String(b);});
 for(let i=0;i<100;i++){try{if((await fetch(env.APP_URL+'/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));if(i===99)throw Error('Local test app failed to start: '+logs.slice(-500));}
 const{chromium}=await import('playwright-core');browser=await chromium.launch({executablePath:await browserPath(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote']});await mkdir('test-artifacts',{recursive:true});
 for(const width of [390,1440])await check(`Demo ${width}px: generate → visible full plan → use immediately, with no provider field or coach approval`,async()=>{
  const user=await customer('demo-'+width),context=await browser!.newContext({viewport:{width,height:width===1440?1000:844}});
  try{
   await context.addCookies(user.cookie.split('; ').map(c=>{const i=c.indexOf('=');return{name:c.slice(0,i),value:c.slice(i+1),url:env.APP_URL};}));
   const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let generatedId='',calls=0;
   // Browser exercises the same production store/compiler; only external generation is replaced.
   await page.route('**/api/ai/plan',async route=>{
    if(route.request().method()!=='POST')return route.continue();
    const input=route.request().postDataJSON();if(input.action!=='generate')return route.continue();
    try{const data=await createGeneratedPlan(user.id,input.profile,input.answers,input.expectedVersion,{sources:[],generator:async c=>{calls++;return generator(c);}});generatedId=data.id;await route.fulfill({json:data});}
    catch(e){await route.fulfill({status:500,json:{error:e instanceof Error?e.message:'Fixture generation failed'}});}
   });
   await page.goto(env.APP_URL+'/onboarding',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'18–39 år',exact:true}).click();await page.getByRole('button',{name:'Helt ny',exact:true}).click();
   await page.getByLabel('Jeg er mindst 18 år.',{exact:true}).check();await page.getByLabel(/Jeg accepterer, at SHAZ og/).check();
   await page.getByRole('button',{name:/Gem og fortsæt/}).click();await page.getByRole('heading',{name:'Din uge',exact:true}).waitFor();
   await page.getByRole('button',{name:/Gem og fortsæt/}).click();await page.getByRole('heading',{name:'Skader',exact:true}).waitFor();
   await page.getByRole('button',{name:'Nej',exact:true}).click();await page.getByRole('button',{name:/Gem og fortsæt/}).click();
   await page.getByRole('heading',{name:'Din mad',exact:true}).waitFor();await page.getByRole('button',{name:/Gem og fortsæt/}).click();
   await page.getByRole('heading',{name:'Din plan',exact:true}).waitFor();await page.getByLabel(/Jeg vælger .* som dag 1/).check();
   const button=page.getByRole('button',{name:'Lav min trænings- og madplan',exact:true});await button.waitFor();
   await page.waitForFunction(()=>{const b=Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(x=>x.textContent==='Lav min trænings- og madplan');return b&&!b.disabled;});
   assert.doesNotMatch(await page.locator('main.onboarding').innerText(),/OpenAI|AI-forslag|Send til godkendelse|Afventer Shaz|Shaz gennemgår/i);
   await page.screenshot({path:`test-artifacts/demo-before-generate-${width}.png`,fullPage:true});
   await button.click();await page.getByRole('heading',{name:'Dit samlede forslag',exact:true}).waitFor();
   assert.equal(calls,1);assert.ok(generatedId);assert.equal((await db().query('SELECT count(*)::int n FROM shaz_days WHERE user_id=$1',[user.id])).rows[0].n,0,'Preview must not auto-activate');
   const pending=await latestGenerated(user.id);assert.equal(pending.status,'ready');assert.ok(pending.result&&'sessions' in pending.result);assert.ok(!('model' in pending.result!));assert.ok(!('generatedBy' in pending.result!));
   assert.ok(await page.locator('.generated-result .p-card').count()>0);assert.ok(await page.getByText(/Madplan · 7 dages rotation/).isVisible());
   assert.doesNotMatch(await page.locator('main.onboarding').innerText(),/OpenAI|Send til godkendelse|Afventer Shaz/i);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:`test-artifacts/demo-full-plan-${width}.png`,fullPage:true});
   await page.getByRole('button',{name:'Brug denne trænings- og madplan',exact:true}).click();await page.waitForURL('**/app');
   assert.equal((await profile(user.id)).data.aiPlanId,generatedId);assert.equal((await db().query('SELECT count(*)::int n FROM shaz_days WHERE user_id=$1',[user.id])).rows[0].n,100);assert.equal((await db().query('SELECT count(*)::int n FROM shaz_meal_days WHERE user_id=$1',[user.id])).rows[0].n,100);
   const record=(await db().query('SELECT status,reviewed_by,reviewed_at FROM shaz_generated_plans WHERE id=$1',[generatedId])).rows[0];assert.equal(record.status,'committed');assert.equal(record.reviewed_by,null);assert.equal(record.reviewed_at,null);
   assert.equal((await db().query("SELECT count(*)::int n FROM shaz_audit WHERE target=$1 AND action='demo_plan_activated'",[generatedId])).rows[0].n,1);
   assert.equal((await applyGeneratedPlan(user.id,generatedId)).alreadyApplied,true);
   // Same swap feature remains usable before the workout date; no future performance is invented.
   await page.goto(env.APP_URL+'/app/training?week=2',{waitUntil:'networkidle'});await page.locator('.s-activity-wrap .s-activity').first().click();
   const swap=page.getByRole('button',{name:'Skift øvelse',exact:true});assert.ok(await swap.isEnabled());await swap.click();
   const options=page.locator('.exercise-option');assert.ok(await options.count()>0&&await options.count()<=3);await page.screenshot({path:`test-artifacts/demo-exercise-options-${width}.png`,fullPage:true});
   const response=page.waitForResponse(r=>r.url().includes('/api/platform/swap-exercise')&&r.request().method()==='POST');await options.first().click();assert.equal((await response).status(),200);
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });
 await check('Demo still requires consent, correct ownership and unchanged input; no fabricated coach approval',async()=>{
  const user=await customer('demo-guards'),other=await customer('demo-other'),p={...defaults,startDate:today};await saveProfile(user.id,p,7);const old=await profile(user.id);
  const a={...newAnswers(p),adult:true,processingConsent:true,aiConsent:true,planConsent:true};const answers=asDraft(a,true);
  await assert.rejects(()=>createGeneratedPlan(user.id,old.data,{...answers,aiConsent:false},old.version,{sources:[],generator}),/samtykke/);
  const preview=await createGeneratedPlan(user.id,old.data,answers,old.version,{sources:[],generator});assert.ok('sessions' in preview);
  await assert.rejects(()=>applyGeneratedPlan(other.id,preview.id),/findes ikke/);
  const previous=process.env.PLAN_DELIVERY_MODE;process.env.PLAN_DELIVERY_MODE='coach-review';try{await assert.rejects(()=>applyGeneratedPlan(user.id,preview.id),/afventer godkendelse/);}finally{process.env.PLAN_DELIVERY_MODE=previous;}
  await revokeIntake(user.id);await assert.rejects(()=>applyGeneratedPlan(user.id,preview.id),/findes ikke/);
 });
 console.log('ALL DIRECT DEMO PLAN CHECKS PASSED');
}finally{
 await mkdir('test-artifacts',{recursive:true});await writeFile('test-artifacts/demo-plan-results.json',JSON.stringify({commit:process.env.GITHUB_SHA,externalGeneration:'deterministic fixture; no external provider calls',results},null,2));
 await browser?.close();server?.kill('SIGTERM');await db().end();await socket.stop();await pg.close();
}
