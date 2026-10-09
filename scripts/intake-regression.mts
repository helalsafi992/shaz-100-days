import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {spawn,type ChildProcess} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {browserPath} from './browser.mts';
const env={...process.env,DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:5446/postgres',APP_ENV:'test',APP_URL:'http://localhost:3106',STRIPE_MODE:'test',MAIL_TRANSPORT:'test',BETTER_AUTH_SECRET:randomBytes(32).toString('hex'),SALES_ENABLED:'false',AI_PERSONALIZATION_ENABLED:'false'};Object.assign(process.env,env);
const pg=await PGlite.create(),socket=new PGLiteSocketServer({db:pg,port:5446,host:'127.0.0.1',maxConnections:20});await socket.start();
const{schema,db}=await import('../lib/db');await schema();const{auth}=await import('../lib/auth');const{defaults,localDate}=await import('../lib/profile');const{saveProfile,activate,profile}=await import('../lib/platform');const{storeIntake,storedIntake,revokeIntake}=await import('../lib/ai/intake-store');const{intakeVersion}=await import('../lib/ai/intake');const{trainingChange}=await import('../lib/training-change');const{newAnswers,asDraft}=await import('../components/PersonalizationSteps');const{POST:planPost}=await import('../app/api/plan/[...path]/route');
const today=localDate(),results:{name:string;status:string}[]=[];async function check(name:string,fn:()=>Promise<void>){await fn();results.push({name,status:'passed'});console.log('PASS '+name);}
async function customer(prefix:string){const email=prefix+'@example.invalid',password=randomBytes(24).toString('base64url');const signed=await auth().api.signUpEmail({body:{name:'Fiktiv 18-årig',email,password}}),id=signed.user.id;await db().query('UPDATE shaz_user SET "emailVerified"=true WHERE id=$1',[id]);await db().query("INSERT INTO shaz_orders(id,checkout_id,email,user_id,amount,currency,livemode,status,product,terms_version,paid_at) VALUES($1,$2,$3,$4,39900,'dkk',false,'paid','test-fixture','test',now())",[randomUUID(),randomUUID(),email,id]);const login=await auth().api.signInEmail({body:{email,password},headers:new Headers({origin:env.APP_URL}),asResponse:true});assert.equal(login.status,200);const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');return{id,email,password,cookie};}
let browser:import('playwright-core').Browser|undefined,server:ChildProcess|undefined;
try{
 const active=await customer('clear-active'),p={...defaults,startDate:today,personalizationVersion:intakeVersion};const a=newAnswers(p);a.adult=true;a.processingConsent=true;a.wishes.ageBand='18-39';const draft=asDraft(a,true);await storeIntake(active.id,draft);await saveProfile(active.id,p,7);await activate(active.id);await db().query('UPDATE shaz_profile SET version=9 WHERE user_id=$1',[active.id]);
 await check('Common safety guard blocks unsafe changes, direct API and omitted client flag',async()=>{const old=await profile(active.id),before=JSON.stringify((await db().query('SELECT plan FROM shaz_days WHERE user_id=$1 ORDER BY day',[active.id])).rows);await storeIntake(active.id,{...draft,safety:{...draft.safety!,medicalExerciseRestriction:'yes'}});await assert.rejects(()=>trainingChange(active.id,{data:old.data}),/faglig vurdering/);const bypass={...old.data};delete bypass.personalizationVersion;const r=await planPost(new Request(env.APP_URL+'/api/plan/training-preview',{method:'POST',headers:{origin:env.APP_URL,cookie:active.cookie,'Content-Type':'application/json'},body:JSON.stringify({data:bypass})}),{params:Promise.resolve({path:['training-preview']})});assert.equal(r.status,409);assert.equal(JSON.stringify((await db().query('SELECT plan FROM shaz_days WHERE user_id=$1 ORDER BY day',[active.id])).rows),before);await storeIntake(active.id,draft);});
 await check('Changing intake invalidates old preview; identical save preserves a valid confirmation',async()=>{const old=await profile(active.id),preview=await trainingChange(active.id,{data:old.data});const altered={...draft,wishes:{...draft.wishes,sleep:'6-8'as const}};await storeIntake(active.id,altered);await assert.rejects(()=>trainingChange(active.id,{data:old.data,expectedVersion:preview.version,fingerprint:preview.fingerprint},true),/ændret/);const next=await trainingChange(active.id,{data:old.data});await storeIntake(active.id,altered);assert.ok(await trainingChange(active.id,{data:old.data,expectedVersion:next.version,fingerprint:next.fingerprint},true));await storeIntake(active.id,draft);});
 await check('Saving goals preserves safety answers',async()=>{const{safety,...goals}=draft;await storeIntake(active.id,goals);assert.deepEqual((await storedIntake(active.id))?.safety,safety);});
 await check('No downgrade to legacy safety exemption after consent withdrawal',async()=>{const old=await profile(active.id),incoming={...old.data};delete incoming.personalizationVersion;const preview=await trainingChange(active.id,{data:incoming});await trainingChange(active.id,{data:incoming,expectedVersion:preview.version,fingerprint:preview.fingerprint},true);assert.equal((await profile(active.id)).data.personalizationVersion,intakeVersion);await revokeIntake(active.id);await assert.rejects(()=>trainingChange(active.id,{data:incoming}),/helbredssvar mangler/);await storeIntake(active.id,draft);});
 await check('Program activation uses the same safety guard',async()=>{const other=await customer('clear-blocked');await storeIntake(other.id,{...draft,safety:{...draft.safety!,urgentSymptoms:'yes'}});await saveProfile(other.id,p,7);await assert.rejects(()=>activate(other.id),/akut/);assert.equal((await db().query('SELECT count(*)::int n FROM shaz_days WHERE user_id=$1',[other.id])).rows[0].n,0);});
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3106','-H','0.0.0.0'],{env:{...env,NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});let logs='';server.stdout?.on('data',b=>{logs+=String(b);});server.stderr?.on('data',b=>{logs+=String(b);});for(let i=0;i<100;i++){try{if((await fetch(env.APP_URL+'/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));if(i===99)throw Error('Next start failed: '+logs.slice(-600));}
 const{chromium}=await import('playwright-core');browser=await chromium.launch({executablePath:await browserPath(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote']});await mkdir('test-artifacts',{recursive:true});
 await check('Password login restores deep link and uses real profile version greater than one',async()=>{const context=await browser!.newContext({viewport:{width:390,height:844}}),page=await context.newPage();await page.goto(env.APP_URL+'/onboarding?edit=1');assert.match(page.url(),/returnTo=/);await page.getByLabel('E-mail',{exact:true}).fill(active.email);await page.getByLabel('Adgangskode',{exact:true}).fill(active.password);await page.getByRole('button',{name:'Log ind',exact:true}).click();await page.waitForURL('**/onboarding?edit=1');assert.equal(await page.locator('main.onboarding').getAttribute('data-profile-version'),String((await profile(active.id)).version));await context.close();});
 await check('Transient Safari Load failed retries without showing a raw error or losing the saved intake',async()=>{
  const context=await browser!.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try{
   const cookies=active.cookie.split('; ').map(c=>{const at=c.indexOf('=');return{name:c.slice(0,at),value:c.slice(at+1),url:env.APP_URL};});
   await context.addCookies(cookies);
   const page=await context.newPage();let requests=0;
   await page.route('**/api/ai/intake',route=>{
     if(route.request().method()!=='GET')return route.continue();
     requests++;
     if(requests<=2)return route.abort('internetdisconnected');
     return route.continue();
   });
   await page.goto(env.APP_URL+'/onboarding?edit=1',{waitUntil:'domcontentloaded'});
   await page.locator('main.onboarding[data-intake-loaded="true"]').waitFor({timeout:20000});
   assert.equal(requests,3,'Initial two network failures should be retried automatically');
   assert.equal(await page.getByText('Load failed',{exact:true}).count(),0);
   assert.equal(await page.locator('.onboard-loading').count(),0);
   assert.ok(await page.getByRole('heading',{name:'Tilpas din plan',exact:true}).isVisible());
  }finally{await context.close();}
 });
 await check('Permanent iPhone network failure offers Try again, then resumes without resetting the active plan',async()=>{
  const context=await browser!.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try{
   const cookies=active.cookie.split('; ').map(c=>{const at=c.indexOf('=');return{name:c.slice(0,at),value:c.slice(at+1),url:env.APP_URL};});
   await context.addCookies(cookies);
   const page=await context.newPage();let attempts=0;
   await page.route('**/api/ai/intake',route=>{
     if(route.request().method()!=='GET')return route.continue();
     attempts++;
     if(attempts<=3)return route.abort('internetdisconnected');
     return route.continue();
   });
   await page.goto(env.APP_URL+'/onboarding?edit=1',{waitUntil:'domcontentloaded'});
   const retry=page.getByRole('button',{name:'Prøv igen',exact:true});
   await retry.waitFor({timeout:20000});
   assert.equal(await page.locator('main.onboarding').getAttribute('data-intake-loaded'),'false');
   assert.equal(await page.getByRole('button',{name:'Gem og fortsæt →'}).count(),0,'Cannot edit before saved answers have loaded');
   assert.match(await page.locator('.onboard-loading').innerText(),/Kunne ikke hente dine gemte svar/);
   assert.equal(await page.getByText('Load failed',{exact:true}).count(),0);
   await retry.click();
   await page.locator('main.onboarding[data-intake-loaded="true"]').waitFor({timeout:20000});
   assert.equal(attempts,4);
   assert.equal((await profile(active.id)).start_date,today,'Loading a draft must never alter an active plan');
  }finally{await context.close();}
 });
 await check('Tilpas plan is always in the mobile topbar and desktop sidebar, and edit mode is clearly labeled',async()=>{
  for(const width of [320,390,1440]){
   const context=await browser!.newContext({viewport:{width,height:width===1440?900:844}});
   try{
    const cookies=active.cookie.split('; ').map(c=>{const at=c.indexOf('=');return{name:c.slice(0,at),value:c.slice(at+1),url:env.APP_URL};});
    await context.addCookies(cookies);
    const page=await context.newPage();
    await page.goto(env.APP_URL+'/app',{waitUntil:'networkidle'});
    const editLink=width===1440?page.locator('.s-sidebar .s-edit-plan'):page.locator('.s-mobile-header .s-edit-plan');
    await editLink.waitFor({state:'visible'});
    assert.match(await editLink.innerText(),/Tilpas plan/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await editLink.click();
    await page.waitForURL('**/onboarding?edit=1');
    assert.ok(await page.getByRole('heading',{name:'Tilpas din plan',exact:true}).isVisible());
    assert.ok(await page.locator('.onboard-header-title').isVisible());
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   }finally{await context.close();}
  }
 });
 await check('Canonical unit switching and no overflow at 320,390,1440px',async()=>{for(const width of [320,390,1440]){const context=await browser!.newContext({viewport:{width,height:width===1440?1000:844}});await context.addCookies(active.cookie.split('; ').map(c=>{const at=c.indexOf('=');return{name:c.slice(0,at),value:c.slice(at+1),url:env.APP_URL};}));const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(env.APP_URL+'/onboarding?edit=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Vægt',exact:true}).click();await page.getByLabel('Din vægt nu (kg)',{exact:true}).fill('80');await page.getByLabel('Din ønskede vægt (kg)',{exact:true}).fill('72,5');await page.getByLabel('Enhed for dit mål',{exact:true}).selectOption('lbs');assert.match(await page.getByLabel('Din vægt nu (lbs)',{exact:true}).inputValue(),/^176/);await page.getByLabel('Enhed for dit mål',{exact:true}).selectOption('kg');assert.equal(await page.getByLabel('Din ønskede vægt (kg)',{exact:true}).inputValue(),'72,5');await page.getByRole('button',{name:'Løbedistance',exact:true}).click();await page.getByLabel('Enhed for dit mål',{exact:true}).selectOption('miles');await page.getByLabel('Så langt kan du løbe nu (miles)',{exact:true}).fill('2');await page.getByLabel('Så langt vil du kunne løbe (miles)',{exact:true}).fill('5');await page.getByLabel('Enhed for dit mål',{exact:true}).selectOption('km');assert.match(await page.getByLabel('Så langt vil du kunne løbe (km)',{exact:true}).inputValue(),/^8,05/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await page.screenshot({path:'test-artifacts/clear-goal-'+width+'.png',fullPage:true});await context.close();}});
 await check('Client submits without AI jargon; only MFA-verified coach publishes; three choices and history preserved',async()=>{
  const fresh=await customer('ai-novice'),context=await browser!.newContext({viewport:{width:390,height:844}});
  const {createGeneratedPlan,applyGeneratedPlan,latestGenerated,coachReview,publishReviewedPlan}=await import('../lib/ai/generated-plan-store');
  const {fixturePlan}=await import('./generated-plan-fixture.mts');
  await context.addCookies(fresh.cookie.split('; ').map(c=>{const at=c.indexOf('=');return{name:c.slice(0,at),value:c.slice(at+1),url:env.APP_URL};}));
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let generatorCalls=0;
  await page.route('**/api/ai/plan',async route=>{
   if(route.request().method()==='GET')return route.fulfill({json:{configuration:{enabled:true,reason:null}}});
   const input=route.request().postDataJSON();if(input.action!=='generate')return route.continue();
   try{const data=await createGeneratedPlan(fresh.id,input.profile,input.answers,input.expectedVersion,{sources:[],generator:async(c)=>{generatorCalls++;return{plan:fixturePlan(c),model:'fixture-not-openai',usage:{input:1,output:1}};}});await route.fulfill({json:data});}catch(e){await route.fulfill({status:500,json:{error:String(e)}});}
  });
  await page.goto(env.APP_URL+'/onboarding',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'18–39 år',exact:true}).click();await page.getByRole('button',{name:'Helt ny',exact:true}).click();
  await page.getByLabel('Jeg er mindst 18 år.',{exact:true}).check();await page.getByLabel(/Jeg accepterer, at SHAZ og/).check();
  await page.getByRole('button',{name:/Gem og fortsæt/}).click();await page.getByRole('heading',{name:'Din uge',exact:true}).waitFor();
  await page.getByLabel('Cardiopas om ugen').selectOption('2');const duration=page.getByLabel('Ønsket varighed (min.)');await duration.fill('');assert.equal(await duration.inputValue(),'');await duration.fill('30');await duration.blur();assert.equal(await duration.inputValue(),'30');await page.getByLabel('Cardiopas om ugen').selectOption('0');
  await page.getByRole('button',{name:/Gem og fortsæt/}).click();await page.getByRole('heading',{name:'Skader',exact:true}).waitFor();
  assert.equal(await page.locator('.concise-injury > fieldset').count(),1);assert.equal(await page.getByText('Er der helbredshensyn til din madplan?',{exact:true}).count(),0);assert.equal(await page.getByText('Hvilke restriktioner har du fået?',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Nej',exact:true}).click();await page.screenshot({path:'test-artifacts/ai-short-injury-390.png',fullPage:true});
  await page.getByRole('button',{name:/Gem og fortsæt/}).click();await page.getByRole('heading',{name:'Din mad',exact:true}).waitFor();await page.getByRole('button',{name:'Vegansk',exact:true}).click();
  await page.getByRole('button',{name:/Gem og fortsæt/}).click();await page.getByRole('heading',{name:'Din plan',exact:true}).waitFor();
  await page.getByLabel(/Jeg vælger .* som dag 1/).check();assert.equal(await page.getByText(/OpenAI|AI-forslag/).count(),0);
  await page.getByRole('button',{name:'Send til godkendelse',exact:true}).click();await page.getByRole('heading',{name:'Afventer Shaz’ gennemgang',exact:true}).waitFor();
  assert.equal(generatorCalls,1);assert.equal((await db().query('SELECT count(*)::int n FROM shaz_days WHERE user_id=$1',[fresh.id])).rows[0].n,0);
  await page.screenshot({path:'test-artifacts/client-awaiting-coach-390.png',fullPage:true});
  const pending=await latestGenerated(fresh.id);
  assert.equal(pending.status,'awaiting_review');assert.ok(pending.result);
  assert.ok(!('sessions' in pending.result!),'No unreviewed sessions sent to the client');
  const generatedId=pending.result!.id;
  const deniedActivation=await fetch(env.APP_URL+'/api/platform/activate',{method:'POST',headers:{origin:env.APP_URL,cookie:fresh.cookie,'Content-Type':'application/json'},body:JSON.stringify({confirmStart:true})});
  assert.equal(deniedActivation.status,403);
  const deniedApply=await fetch(env.APP_URL+'/api/ai/plan',{method:'POST',headers:{origin:env.APP_URL,cookie:fresh.cookie,'Content-Type':'application/json'},body:JSON.stringify({action:'apply',id:generatedId})});
  assert.equal(deniedApply.status,403);
  await assert.rejects(()=>applyGeneratedPlan(fresh.id,generatedId),/afventer godkendelse/);
  await assert.rejects(()=>publishReviewedPlan(fresh.id,generatedId,1),/Coachadgang/);
  assert.equal(await page.getByRole('button',{name:'Brug denne trænings- og madplan'}).count(),0);
  const coach=await customer('coach-reviewer');
  await db().query("INSERT INTO shaz_roles(user_id,role) VALUES($1,'owner')",[coach.id]);
  const session=await auth().api.getSession({headers:new Headers({cookie:coach.cookie})});
  // Isolated MFA fixture; no production role, user or session is modified.
  await db().query('UPDATE shaz_user SET "twoFactorEnabled"=true WHERE id=$1',[coach.id]);
  await db().query('INSERT INTO shaz_two_factor(id,secret,"backupCodes","userId",verified) VALUES($1,$2,$3,$4,true)',[randomUUID(),'fixture-secret','fixture-backups',coach.id]);
  await db().query("INSERT INTO shaz_admin_mfa(session_id,user_id,expires_at) VALUES($1,$2,now()+interval '10 minutes')",[session!.session.id,coach.id]);
  const coachContext=await browser!.newContext({viewport:{width:1440,height:1000}});
  await coachContext.addCookies(coach.cookie.split('; ').map(c=>{const at=c.indexOf('=');return{name:c.slice(0,at),value:c.slice(at+1),url:env.APP_URL};}));
  const cp=await coachContext.newPage();await cp.goto(env.APP_URL+'/admin/plans');
  await cp.getByRole('button',{name:'Gennemgå plan',exact:true}).first().click();
  await cp.getByRole('button',{name:'Skift øvelse',exact:true}).first().click();
  assert.ok(await cp.locator('.exercise-option').count()>0);
  await cp.locator('.exercise-option').first().click();
  await cp.getByRole('heading',{name:'Samlet plan · version 2',exact:true}).waitFor();
  await assert.rejects(()=>publishReviewedPlan(coach.id,generatedId,1),/ændret/);
  await cp.screenshot({path:'test-artifacts/coach-review-1440.png',fullPage:true});
  await cp.getByLabel(/Jeg har gennemgået denne version/).check();
  await cp.getByRole('button',{name:'Godkend og send planen',exact:true}).click();
  await cp.getByText('Planen er godkendt og lagt i kundens forløb.',{exact:true}).waitFor();
  assert.equal((await db().query('SELECT reviewed_by FROM shaz_generated_plans WHERE id=$1',[generatedId])).rows[0].reviewed_by,coach.id);
  await coachContext.close();
  await page.goto(env.APP_URL+'/app');
  assert.equal((await profile(fresh.id)).data.diet,'vegan');assert.ok((await profile(fresh.id)).data.aiPlanId);
  assert.equal((await db().query('SELECT count(*)::int n FROM shaz_days WHERE user_id=$1',[fresh.id])).rows[0].n,100);
  assert.equal((await db().query('SELECT count(*)::int n FROM shaz_meal_days WHERE user_id=$1',[fresh.id])).rows[0].n,100);
  const id=(await profile(fresh.id)).data.aiPlanId!;assert.equal((await applyGeneratedPlan(fresh.id,id)).alreadyApplied,true);
  await assert.rejects(()=>applyGeneratedPlan(active.id,id),/findes ikke/);
  const before=await profile(fresh.id),saved=(await storedIntake(fresh.id))!;
  const next=await createGeneratedPlan(fresh.id,before.data,saved,before.version,{sources:[],generator:async c=>({plan:fixturePlan(c),model:'fixture-not-openai',usage:{input:1,output:1}})});
  const day=(await db().query("SELECT id,plan,day FROM shaz_days WHERE user_id=$1 AND plan->>'kind'='workout' ORDER BY day LIMIT 1",[fresh.id])).rows[0];
  await db().query("UPDATE shaz_days SET status='completed',log=$2 WHERE id=$1",[day.id,JSON.stringify({sets:[{exercise:day.plan.exercises[0].id,set:1,reps:10,kg:5,effort:7}]})]);
  const meal=(await db().query('SELECT date::text,data FROM shaz_meal_days WHERE user_id=$1 ORDER BY date LIMIT 1',[fresh.id])).rows[0];meal.data.slots[0].status='eaten';
  await db().query('UPDATE shaz_meal_days SET data=$3 WHERE user_id=$1 AND date=$2',[fresh.id,meal.date,JSON.stringify(meal.data)]);
  await publishReviewedPlan(coach.id,next.id,1);
  assert.equal((await db().query('SELECT status FROM shaz_days WHERE id=$1',[day.id])).rows[0].status,'completed');
  assert.deepEqual((await db().query('SELECT data FROM shaz_meal_days WHERE user_id=$1 AND date=$2',[fresh.id,meal.date])).rows[0].data,meal.data);
  assert.deepEqual(errors,[]);await context.close();
 });
 await check('Cardio editor exposes 0–7 days and accepts 90 minutes without forced clamp on iPhone-size screen',async()=>{
  const context=await browser!.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try{
   await context.addCookies(active.cookie.split('; ').map(c=>{const i=c.indexOf('=');return{name:c.slice(0,i),value:c.slice(i+1),url:env.APP_URL};}));
   const page=await context.newPage();
   await page.goto(env.APP_URL+'/app/training',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Tilpas cardio',exact:true}).click();
   const dialog=page.getByRole('dialog',{name:'Tilpas cardio'});
   const dayChoices=dialog.getByLabel('Cardiopas om ugen');
   assert.deepEqual(await dayChoices.locator('option').allTextContents(),['Ingen ekstra cardio','1','2','3','4','5','6','7']);
   await dayChoices.selectOption('7');
   const minutes=dialog.getByLabel('Ønsket varighed (min.)');
   await minutes.fill('');
   assert.equal(await minutes.inputValue(),'','The duration must be clearable without an unwanted 0');
   await minutes.fill('90');
   assert.equal(await minutes.inputValue(),'90');
   assert.equal(await minutes.evaluate((input:HTMLInputElement)=>input.checkValidity()),true,'Ninety minutes must be allowed');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:'test-artifacts/cardio-unrestricted-390.png',fullPage:true});
  }finally{await context.close();}
 });
 await check('A 90-minute cardio session can move to a strength day even when every day has training',async()=>{
  const {profileSchema,addDays}=await import('../lib/profile');
  const {syncCardio,cardioRows,editCardio}=await import('../lib/cardio-store');
  const old=await profile(active.id);
  const cfg=profileSchema.parse({...old.data,startDate:old.start_date,cardio:{
    days:6,weekdays:[0,2,3,4,5,6],minutes:90,forms:['cycle'],equipment:['bike'],
    level:'beginner',intensity:'moderate'
  }});
  await syncCardio(active.id,cfg,today);
  const futureMonday=(await db().query(
    "SELECT scheduled_date::text AS date FROM shaz_days WHERE user_id=$1 AND plan->>'kind'='workout' AND scheduled_date>=$2 ORDER BY scheduled_date",
    [active.id,addDays(today,7)]
  )).rows.find((x:{date:string})=>new Date(x.date+'T12:00:00Z').getUTCDay()===1)?.date;
  assert.ok(futureMonday,'Expected a future Monday strength session');
  const original=await cardioRows(active.id);
  const source=original.find(r=>r.scheduled_date>futureMonday && new Date(r.scheduled_date+'T12:00:00Z').getUTCDay()===3 && r.status==='planned');
  assert.ok(source,'Expected a future Wednesday cardio session');
  assert.equal(source.plan.selected.minutes,90);
  const originalDates=new Set(original.filter(x=>x.status==='planned').map(x=>x.scheduled_date));
  assert.ok(!originalDates.has(futureMonday),'Destination must have strength but no competing cardio');
  await editCardio(active.id,{id:source.id,action:'move',date:futureMonday});
  const moved=(await cardioRows(active.id)).find(r=>r.id===source.id);
  assert.equal(moved?.scheduled_date,futureMonday);
  assert.equal(moved?.plan.selected.minutes,90);
  // A real recorded row remains, and the weekly calendar can have seven active dates.
  const planDays=(await db().query(
    "SELECT scheduled_date::text AS date FROM shaz_days WHERE user_id=$1 AND plan->>'kind'='workout' AND scheduled_date BETWEEN $2 AND $3",
    [active.id,futureMonday,addDays(futureMonday,6)]
  )).rows.map((r:{date:string})=>r.date);
  const cardioDates=(await cardioRows(active.id)).filter(r=>r.status==='planned' && r.scheduled_date>=futureMonday && r.scheduled_date<=addDays(futureMonday,6)).map(r=>r.scheduled_date);
  const activeDates=new Set([...planDays,...cardioDates]);
  assert.equal(activeDates.size,7,'No compulsory rest-day cap may silently reject or reschedule chosen dates');
 });
 console.log('ALL CLEAR ONBOARDING CHECKS PASSED');
}finally{await mkdir('test-artifacts',{recursive:true});await writeFile('test-artifacts/clear-onboarding-results.json',JSON.stringify({commit:process.env.GITHUB_SHA||'local',results},null,2));await browser?.close();server?.kill('SIGTERM');await db().end();await socket.stop();await pg.close();}
