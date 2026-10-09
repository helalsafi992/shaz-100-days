import test from 'node:test';
import assert from 'node:assert/strict';
import { weekStats, safeWeek, pendingActivity, safeProgress } from '../lib/experience-summary';
const row = (status: string, date = '2026-10-09', kind = 'workout') => ({status, scheduled_date:date, plan:{kind}});
test('customer overview separates real sessions from rest, paused and removed records',()=>{
 const result=weekStats([row('completed'),row('planned'),row('planned','2026-10-10','rest'),row('paused')],[row('completed'),row('removed'),row('skipped')],'2026-10-08','2026-10-14');
 assert.deepEqual(result,{planned:3,completed:2,strength:1,cardio:1});
});
test('completed, paused and skipped sessions never get a Start action',()=>{
 for(const status of ['completed','paused','removed','skipped']) assert.equal(pendingActivity(row(status)),false);
 assert.equal(pendingActivity(row('planned')),true);
 assert.equal(pendingActivity({...row('planned'),plan:{kind:'workout',paused:true}}),false);
});
test('program week and progress handle start, end and missing goals without invented progress',()=>{
 assert.deepEqual([-1,0,1,7,8,99,100,101].map(safeWeek),[1,1,1,1,2,15,15,15]);
 assert.equal(safeProgress(500,null),0);assert.equal(safeProgress(0,2000),0);assert.equal(safeProgress(2500,2000),100);assert.equal(safeProgress(1000,2000),50);
});
