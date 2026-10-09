import fs from 'node:fs';
import assert from 'node:assert/strict';
// One-time source transformation, executed and validated in CI, never at runtime.
// Existing editors, mutations, safety rules, migrations and account data are retained.
if (fs.existsSync('docs/SIMPLE-EXPERIENCE-IMPLEMENTED.md')) { console.log('Source refactor already applied. Validating committed code.'); process.exit(0); }
for (const file of ['components/customer/SimpleExperience.tsx','lib/experience-summary.ts','app/customer-simple.css']) assert(fs.existsSync(file), `Missing new component: ${file}`);
function replace(text, before, after) { assert.equal(text.split(before).length,2,`Expected one source anchor: ${before.slice(0,90)}`); return text.replace(before,after); }
function between(text, start, end, replacement) { const a=text.indexOf(start), b=text.indexOf(end,a+start.length);assert(a>=0 && b>a,`Missing source range: ${start}`);return text.slice(0,a)+replacement+text.slice(b); }
let s=fs.readFileSync('components/Portal.tsx','utf8');
s=replace(s,'"use client";','"use client";\nimport { SimpleNavigation, SimpleToday, SimpleTraining } from "./customer/SimpleExperience";');
s=replace(s,'  const p = state.profile.data;\n  const complete =',`  useEffect(() => { setState(initial); }, [initial]);
  useEffect(() => {
    if (view !== "training") return;
    const params = new URLSearchParams(window.location.search);
    const week = Number(params.get("week"));
    if (Number.isInteger(week) && week >= 1 && week <= 15) setSelectedWeek(week);
    const cardio = params.get("cardio");
    if (cardio) setCardioOpen(cardio);
  }, [view, initial]);
  const p = state.profile.data;
  const complete =`);
