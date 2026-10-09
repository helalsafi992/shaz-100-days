"""Final guarded changes for coach review. No production fixtures or runtime bypasses."""
from pathlib import Path
root = Path.cwd()
def patch(file, old, new):
    p = root / file
    source = p.read_text()
    assert source.count(old) == 1, 'Unexpected source anchor in ' + file
    p.write_text(source.replace(old, new))

patch('lib/ai/intake-store.ts', "import { db,schema,transaction } from '../db';", "import { db,schema,transaction } from '../db';\nimport type {PoolClient} from 'pg';")
patch('lib/ai/intake-store.ts', "export async function storedIntake(user:string):Promise<IntakeDraft|null>{await schema();const r=await db().query", "export async function storedIntake(user:string,connection?:PoolClient):Promise<IntakeDraft|null>{if(!connection)await schema();const r=await (connection||db()).query")
patch('app/api/platform/[...path]/route.ts', 'const injuryAnswers=await storedIntake(s.user.id);', 'const injuryAnswers=await storedIntake(s.user.id,c);')
# A client must not bypass review by omitting a personalization flag.
patch('app/api/platform/[...path]/route.ts', '''      const candidate=await profile(s.user.id);
      if(candidate.data.personalizationVersion)throw new HttpError(403,"Din plan skal først godkendes af Shaz.");
      z.object({ confirmStart: z.literal(true) }).parse(input);
      await activate(s.user.id);
      return Response.json({ ok: true });''', '''      z.object({ confirmStart: z.literal(true) }).parse(input);
      throw new HttpError(403,"Din plan skal først godkendes af Shaz.");''')
patch('app/api/plan/[...path]/route.ts', 'if(current.data.personalizationVersion)throw new HttpError(403,"Send ændringerne til coachens godkendelse via Tilpas plan.");', 'if(current.data.personalizationVersion||input.data)throw new HttpError(403,"Send ændringerne til coachens godkendelse via Tilpas plan.");')
# Trusted test setup retains historical domain fixtures; public self-activation is denied.
patch('scripts/integration.mts', '''          (await post("activate", { confirmStart: true }, h)).status,
          200,
        );
        const state''', '''          (await post("activate", { confirmStart: true }, h)).status,
          403,
        );
        // Historical fixture setup only; coach browser tests cover actual release.
        await activate(s.user.id);
        const state''')
patch('scripts/integration.mts', 'Three simulated paid journeys: webhook → captured e-mail → verified login → saved onboarding → activation → workout', 'Three paid access journeys and denied self-activation; historical workout fixtures')
patch('scripts/integration.mts', '''      const confirm = {
        ...input,
        expectedVersion: preview.data.version,
        fingerprint: preview.data.fingerprint,
      };''', '''      const confirm = {
        ...input,
        expectedVersion: preview.data.version,
        fingerprint: preview.data.fingerprint,
      };
      const {trainingChange} = await import('../lib/training-change');
      assert.equal((await planpost('training-confirm',confirm,u.headers)).status,403,'A full replacement plan requires coach release, even for an old profile');
      const internalConfirm = async (value: any) => {
        try { return {status:200,data:await trainingChange(u.id,value,true)}; }
        catch(error) { return {status:(error as {status?:number}).status||500,data:null}; }
      };''')
p = root / 'scripts/integration.mts'
s = p.read_text()
a = s.index('      const internalConfirm = async')
b = s.index('      const before = await snapshot(u.id)', a)
part=s[a:b]
part=part.replace('await planpost(\n            "training-confirm",', 'await internalConfirm(')
part=part.replace('            u.headers,\n', '')
part=part.replace('planpost("training-confirm", confirm, u.headers)', 'internalConfirm(confirm)')
s=s[:a]+part+s[b:]
p.write_text(s)
patch('scripts/intake-regression.mts', '''  const generatedId=pending.result!.id;
  await assert.rejects''', '''  const generatedId=pending.result!.id;
  const deniedActivation=await fetch(env.APP_URL+'/api/platform/activate',{method:'POST',headers:{origin:env.APP_URL,cookie:fresh.cookie,'Content-Type':'application/json'},body:JSON.stringify({confirmStart:true})});
  assert.equal(deniedActivation.status,403);
  const deniedApply=await fetch(env.APP_URL+'/api/ai/plan',{method:'POST',headers:{origin:env.APP_URL,cookie:fresh.cookie,'Content-Type':'application/json'},body:JSON.stringify({action:'apply',id:generatedId})});
  assert.equal(deniedApply.status,403);
  await assert.rejects''')
print('Applied transaction-safe injury reads and closed legacy client publication paths.')
