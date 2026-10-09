import fs from 'node:fs';
import assert from 'node:assert/strict';
const path='scripts/intake-regression.mts';let source=fs.readFileSync(path,'utf8');
if(source.includes("Concise injury-only onboarding creates and confirms a real stored plan"))process.exit(0);
const start=source.indexOf(" await check('Fictional 18-year-old completes five areas and activates a saved vegan plan'");
const end=source.indexOf(" console.log('ALL CLEAR ONBOARDING CHECKS PASSED');",start);
assert(start>=0&&end>start,'Existing novice test location changed; preserve and review it before replacing UI selectors.');
source=source.slice(0,start)+fs.readFileSync('scripts/generated-plan-browser.inc','utf8')+source.slice(end);
fs.writeFileSync(path,source);
