import { schema, db } from "../lib/db";
await schema();
console.log("Migrations applied");
await db().end();
