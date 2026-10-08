import { assertNoBreak } from "./break-store";
import { db, transaction } from "./db";
import { activePeriod, ownedDay } from "./platform";
import { localDate } from "./profile";
import { HttpError } from "./security";
export type SavedSet = {
  exercise: string;
  set: number;
  reps: number;
  kg: number;
  effort: number;
};
export async function saveDraft(
  user: string,
  v: { id: string; sets: SavedSet[]; timerEnd: number; revision: number },
) {
  await activePeriod(user);
  return await transaction(async (c) => {
    await c.query(
      "SELECT user_id FROM shaz_profile WHERE user_id=$1 FOR UPDATE",
      [user],
    );
    const q = await c.query(
      "SELECT *,scheduled_date::text FROM shaz_days WHERE id=$1 AND user_id=$2 FOR UPDATE",
      [v.id, user],
    );
    if (!q.rowCount) throw new HttpError(404, "Træningen findes ikke.");
    const day = q.rows[0];
    if (day.status !== "completed")
      await assertNoBreak(c, user, day.scheduled_date);
    if (day.scheduled_date > localDate() || day.plan.kind !== "workout")
      throw new HttpError(
        400,
        "Kladder kan først registreres på passets dato.",
      );
    const allowed = [
      ...day.plan.exercises,
      ...(day.plan.archivedExercises || []),
      ...(day.plan.removedExercises || []),
    ];
    if (
      v.sets.some(
        (s) => !allowed.some((e) => e.id === s.exercise && s.set <= e.sets),
      ) ||
      new Set(v.sets.map((s) => s.exercise + ":" + s.set)).size !==
        v.sets.length
    )
      throw new HttpError(400, "Sættene passer ikke til dit pas.");
    const old = await c.query(
      "SELECT revision FROM shaz_workout_drafts WHERE user_id=$1 AND day_id=$2 FOR UPDATE",
      [user, v.id],
    );
    if ((old.rows[0]?.revision || 0) !== v.revision)
      throw new HttpError(
        409,
        "En anden session har ændret kladden. Din lokale kladde er bevaret. Genindlæs og vælg hvilken kladde du vil beholde.",
      );
    const r = await c.query(
      "INSERT INTO shaz_workout_drafts(user_id,day_id,data) VALUES($1,$2,$3) ON CONFLICT(user_id,day_id) DO UPDATE SET data=$3,revision=shaz_workout_drafts.revision+1,updated_at=now() RETURNING revision",
      [user, v.id, JSON.stringify({ sets: v.sets, timerEnd: v.timerEnd })],
    );
    return r.rows[0];
  });
}
