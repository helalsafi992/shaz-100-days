import fs from 'node:fs';
import assert from 'node:assert/strict';
const done='docs/SIMPLE-EXPERIENCE-TESTS.md';
if(fs.existsSync(done)) process.exit(0);
let ui=fs.readFileSync('components/customer/SimpleExperience.tsx','utf8');
ui=ui.replace('"/app/progress", "chart"] as const;', '"/app/progress", "chart"]] as const;');
fs.writeFileSync('components/customer/SimpleExperience.tsx',ui);
let selectors=fs.readFileSync('lib/experience-summary.ts','utf8');
selectors=selectors.replace('kind?: string; paused?: boolean','kind?: string; paused?: boolean; selected?: unknown');
fs.writeFileSync('lib/experience-summary.ts',selectors);
fs.appendFileSync('app/customer-simple.css', `
/* Native select intrinsic sizing must not displace the week controls at 320px. */
.s-workspace .s-week-control > label { flex: 1; min-width: 0; }
.s-workspace .s-week-control > button { flex: 0 0 44px; }
.s-workspace .s-week-control select { width: 100%; min-width: 0; padding-inline: 4px; }
.s-workspace .s-activity { min-width: 0; flex: 1; }
.s-workspace .s-activity strong { overflow-wrap: anywhere; }
.s-workspace .food-planner > .p-section-head { flex-direction: row; flex-wrap: nowrap; }
.s-workspace .food-planner > .p-section-head > div { min-width: 0; }
.s-workspace .food-planner > .p-section-head > button { flex: none; }
.s-workspace .s-rest-row, .s-workspace .s-bottom-nav a { color: #63705f; }
.s-workspace .s-activity em { color: #65755e; }
.s-workspace .s-bottom-nav .is-current { color: #234c2f; }
`);
let test=fs.readFileSync('scripts/integration.mts','utf8');
function once(before,after){assert.equal(test.split(before).length,2,'Test anchor changed: '+before.slice(0,100));test=test.replace(before,after);}
// Existing assertions on database contents, ownership, totals and persistence remain intact.
test=test.replaceAll('name: "Beregn & tilpas"','name: "Tilpas madplan"');
test=test.replaceAll('name: "Byt · 3 forslag"','name: "Byt · 3 valg"');
test=test.replaceAll('name: "Start træning →"','name: "Start træning", exact: true');
once('assert.ok((await page.locator("body").textContent())?.includes("I dag."));','assert.ok(await page.getByRole("heading", {name:"I dag", exact:true}).isVisible());');
once('      await page.goto(env.APP_URL + "/app/training");\n      await page\n        .getByRole("button", { name: "Planlæg pause", exact: true })','      await page.goto(env.APP_URL + "/app/training");\n      await page.locator(".s-pause-options > summary").click();\n      await page\n        .getByRole("button", { name: "Planlæg pause", exact: true })');
once('      await page.getByText("Flere handlinger", { exact: true }).first().click();','      await page.locator(".meal-card .s-more > summary").first().click();');
once('      await page\n        .getByRole("button", { name: "Fjern", exact: true })','      await page.locator(".meal-card .s-more > summary").first().click();\n      await page\n        .getByRole("button", { name: "Fjern måltid", exact: true })');
once('      await page.goto(env.APP_URL + "/app");\n      await page\n        .getByRole("button", { name: "Se og ret registrering" })\n        .click();','      await page.goto(env.APP_URL + "/app/training");\n      await page.locator(".s-activity").filter({hasText:"Gennemført"}).first().click();');
once('assert.match(card, /Planlagt protein\\s*160\\s*g/);','assert.match(card, /160\\s*g protein\\s*planlagt/);');
once('assert.match(card, /Minimumsmål: 102 g/);','assert.match(card, /minimumsmål 102 g/);');
once('          if (route === "/app" && width === 390)','          if (route.startsWith("/app")) {\n            const nav = page.getByRole("navigation", { name: width <= 760 ? "Mobilnavigation" : "Hovednavigation", exact: true });\n            assert.ok(await nav.isVisible(), "Shared navigation: " + route);\n            assert.equal(await nav.getByRole("link").count(), 4);\n          }\n          if (route === "/app" && width === 390)');
once('          assert.equal(\n            await page.evaluate(\n              () => document.documentElement.scrollWidth > innerWidth,',`          if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
            console.log("OVERFLOW", route, width, await page.evaluate(() => [...document.querySelectorAll("body *")].filter(e => { const r=e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth+1 || r.left < -1); }).map(e => ({ tag:e.tagName, class:e.className, width:e.getBoundingClientRect().width, right:e.getBoundingClientRect().right })).slice(0,30)));
            await page.screenshot({path: "test-artifacts/overflow-" + width + ".png", fullPage:true});
          }
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,`);
fs.writeFileSync('scripts/integration.mts',test);
fs.writeFileSync(done,'# Simplified experience regression tests\n\nExisting integration tests retain their state, ownership, nutrition, persistence, refund and access checks. UI locators follow the new navigation: completed workouts through the calendar, secondary meal actions through their menu, and pause settings through disclosure. Shared-navigation checks cover every authenticated route and viewport. Overflow failures capture diagnostics, not hidden content. No test account data or credentials are committed.\n');
console.log('Updated selectors and retained the full integration suite.');
