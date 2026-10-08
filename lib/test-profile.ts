import { db, transaction } from "./db";
import { requireTestDatabase, testGrant } from "./test-environment";
import { defaults, localDate } from "./profile";
import { saveProfile, activate } from "./platform";
import { HttpError } from "./security";
export async function resetTestProfile(user: string, populated: boolean) {
  await requireTestDatabase();
  if (!(await testGrant(user)))
    throw new HttpError(403, "Kun den inviterede testkonto kan nulstilles.");
  await transaction(async (c) => {
    for (const table of [
      "shaz_workout_drafts",
      "shaz_cardio",
      "shaz_meal_days",
      "shaz_days",
      "shaz_meals",
      "shaz_weights",
      "shaz_checkins",
      "shaz_favorites",
      "shaz_shopping",
      "shaz_profile",
    ])
      await c.query(`DELETE FROM ${table} WHERE user_id=$1`, [user]);
  });
  if (populated) {
    const weekday = new Date(localDate() + "T12:00:00Z").getUTCDay();
    await saveProfile(
      user,
      {
        ...defaults,
        startDate: localDate(),
        nutrition: "calculated",
        goal: "fat-loss",
        mealCount: 4,
        deficitLevel: "moderate",
        cardio: {
          days: 2,
          weekdays: [(weekday + 1) % 7, (weekday + 5) % 7],
          minutes: 20,
          forms: ["walk", "cycle"],
          equipment: ["outdoors", "bike"],
          level: "beginner",
          intensity: "easy",
        },
        age: 30,
        height: 180,
        weight: 85,
        sex: "male",
        activity: "moderate",
        calculationSuitable: true,
        dataConsent: true,
        equipment: ["bodyweight", "dumbbells", "band"],
        weekdays: [weekday, (weekday + 2) % 7, (weekday + 4) % 7],
      },
      7,
    );
    await activate(user);
  }
}