s=replace(s,'<div className="portal">','<div className="portal s-workspace">');
s=between(s,'      <header className="p-header">','      <main className="p-main">','      <SimpleNavigation view={view} />\n');
s=replace(s,'<main className="p-main">','<main className="p-main" id="customer-content">');
s=between(s,'        {state.reviewMode && (','        {message && (',`        {state.reviewMode && <details className="s-review"><summary>Testkonto · indhold afventer godkendelse</summary><p>Dette er det isolerede testmiljø. Trænings- og ernæringsregler er til gennemgang, og der er ikke registreret faglig godkendelse. Ingen rigtige betalinger.</p></details>}
`);
s=between(s,'        {view === "today" && (','        {view === "training" && (',`        {view === "today" && <SimpleToday state={state} onWorkout={setSelected} onAdjust={setAdjustId} food={<FoodSummary today={future ? state.profile.start_date : state.today} />} />}
`);
s=between(s,'        {view === "training" && (','        {view === "food" && (',`        {view === "training" && <SimpleTraining state={state} week={selectedWeek} setWeek={setSelectedWeek} onWorkout={setSelected} onCardio={setCardioOpen} onAdjust={setAdjustId}
          configuration={<>
            <CardioPlanner compact profile={p} rows={state.cardio || []} today={state.today} refresh={refreshState} openId={cardioOpen} clearOpen={() => setCardioOpen(undefined)} showList={false} />
            <details className="s-pause-options" id="pause"><summary>Pause ved sygdom eller rejse</summary><ScheduleBreaks breaks={state.breaks || []} today={state.today} start={state.profile.start_date} refresh={refreshState} /></details>
          </>} />}
`);
s=between(s,'      <nav className="p-mobile-nav">','      {adjustId && (','');
s=replace(s,'        <Workout\n          day={selected}','        <Workout\n          key={selected.id}\n          day={selected}');
s=replace(s,'title="Det, du faktisk har gjort."','title="Fremgang"');
s=replace(s,'text="Ingen opdigtede tal. Her ser du dine egne registreringer, også når fremskridtet er at møde op igen."','text="Dine registreringer. Uge for uge."');
s=replace(s,'<section className="p-card">\n                <h2>Ugens check-in.</h2>','<details className="p-card s-checkin"><summary>Ugens check-in</summary>');
s=replace(s,'                />\n              </section>\n              <section className="p-card">\n                <h2>Vægt er valgfrit.</h2>','                />\n              </details>\n              <details className="p-card s-weight-form"><summary>Se og registrér vægt</summary>');
s=replace(s,'                  action={action}\n                />\n              </section>\n            </div>\n            <section className="p-card">\n              <h2>Din styrkehistorik.</h2>','                  action={action}\n                />\n              </details>\n            </div>\n            <section className="p-card">\n              <h2>Din styrkehistorik.</h2>');
s=replace(s,'        <nav className="exercise-steps" aria-label="Øvelsesoversigt">','        <details className="s-exercise-list"><summary>Øvelse {focusIndex + 1} af {day.plan.exercises.length} · Se oversigt</summary>\n        <nav className="exercise-steps" aria-label="Øvelsesoversigt">');
s=replace(s,'        </nav>\n        {day.plan.exercises.map((e, index) => {','        </nav></details>\n        {day.plan.exercises.map((e, index) => {');
fs.writeFileSync('components/Portal.tsx',s);
let c=fs.readFileSync('components/CardioPlanner.tsx','utf8');
c=replace(c,'  showList = true,','  showList = true,\n  compact = false,');
c=replace(c,'  showList?: boolean;','  showList?: boolean;\n  compact?: boolean;');
c=replace(c,'<section className="p-card cardio-planner" id="cardio">','<section className={"p-card cardio-planner " + (compact ? "s-cardio-compact" : "")} id="cardio">');
fs.writeFileSync('components/CardioPlanner.tsx',c);
let f=fs.readFileSync('components/FoodPlanner.tsx','utf8');
f=replace(f,'"use client";','"use client";\nimport { Icon, MoreActions } from "./customer/SimpleExperience";\nimport { numberLabel } from "@/lib/experience-summary";');
const summaryStart=f.indexOf('export function FoodSummary');const summaryEnd=f.indexOf('export default function FoodPlanner');
let summary=f.slice(summaryStart,summaryEnd);
summary=between(summary,'  return (','\n}\n',`  return <section className="s-food-summary">
    <div className="s-section-header"><h2>Dagens mad</h2><a href="/app/food" className="s-inline-link">Åbn madplan <Icon name="arrow" size={16}/></a></div>
    {error ? <p role="alert" className="p-error">{error}</p> : !day ? <p className="s-food-meta" role="status">Henter din madplan…</p> : <>
      <p className="s-food-meta">{day.slots.length} måltider · {numberLabel(q!.total.kcal)} kcal planlagt{day.target ? ' · mål ' + numberLabel(day.target) : ''}</p>
      <div className="s-food-list">{day.slots.map((s,i)=><a href="/app/food" key={s.id}><span className="s-meal-no">{String(i+1).padStart(2,'0')}</span><span><strong>{s.selected?.recipe.name || "Vælg en opskrift"}</strong><small>{s.time} · {s.name}{s.status === "eaten" ? " · Spist" : s.status === "skipped" ? " · Sprunget over" : ""}</small></span>{s.status === "eaten" ? <Icon name="check" size={16}/> : <Icon name="arrow" size={14}/>}</a>)}</div>
      <p className="s-food-progress"><strong>{day.slots.filter(s=>s.status === "eaten").length} af {day.slots.length}</strong> registreret som spist · {numberLabel(q!.actual.kcal)} kcal</p>
    </>}
  </section>;`);
