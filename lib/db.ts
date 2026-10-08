import {Pool} from 'pg';
let pool:Pool|undefined;let ready:Promise<void>|undefined;
export function db(){if(!process.env.DATABASE_URL)throw new Error('Database not configured');if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,max:8,connectionTimeoutMillis:5000});return pool}
export function schema(){if(!ready)ready=db().query(`CREATE TABLE IF NOT EXISTS waitlist(email TEXT PRIMARY KEY,token_hash TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),consent_version TEXT NOT NULL DEFAULT 'launch-v1');CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INT NOT NULL DEFAULT 1,expires TIMESTAMPTZ NOT NULL);`).then(()=>{}).catch(e=>{ready=undefined;throw e});return ready}
