// Practical cooking increments. These are product defaults pending content review,
// not minimum nutritional intakes. Exact rounded grams feed every nutrient total.
export const portionPolicyVersion = "practical-grams-v1";
const fine = new Set([
  "olive-oil",
  "oil",
  "chia",
  "almonds",
  "peanut",
  "lemon",
]);
export function portionStep(id: string, override?: number) {
  if (override !== undefined) return override;
  return id === "egg" ? 50 : fine.has(id) ? 1 : 5;
}
export function practicalGrams(id: string, grams: number, override?: number) {
  const step = portionStep(id, override);
  return Math.max(step, Math.round(grams / step) * step);
}
export function portionMeasure(id: string, grams: number) {
  return id === "egg" && grams % 50 === 0
    ? `ca. ${grams / 50} store æg; vej uden skal`
    : null;
}
export const eggMeasureSource =
  "https://www.nal.usda.gov/sites/default/files/page-files/Total%20Kcal.pdf";