f=f.slice(0,summaryStart)+summary+f.slice(summaryEnd);
f=replace(f,'          <h1>Din madplan.</h1>','          <h1>Mad</h1>');
f=replace(f,'          Beregn & tilpas','          Tilpas madplan');
// Preserve calculation, validation, snapshots and mutations; replace only the visible summary.
f=between(f,'              <section className="p-card daily-nutrition">','              <div className="meal-cards">',`              <section className="p-card daily-nutrition" aria-label="Dagens energi og protein">
                <div className="s-nutrition-header"><div><span>Planlagt i dag</span><strong>{numberLabel(quality.total.kcal)} <small>kcal</small></strong></div><div><span>Dit daglige mål</span><strong>{day.target ? numberLabel(day.target) : "Portionsplan"} <small>{day.target ? "kcal" : ""}</small></strong></div></div>
                <p className="s-nutrition-secondary"><b>{numberLabel(quality.total.protein)} g protein</b> planlagt{day.proteinTarget ? ' · minimumsmål ' + day.proteinTarget + ' g' : ''}</p>
                <p className="s-nutrition-secondary">Registreret som spist: <b>{numberLabel(quality.actual.kcal)} kcal</b> · {numberLabel(quality.actual.protein)} g protein</p>
                {quality.issues.length > 0 && <details className="plan-issues" open><summary>Planen kræver din opmærksomhed</summary>{quality.issues.map(x=><p key={x}>{x}</p>)}</details>}
                <details className="s-nutrition-details"><summary>Om beregning og mål</summary><p>Energi og næringsindhold er beregnede estimater fra råvarerne. Planlagt er ikke det samme som spist. Komplette automatiske planer sigter efter højst 5 % afvigelse fra målet.</p><p>Proteinvisningen viser den valgte plan og et separat minimumsmål – ikke et maksimum. Beregningen kontrollerer ikke alle vitaminer og mineraler. Faglig godkendelse af testreglerne afventer.</p></details>
              </section>
`);
// Remove the old recorded-meal actions BEFORE introducing the same date condition below.
f=between(f,'                    {date <= today && (','                  </section>','');
f=between(f,'                    <div className="p-section-head">\n                      <span className="p-eyebrow">','                    {s.batch && (',`                    <div className="s-meal-top"><span className="p-eyebrow">{s.time} · {s.name}</span><span className={"status " + s.status}>{s.status === "eaten" ? "Spist" : s.status === "skipped" ? "Sprunget over" : "Planlagt"}</span>
                      <MoreActions label={"Flere muligheder for " + s.name}>
                        {s.status === "planned" && !s.batch && s.selected && <><button disabled={busy} onClick={()=>{setAmount(s.selected!.servings);setModal({slot:s,mode:"portion"});}}>Tilpas portion</button><button disabled={busy} onClick={()=>meal(s,"remove")}>Fjern måltid</button>{date >= today && date < addDays(state!.profile.start_date,99) && <button disabled={busy} onClick={()=>setBatchSlot(s)}>Lav også til i morgen</button>}</>}
                        {date <= today && (s.status === "planned" ? <button disabled={busy} onClick={()=>meal(s,"skipped")}>Jeg sprang måltidet over</button> : <button disabled={busy} onClick={()=>window.confirm("Ophæv registreringen, så du kan rette måltidet?") && meal(s,"reopen")}>Ret registrering</button>)}
                        {s.status === "planned" && s.batch && <span className="s-menu-note">Fælles madlavning ændres under sammenkædningen nedenfor.</span>}
                      </MoreActions>
                    </div>
                    {s.selected ? <><div className="s-meal-title"><span className="s-meal-symbol"><Icon name="food"/></span><div><h2>{s.selected.recipe.name}</h2><p className="s-meal-facts">{numberLabel(s.selected.totals.kcal)} kcal · {numberLabel(s.selected.totals.protein)} g protein · {s.selected.recipe.minutes} min.</p></div></div>
                      <div className="s-meal-actions"><button onClick={()=>setRecipe(s.selected)}>Se opskrift</button>{s.status === "planned" && !s.batch && <button disabled={busy} onClick={()=>{setModal({slot:s,mode:"swap"});setQ("");}}>Byt · {s.options.length} valg</button>}{date <= today && s.status === "planned" && <button className="s-eaten" disabled={busy} onClick={()=>meal(s,"eaten")}><Icon name="check" size={14}/>Spist</button>}</div>
                    </> : <div className="empty-meal"><h2>Vælg et nyt måltid</h2><p>Kaloriemålet er uændret. Vælg blandt dine egnede opskrifter.</p><button className="p-secondary" onClick={()=>{setModal({slot:s,mode:"swap"});setQ("");}}>Vælg en anden opskrift</button>{s.previous && <button className="s-text-action" disabled={busy} onClick={()=>meal(s,"undo")}>Fortryd fjernelse</button>}</div>}
`);
f=replace(f,'    setState(d);\n    if (start < d.profile.start_date)','    setState(d);\n    setError("");\n    if (start < d.profile.start_date)');
f=replace(f,'    if (r) {\n      await load();\n      setModal(null);\n    }','    if (r) {\n      try { await load(); setModal(null); }\n      catch (e) { setError(e instanceof Error ? e.message : "Handlingen er gemt, men overblikket kunne ikke opdateres. Genindlæs siden."); }\n    }');
// Roving tab focus and keyboard navigation for the existing food tabs.
f=replace(f,'            aria-selected={tab === id}\n            onClick={() => setTab(id)}',`            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            aria-controls="food-tab-panel"
            onKeyDown={event => {
              const ids=["plan","recipes","shopping"], i=ids.indexOf(id);
              const next=event.key === "ArrowRight" ? (i+1)%3 : event.key === "ArrowLeft" ? (i+2)%3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : -1;
              if(next < 0) return;
              event.preventDefault(); setTab(ids[next]);
              (event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button[role="tab"]')[next])?.focus();
            }}
            onClick={() => setTab(id)}`);
