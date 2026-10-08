import type { PoolClient } from "pg";
import { db, transaction, audit } from "./db";
import { planningPeriod } from "./platform";
import { localDate, addDays } from "./profile";
import { hash, HttpError } from "./security";
import type { ScheduleBreak } from "./schedule-breaks";
export async function scheduleBreaks(
  user: string,
  client: Pick<PoolClient, "query"> = db(),
): Promise<ScheduleBreak[]> {
  return (
    await client.query(
      "SELECT id,from_date::text,to_date::text,restart,restart_until::text FROM shaz_schedule_breaks WHERE user_id=$1 AND cancelled_at IS NULL ORDER BY from_date",
      [user],
    )
  ).rows;
}
export async function assertNoBreak(
  c: Pick<PoolClient, "query">,
  user: string,
  date: string,
) {
  const r = await c.query(
    "SELECT 1 FROM shaz_schedule_breaks WHERE user_id=$1 AND cancelled_at IS NULL AND $2::date BETWEEN from_date AND to_date LIMIT 1",
    [user, date],
  );
  if (r.rowCount)
    throw new HttpError(
      409,
      "Denne dato er sat på pause. Dine kladder bevares; ret eller ophæv pausen før du registrerer træning.",
    );
}
export async function changeBreak(
  user: string,
  input: {
    from: string;
    to: string;
    restart: "normal" | "easy";
    fingerprint?: string;
  },
  confirm: boolean,
) {
  const p = await planningPeriod(user);
  if (
    input.from < localDate() ||
    input.from < p.start_date ||
    input.to < input.from ||
    input.to > addDays(p.start_date, 98)
  )
    throw new HttpError(
      400,
      "Vælg en periode fra i dag inden dag 100. Afslutningsdagen og den samlede adgang ændres ikke.",
    );
  const breaks = await scheduleBreaks(user);
  if (breaks.some((b) => input.from <= b.to_date && input.to >= b.from_date))
    throw new HttpError(
      409,
      "Perioden overlapper en eksisterende pause. Ophæv først den gamle pause, hvis den skal ændres.",
    );
  const readAffected = async (c: Pick<PoolClient, "query">) => {
    const strength = await c.query(
      "SELECT id,scheduled_date::text,status,revision,plan,log FROM shaz_days WHERE user_id=$1 AND scheduled_date BETWEEN $2 AND $3 ORDER BY id",
      [user, input.from, addDays(input.to, 7)],
    );
    const cardio = await c.query(
      "SELECT id,scheduled_date::text,status,revision,plan,log FROM shaz_cardio WHERE user_id=$1 AND scheduled_date BETWEEN $2 AND $3 ORDER BY id",
      [user, input.from, addDays(input.to, 7)],
    );
    const drafts = await c.query(
      "SELECT day_id,revision FROM shaz_workout_drafts WHERE user_id=$1 ORDER BY day_id",
      [user],
    );
    return {
      strength: strength.rows,
      cardio: cardio.rows,
      drafts: drafts.rows,
    };
  };
  const affected = await readAffected(db());
  const signature = (rows: typeof affected) =>
    hash(
      JSON.stringify({
        version: p.version,
        breaks,
        ...rows,
        from: input.from,
        to: input.to,
        restart: input.restart,
      }),
    );
  const fingerprint = signature(affected);
  const inPeriod = (r: { scheduled_date: string; status: string }) =>
    r.scheduled_date <= input.to && r.status !== "completed";
  const preview = {
    fingerprint,
    strength: affected.strength.filter(
      (r) => r.plan.kind === "workout" && inPeriod(r),
    ).length,
    cardio: affected.cardio.filter((r) => r.status !== "removed" && inPeriod(r))
      .length,
    programEnds: addDays(p.start_date, 99),
    restart: input.restart,
  };
  if (!confirm) return preview;
  if (input.fingerprint !== fingerprint)
    throw new HttpError(
      409,
      "Planen eller en kladde er ændret. Se en ny forhåndsvisning.",
    );
  await transaction(async (c) => {
    const lock = await c.query(
      "SELECT version FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
      [user],
    );
    if (lock.rows[0]?.version !== p.version)
      throw new HttpError(409, "Profilen er ændret. Se en ny forhåndsvisning.");
    // Every training write locks the profile first, so this second read is stable.
    if (signature(await readAffected(c)) !== fingerprint)
      throw new HttpError(
        409,
        "Et pas eller en kladde er ændret. Se en ny forhåndsvisning.",
      );
    const active = await c.query(
      "SELECT 1 FROM shaz_schedule_breaks WHERE user_id=$1 AND cancelled_at IS NULL AND from_date<=$3 AND to_date>=$2",
      [user, input.from, input.to],
    );
    if (active.rowCount)
      throw new HttpError(409, "Perioden er allerede sat på pause.");
    await c.query(
      "INSERT INTO shaz_schedule_breaks(id,user_id,from_date,to_date,restart) VALUES($1,$2,$3,$4,$5)",
      [crypto.randomUUID(), user, input.from, input.to, input.restart],
    );
    await c.query(
      "UPDATE shaz_profile SET version=version+1,updated_at=now() WHERE user_id=$1",
      [user],
    );
  });
  await audit(user, "schedule-break-created", user, {
    from: input.from,
    to: input.to,
    restart: input.restart,
  });
  return { ok: true };
}
export async function cancelBreak(user: string, id: string) {
  await planningPeriod(user);
  await transaction(async (c) => {
    await c.query(
      "SELECT user_id FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
      [user],
    );
    const r = await c.query(
      "SELECT *,from_date::text,to_date::text FROM shaz_schedule_breaks WHERE user_id=$1 AND id=$2 AND cancelled_at IS NULL FOR UPDATE",
      [user, id],
    );
    if (!r.rowCount)
      throw new HttpError(404, "Pausen findes ikke på din konto.");
    // Never rewrite earlier days. Preserve the elapsed part as history.
    const from = r.rows[0].from_date,
      to = r.rows[0].to_date;
    if (from < localDate())
      await c.query(
        "UPDATE shaz_schedule_breaks SET to_date=$3,restart_until=$4 WHERE user_id=$1 AND id=$2",
        [
          user,
          id,
          to >= localDate() ? addDays(localDate(), -1) : to,
          addDays(localDate(), -1),
        ],
      );
    else
      await c.query(
        "UPDATE shaz_schedule_breaks SET cancelled_at=now() WHERE user_id=$1 AND id=$2",
        [user, id],
      );
    await c.query(
      "UPDATE shaz_profile SET version=version+1,updated_at=now() WHERE user_id=$1",
      [user],
    );
  });
  await audit(user, "schedule-break-ended", id);
  return { ok: true };
}
