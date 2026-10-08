import test from "node:test";
import assert from "node:assert/strict";
import {activityForDate,activityCounts} from "../lib/activity";
test("Unified calendar never labels a cardio day as pure rest; completed counts separate strength/cardio",()=>{
 const date="2026-10-08";const rest=[{scheduled_date:date,plan:{kind:"rest"},status:"rest"}];
 const cardio=[{scheduled_date:date,status:"planned"}];
 assert.equal(activityForDate(date,rest,cardio).label,"Cardio");
 assert.equal(activityForDate(date,rest,[{...cardio[0],status:"removed"}]).label,"Restitution");
 assert.equal(activityForDate(date,rest,[{...cardio[0],status:"skipped"}]).label,"Pas sprunget over");
 const strength=[{scheduled_date:date,plan:{kind:"workout"},status:"completed"}];
 assert.equal(activityForDate(date,strength,cardio).label,"Styrke + cardio");
 assert.deepEqual(activityCounts([...rest,...strength],[{status:"completed"},{status:"planned"},{status:"removed"}]),{strength:1,cardio:1,total:2});
});