f=replace(f,'      {tab === "recipes" ? (','      <div id="food-tab-panel" role="tabpanel" aria-label={tab === "plan" ? "Min madplan" : tab === "recipes" ? "Opskrifter" : "Indkøb"}>\n      {tab === "recipes" ? (');
f=replace(f,'      {batchSlot && (','      </div>\n      {batchSlot && (');
fs.writeFileSync('components/FoodPlanner.tsx',f);
let a=fs.readFileSync('components/Account.tsx','utf8');
a=replace(a,'"use client";','"use client";\nimport { SimpleNavigation } from "./customer/SimpleExperience";');
a=between(a,'    <main className="portal p-main">','      <div className="p-page-heading">','    <div className="portal s-workspace"><SimpleNavigation view="profile"/><main className="p-main" id="customer-content">\n');
a=replace(a,'<h1>Profil og indstillinger.</h1>','<h1>Min profil</h1>');
a=replace(a,'    </main>','    </main></div>');
fs.writeFileSync('components/Account.tsx',a);
let layout=fs.readFileSync('app/layout.tsx','utf8');
layout=replace(layout,'import "./customer.css";','import "./customer.css";\nimport "./customer-simple.css";');
fs.writeFileSync('app/layout.tsx',layout);
let home=fs.readFileSync('app/page.tsx','utf8');
home=replace(home,'  return (\n    <>\n      <header','  return (\n    <div className="public-simple">\n      <header');
home=replace(home,'    </>\n  );\n}','    </div>\n  );\n}');
home=replace(home,'                Din træning.','                Din træning.{" "}');
home=replace(home,'                Din madplan.','                Din madplan.{" "}');
fs.writeFileSync('app/page.tsx',home);
fs.writeFileSync('docs/SIMPLE-EXPERIENCE-IMPLEMENTED.md',`# SHAZ — task-first UI\n\nImplemented directly on the existing app. Domain models, auth, payments, safety policies, storage, and existing editors are preserved.\n\n- Daily primary action is chosen from real pending sessions; rest/completed/future/end are different states.\n- Compact meal list, explicit planned/target/eaten figures, contextual actions and unchanged replacement/batch flows.\n- One calendar for strength/cardio/other sport, correct selected dates, settings below the schedule.\n- Same navigation on Today, Training, Food, Progress and Profile.\n- Focused workout retains draft syncing, timers, exercise replacements and revision conflict handling.\n- Public site is restyled without changing checkout or sales gates.\n\nValidation is recorded in the GitHub Actions run. Live staging validation is separate and must not be inferred from local screenshots. No payments were opened.\n`);
console.log('Applied source-only UI refinement. Existing domain code and migrations unchanged.');
