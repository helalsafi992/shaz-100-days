import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { browserPath } from "./browser.mts";

const port=3107,dbPort=5447,url="http://localhost:"+port;
const env={...process.env,
 DATABASE_URL:"postgresql://postgres:postgres@127.0.0.1:"+dbPort+"/postgres",
 APP_ENV:"test",AI_REVIEW_MODE:"demo",APP_URL:url,STRIPE_MODE:"test",MAIL_TRANSPORT:"test",
 BETTER_AUTH_SECRET:randomBytes(32).toString("hex"),SALES_ENABLED:"false",
 AI_PLAN_ENABLED:"true",OPENAI_API_KEY:"synthetic-fixture-no-outbound-call",OPENAI_MODEL:"fixture-model",
 AI_PRIVACY_APPROVED:"true",AI_CONTENT_APPROVED:"true",AI_QUESTIONS_APPROVED:"true",
};
Object.assign(process.env,env);
const pg=await PGlite.create();
const socket=new PGLiteSocketServer({db:pg,port:dbPort,host:"127.0.0.1",maxConnections:24});
await socket.start();
const {db,schema}=await import("../lib/db");await schema();
const {auth}=await import("../lib/auth");
const {profile,localDate}=await import("../lib/platform").then(async m=>({...m,localDate:(await import("../lib/profile")).localDate}));
const {createGeneratedPlan,applyGeneratedPlan,latestGenerated,demoDirectDelivery,generatedConfiguration}=await import("../lib/ai/generated-plan-store");
const {fixturePlan}=await import("./generated-plan-fixture.mts");
const today=localDate();
const results:{name:string;status:string}[]=[];
let browser:import("playwright-core").Browser|undefined,server:ChildProcess|undefined;
async function check(name:string,fn:()=>Promise<void>){await fn();results.push({name,status:"passed"});console.log("PASS "+name);}
async function customer(prefix:string){
 const email=prefix+"@example.invalid",password=randomBytes(24).toString("base64url");
 const signed=await auth().api.signUpEmail({body:{name:"Fiktiv demo",email,password}}),id=signed.user.id;
 await db().query('UPDATE shaz_user SET "emailVerified"=true WHERE id=$1',[id]);
 await db().query("INSERT INTO shaz_orders(id,checkout_id,email,user_id,amount,currency,livemode,status,product,terms_version,paid_at) VALUES($1,$2,$3,$4,39900,'dkk',false,'paid','synthetic-demo','test',now())",[randomUUID(),randomUUID(),email,id]);
 const login=await auth().api.signInEmail({body:{email,password},headers:new Headers({origin:url}),asResponse:true});
 assert.equal(login.status,200);
 return {id,email,cookie:login.headers.getSetCookie().map(c=>c.split(";")[0]).join("; ")};
}
try {
 await check("A public environment cannot use demo activation even when the flag is copied",async()=>{
  assert.equal(demoDirectDelivery(),true);
  assert.equal(generatedConfiguration().mode,"generate-and-confirm");
  process.env.APP_ENV="production";
  try{
   assert.equal(demoDirectDelivery(),false);
   assert.equal(generatedConfiguration().mode,"coach-review");
  }finally{process.env.APP_ENV="test";}
 });
 const account=await customer("demo-self-confirm");
 let logs="";
 server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-p",String(port),"-H","0.0.0.0"],{env:{...env,NODE_ENV:"production"},stdio:["ignore","pipe","pipe"]});
 server.stdout?.on("data",b=>{logs+=String(b)});
 server.stderr?.on("data",b=>{logs+=String(b)});
 for(let i=0;i<100;i++){
  try{if((await fetch(url+"/api/health")).ok)break;}catch{}
  if(i===99)throw Error("Next server did not start: "+logs.slice(-1200));
  await new Promise(resolve=>setTimeout(resolve,200));
 }
 const{chromium}=await import("playwright-core");
 browser=await chromium.launch({executablePath:await browserPath(),headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-zygote"]});
 await mkdir("test-artifacts",{recursive:true});
 await check("The customer sees a full program immediately, self-activates and does not enter the coach queue",async()=>{
  const context=await browser!.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const cookiePairs=account.cookie.split("; ").map(c=>{const at=c.indexOf("=");return{name:c.slice(0,at),value:c.slice(at+1),url};});
  await context.addCookies(cookiePairs);
  try {
   const page=await context.newPage(),jsErrors:string[]=[];
   page.on("pageerror",e=>jsErrors.push(e.message));
   let calls=0;
   await page.route("**/api/ai/plan",async route=>{
    if(route.request().method()!=="POST"||route.request().postDataJSON()?.action!=="generate")return route.continue();
    const payload=route.request().postDataJSON();
    try{
     const result=await createGeneratedPlan(account.id,payload.profile,payload.answers,payload.expectedVersion,{
      sources:[],
      generator:async c=>{calls++;return{plan:fixturePlan(c),model:"synthetic-local-test",usage:{input:0,output:0}};},
     });
     await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(result)});
    }catch(e){await route.fulfill({status:500,contentType:"application/json",body:JSON.stringify({error:e instanceof Error?e.message:"Failed"})});}
   });
   await page.goto(url+"/onboarding",{waitUntil:"networkidle"});
   await page.getByRole("button",{name:"18–39 år",exact:true}).click();
   await page.getByRole("button",{name:"Helt ny",exact:true}).click();
   await page.getByLabel("Jeg er mindst 18 år.",{exact:true}).check();
   await page.getByLabel(/Jeg accepterer, at SHAZ og/).check();
   await page.getByRole("button",{name:/Gem og fortsæt/}).click();
   await page.getByRole("heading",{name:"Din uge",exact:true}).waitFor();
   await page.getByRole("button",{name:/Gem og fortsæt/}).click();
   await page.getByRole("heading",{name:"Skader",exact:true}).waitFor();
   await page.getByRole("button",{name:"Nej",exact:true}).click();
   await page.getByRole("button",{name:/Gem og fortsæt/}).click();
   await page.getByRole("heading",{name:"Din mad",exact:true}).waitFor();
   await page.getByRole("button",{name:"Vegansk",exact:true}).click();
   await page.getByRole("button",{name:/Gem og fortsæt/}).click();
   await page.getByRole("heading",{name:"Din plan",exact:true}).waitFor();
   await page.getByLabel(/Jeg vælger .* som dag 1/).check();
   const configResponse=await page.request.get(url+"/api/ai/plan",{headers:{cookie:account.cookie}});
   assert.equal(configResponse.status(),200);
   const config=await configResponse.json();
   assert.equal(config.configuration.mode,"generate-and-confirm");
   assert.equal(config.configuration.enabled,true);
   const textBefore=await page.locator(".generated-plan").innerText();
   assert.doesNotMatch(textBefore,/OpenAI|AI-forslag|Send til godkendelse|Afventer Shaz/i);
   const generateButton=page.getByRole("button",{name:"Lav min trænings- og madplan",exact:true});
   await generateButton.waitFor();
   await generateButton.click();
   await page.locator(".generated-result").waitFor({timeout:40000});
   assert.equal(calls,1);
   assert.equal(await page.getByRole("button",{name:"Brug min trænings- og madplan",exact:true}).count(),1);
   assert.ok(await page.getByText(/7 dages rotation/i).isVisible());
   assert.ok((await page.locator(".generated-result .p-list-row").count())>3);
   const before=await db().query("SELECT count(*)::int n FROM shaz_days WHERE user_id=$1",[account.id]);
   assert.equal(before.rows[0].n,0,"Preview may not activate the program before confirmation");
   const pending=await latestGenerated(account.id);
   assert.equal(pending.status,"ready");
   assert.ok(pending.result&&"sessions" in pending.result);
   await page.screenshot({path:"test-artifacts/demo-plan-preview-390.png",fullPage:true});
   await page.getByRole("button",{name:"Brug min trænings- og madplan",exact:true}).click();
   await page.waitForURL("**/app",{timeout:40000});
   const state=await profile(account.id),id=state.data.aiPlanId;
   assert.ok(id,"Accepted program must persist AI plan id");
   assert.equal(state.data.diet,"vegan");
   for(const table of ["shaz_days","shaz_meal_days"]){
    const count=await db().query("SELECT count(*)::int n FROM "+table+" WHERE user_id=$1",[account.id]);
    assert.equal(count.rows[0].n,100,table);
   }
   const audit=await db().query("SELECT status,reviewed_by,reviewed_at FROM shaz_generated_plans WHERE id=$1",[id]);
   assert.equal(audit.rows[0].status,"committed");
   assert.equal(audit.rows[0].reviewed_by,null,"Demo must not pretend Shaz reviewed the plan");
   assert.equal(audit.rows[0].reviewed_at,null);
   const repeated=await applyGeneratedPlan(account.id,id);
   assert.equal(repeated.alreadyApplied,true);
   assert.equal((await latestGenerated(account.id)).status,"committed");
   assert.deepEqual(jsErrors,[]);
   await page.screenshot({path:"test-artifacts/demo-active-program-390.png",fullPage:true});
  }finally{await context.close();}
 });
 console.log("ALL DIRECT DEMO DELIVERY CHECKS PASSED");
}finally{
 await mkdir("test-artifacts",{recursive:true});
 await writeFile("test-artifacts/demo-direct-delivery.json",JSON.stringify({results,commit:process.env.GITHUB_SHA||"local"},null,2));
 await browser?.close();server?.kill("SIGTERM");
 await db().end();await socket.stop();await pg.close();
}
