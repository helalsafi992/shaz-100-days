import type { Profile } from "./profile";
export const nutritionRule = {
  id: "energy-v2",
  version: 1,
  status: "review",
  minMale: 1800,
  minFemale: 1500,
  maxDeficit: 600,
  lowBmi: 20,
  highBmi: 35,
  maxDeficitHighLoad: 10,
  aggressiveDays: 7,
  maxAggressiveDays: 14,
  proteinPerKg: 1.2,
  fiber: 25,
  minFatPercent: 20,
  maxFatPercent: 40,
} as const;
export type NutritionPolicy = {
  [K in keyof typeof nutritionRule]: (typeof nutritionRule)[K] extends number
    ? number
    : string;
};
export const deficitLevels = [
  { id: "moderate", name: "Moderat", percent: 10 },
  { id: "high", name: "Meget", percent: 15 },
  { id: "higher", name: "Rigtig meget", percent: 20 },
  { id: "aggressive", name: "Aggressivt", percent: 25 },
] as const;
export function targetFromMaintenance(maintenance: number, percent: number) {
  return {
    maintenance: Math.round(maintenance),
    deficit: Math.round((maintenance * percent) / 100),
    target: Math.round(maintenance * (1 - percent / 100)),
    percent,
  };
}
export function estimate(
  p: Profile,
  date = new Date().toISOString().slice(0, 10),
  rule: NutritionPolicy = nutritionRule,
) {
  const unavailable = (explanation: string) => ({
    available: false as const,
    explanation,
    ruleVersion: rule.id + ":" + rule.version,
    reviewRequired: true,
  });
  if (
    p.nutrition !== "calculated" ||
    !p.age ||
    !p.height ||
    !p.weight ||
    !p.sex ||
    !p.activity
  )
    return unavailable(
      "Udfyld beregneren, eller brug portionsvejledning uden kaloriemål.",
    );
  if (
    p.age < 18 ||
    p.age > 64 ||
    !p.calculationSuitable ||
    p.pregnantOrBreastfeeding ||
    p.medicalNutrition ||
    p.eatingDisorderHistory ||
    !p.dataConsent
  )
    return unavailable(
      "Automatisk kalorievejledning er ikke egnet ud fra dine svar. Vælg portionsvejledning og få en individuel faglig vurdering.",
    );
  const bmi = p.weight / (p.height / 100) ** 2;
  if (bmi < 18.5 || bmi > rule.highBmi)
    return unavailable(
      "Denne generelle beregner understøtter ikke dit udgangspunkt. Vælg portionsvejledning og en individuel vurdering.",
    );
  const resting =
    10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "male" ? 5 : -161);
  // One factor covers everyday movement AND the customer's total training. No exercise calories are added.
  const everyday = { seated: 1.2, moving: 1.35, physical: 1.5 }[
    p.everydayActivity || "moving"
  ];
  const training = { light: 0.1, regular: 0.2, heavy: 0.3 }[
    p.trainingActivity || "regular"
  ];
  const factor =
    p.everydayActivity || p.trainingActivity
      ? Math.min(1.9, everyday + training)
      : { low: 1.4, moderate: 1.6, high: 1.8 }[p.activity];
  const maintenance = Math.round(resting * factor);
  const highLoad =
    p.trainingActivity === "heavy" ||
    p.activity === "high" ||
    p.days + (p.cardio?.days || 0) >= 6 ||
    p.days * p.minutes + (p.cardio?.days || 0) * (p.cardio?.minutes || 0) > 300;
  const minimum = p.sex === "male" ? rule.minMale : rule.minFemale;
  const options = deficitLevels.map((level) => {
    const calc = targetFromMaintenance(maintenance, level.percent);
    let reason = "";
    if (calc.target < minimum)
      reason = `Dette niveau ligger under testpolitikkens minimum på ${minimum} kcal. Vælg et mindre underskud eller vedligeholdelse.`;
    else if (calc.deficit > rule.maxDeficit)
      reason = `Underskuddet overstiger ${rule.maxDeficit} kcal om dagen. Vælg et mindre underskud.`;
    else if (bmi < rule.lowBmi && level.percent > 10)
      reason =
        "Ved lavere kropsvægt understøttes højst moderat underskud. Vedligeholdelse er et alternativ.";
    else if (highLoad && level.percent > rule.maxDeficitHighLoad)
      reason =
        "Din samlede træningsbelastning begrænser underskuddet til moderat. Vælg moderat eller vedligeholdelse.";
    else if (
      level.id === "aggressive" &&
      (!p.deficitReviewUntil ||
        date > p.deficitReviewUntil ||
        (p.aggressiveDaysUsed || 0) > rule.maxAggressiveDays)
    )
      reason =
        "Aggressivt kræver en særskilt 7-dages evaluering. Højst 14 dage i dette forløb. Vælg moderat eller vedligeholdelse, indtil du har vurderet dit forløb.";
    return { ...level, ...calc, allowed: !reason, reason };
  });
  const chosen = options.find((x) => x.id === (p.deficitLevel || "moderate"))!;
  const fatLoss = p.goal === "fat-loss";
  const surplus =
    p.goal === "muscle" ? Math.min(150, Math.round(maintenance * 0.05)) : 0;
  return {
    available: true as const,
    resting: Math.round(resting),
    factor,
    maintenance,
    minimum,
    highLoad,
    bmi: Math.round(bmi * 10) / 10,
    options,
    percent: fatLoss ? chosen.percent : surplus ? -5 : 0,
    deficit: fatLoss ? chosen.deficit : 0,
    surplus,
    target: fatLoss ? chosen.target : maintenance + surplus,
    allowed: !fatLoss || chosen.allowed,
    reason: fatLoss ? chosen.reason : "",
    protein: Math.ceil(p.weight * rule.proteinPerKg),
    fiber: rule.fiber,
    ruleVersion: rule.id + ":" + rule.version,
    reviewRequired: true,
    explanation:
      "Mifflin–St Jeor × én samlet aktivitetsfaktor. Hverdagsbevægelse og træning indgår allerede. Registreret cardio lægges ikke oveni. Et estimat, ikke en måling. Reglerne afprøves med fiktive profiler og afventer faglig godkendelse.",
  };
}
