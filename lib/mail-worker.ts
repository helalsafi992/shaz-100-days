import { db, schema } from "./db";
import { deliver } from "./mail";
const state = globalThis as typeof globalThis & {
  shazMailWorker?: ReturnType<typeof setInterval>;
};
export function startMailWorker() {
  if (state.shazMailWorker || process.env.APP_ENV === "test") return;
  let running = false;
  async function tick() {
    if (running) return;
    running = true;
    try {
      await schema();
      const r = await db().query(
        "SELECT id FROM shaz_mail WHERE ((status IN ('queued','failed') AND next_attempt_at<=now()) OR (status='sending' AND attempted_at<now()-interval '2 minutes')) AND attempts<5 ORDER BY created_at LIMIT 10",
      );
      for (const m of r.rows) await deliver(m.id);
    } catch {
      console.error("SHAZ_MAIL_WORKER_UNAVAILABLE");
    } finally {
      running = false;
    }
  }
  state.shazMailWorker = setInterval(() => void tick(), 30000);
  state.shazMailWorker.unref();
  void tick();
}
