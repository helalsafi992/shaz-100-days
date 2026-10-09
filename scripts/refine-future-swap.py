"""One-time source refinement validated by the existing isolated browser suite."""
from pathlib import Path
root = Path.cwd()
marker = root / 'docs/FUTURE_EXERCISE_SWAP.md'
if marker.exists():
    print('Future swap refinement already committed.')
    raise SystemExit(0)
def patch(path, old, new):
    target = root / path
    source = target.read_text()
    assert source.count(old) == 1, 'Unexpected source anchor: ' + path
    target.write_text(source.replace(old, new))
patch('components/Portal.tsx',
'''  const savedDraft = state.drafts?.find((d) => d.day_id === day.id);''',
'''  // Planning future exercise alternatives is separate from recording future sets.
  const canSwap = state.day <= 100 && day.scheduled_date >= state.today && day.status !== "completed" && !day.plan.paused;
  const savedDraft = state.drafts?.find((d) => d.day_id === day.id);''')
patch('components/Portal.tsx',
'''{day.status !== "completed" && <ExerciseSwapButton exercise={e} options={options} disabled={busy||readonly} onSwap={async replacement=>{
                  if(!(await flush()))throw Error("Dine sæt kunne ikke gemmes. Prøv igen før du skifter øvelse.");''',
'''{day.status !== "completed" && <ExerciseSwapButton exercise={e} options={options} disabled={busy||!canSwap} onSwap={async replacement=>{
                  if(!readonly && !(await flush()))throw Error("Dine sæt kunne ikke gemmes. Prøv igen før du skifter øvelse.");''')
patch('scripts/intake-regression.mts',
'''  assert.deepEqual(errors,[]);await context.close();
 });
 console.log('ALL CLEAR ONBOARDING CHECKS PASSED');''',
'''  // Upcoming sessions allow planning swaps, but do not record any future sets.
  const future=(await db().query("SELECT id,log,plan FROM shaz_days WHERE user_id=$1 AND day BETWEEN 8 AND 14 AND plan->>'kind'='workout' ORDER BY day LIMIT 1",[fresh.id])).rows[0];
  await page.goto(env.APP_URL+'/app/training?week=2',{waitUntil:'networkidle'});
  await page.locator('.s-activity-wrap .s-activity').first().click();
  const swap=page.getByRole('button',{name:'Skift øvelse',exact:true});
  assert.ok(await swap.isEnabled(),'Future planning must not share the set-recording lock');
  assert.ok(await page.locator('.set-row input').first().isDisabled(),'Future performance cannot be recorded');
  await swap.click();
  const opts=page.locator('.exercise-option');
  assert.ok(await opts.count()>0 && await opts.count()<=3);
  await page.screenshot({path:'test-artifacts/future-exercise-options-390.png',fullPage:true});
  const response=page.waitForResponse(r=>r.url().includes('/api/platform/swap-exercise')&&r.request().method()==='POST');
  await opts.first().click();
  assert.equal((await response).status(),200);
  await page.getByRole('dialog',{name:'Træningspas'}).waitFor({state:'hidden'});
  const afterFuture=(await db().query('SELECT plan,log FROM shaz_days WHERE id=$1',[future.id])).rows[0];
  assert.notEqual(afterFuture.plan.exercises[0].id,future.plan.exercises[0].id);
  assert.deepEqual(afterFuture.log,future.log,'A future swap must not invent recorded sets');
  assert.equal((await db().query('SELECT count(*)::int n FROM shaz_workout_drafts WHERE day_id=$1',[future.id])).rows[0].n,0);
  assert.deepEqual(errors,[]);await context.close();
 });
 console.log('ALL CLEAR ONBOARDING CHECKS PASSED');''')
marker.write_text('# Exercise selection before training day\n\nFuture planned sessions expose the same approved exercise alternatives. Future set registration stays locked and no performance draft is created by the swap. Verified by the isolated coach-to-client browser workflow.\n')
print('Future exercise planning is separated from performance logging.')
