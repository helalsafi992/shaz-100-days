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
let test=fs.readFileSync('scripts/integration.mts','utf8');
function once(before,after){assert.equal(test.split(before).length,2,'Test anchor changed: '+before.slice(0,100));test=test.replace(before,after);}
// Existing assertions on the database, ownership, meal totals and persistence are not removed.
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
// Check shared navigation and disclosure at each authenticated viewport as well.
once('          if (route === "/app" && width === 390)','          if (route.startsWith("/app")) {\n            const nav = page.getByRole("navigation", { name: width <= 760 ? "Mobilnavigation" : "Hovednavigation", exact: true });\n            assert.ok(await nav.isVisible(), "Shared navigation: " + route);\n            assert.equal(await nav.getByRole("link").count(), 4);\n          }\n          if (route === "/app" && width === 390)');
fs.writeFileSync('scripts/integration.mts',test);
fs.writeFileSync(done,'# Simplified experience regression tests\n\nExisting integration tests retain their state, ownership, nutrition, persistence, refund and access checks. UI locators follow the new navigation: completed workouts are reached through the calendar, secondary meal actions through their menu, and pause settings through disclosure. Added shared-navigation checks at every authenticated route and viewport. No test account data or credentials are committed.\n');
console.log('Updated selectors and retained the full integration suite.');
