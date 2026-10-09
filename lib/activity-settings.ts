import type { Profile } from "./profile";

export type ActivitySettings = Pick<
  Profile,
  "activity" | "everydayActivity" | "trainingActivity"
>;
export function hasLegacyActivity(p: ActivitySettings) {
  return Boolean(p.activity && !p.everydayActivity && !p.trainingActivity);
}
// Opening an editor is not consent to migrate an existing energy assumption.
export function activitySettings(p: ActivitySettings): ActivitySettings {
  if (hasLegacyActivity(p)) return { activity: p.activity };
  return {
    activity: p.activity || "moderate",
    everydayActivity: p.everydayActivity || "moving",
    trainingActivity: p.trainingActivity || "regular",
  };
}
