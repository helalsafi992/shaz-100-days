import { Pool, type PoolClient } from "pg";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
const shared = globalThis as typeof globalThis & { shazPool?: Pool };
let ready: Promise<void> | undefined;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_UNAVAILABLE");
  if (shared.shazPool) return shared.shazPool;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.APP_ENV === "test" ? 1 : 8,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  });
  // pg emits on idle connection loss during a database restart. Handle it without
  // crashing the app or logging a connection string, query or customer payload.
  pool.on("error", () =>
    console.error(JSON.stringify({ event: "database_connection_lost" })),
  );
  shared.shazPool = pool;
  return pool;
}
export async function transaction<T>(
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  const c = await db().connect();
  try {
    await c.query("BEGIN");
    const v = await fn(c);
    await c.query("COMMIT");
    return v;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export function schema() {
  return (ready ??= migrate().catch((e) => {
    ready = undefined;
    throw e;
  }));
}
async function migrate() {
  await transaction(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(703100)");
    await c.query(
      "CREATE TABLE IF NOT EXISTS shaz_migrations(name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const file of (await readdir(join(process.cwd(), "migrations")))
      .filter((x) => x.endsWith(".sql"))
      .sort()) {
      const sql = await readFile(
        join(process.cwd(), "migrations", file),
        "utf8",
      );
      const hash = createHash("sha256").update(sql).digest("hex");
      const previous = await c.query(
        "SELECT checksum FROM shaz_migrations WHERE name=$1",
        [file],
      );
      if (previous.rowCount) {
        if (previous.rows[0].checksum !== hash)
          throw new Error("MIGRATION_CHECKSUM_CHANGED");
        continue;
      }
      await c.query(sql);
      await c.query(
        "INSERT INTO shaz_migrations(name,checksum) VALUES($1,$2)",
        [file, hash],
      );
    }
  });
}
export async function audit(
  actor: string | null,
  action: string,
  target: string,
  details: unknown = {},
) {
  await db().query(
    "INSERT INTO shaz_audit(id,actor_id,action,target,details) VALUES($1,$2,$3,$4,$5)",
    [crypto.randomUUID(), actor, action, target, JSON.stringify(details)],
  );
}
