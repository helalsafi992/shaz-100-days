import { mealShopping, type MealDay } from "./meal-plan";

// Store layout only: never changes food data, allergens or nutritional values.
const categories = [
  {
    name: "Frugt & grønt",
    ids: [
      "tomato",
      "spinach",
      "broccoli",
      "carrot",
      "onion",
      "pepper",
      "cucumber",
      "apple",
      "banana",
      "blueberry",
      "strawberry",
      "lemon",
      "potato",
    ],
  },
  {
    name: "Køl, kød & fisk",
    ids: ["yogurt", "milk", "egg", "chicken", "salmon", "tofu"],
  },
  {
    name: "Brød & tørvarer",
    ids: ["bread", "oats", "rice", "pasta", "lentils"],
  },
  { name: "Konserves", ids: ["chickpeas", "beans", "canned-tomato", "tuna"] },
  { name: "Nødder, frø & olie", ids: ["almonds", "chia", "peanut", "oil"] },
];
export function shoppingGroups(days: MealDay[]) {
  const all = mealShopping(days);
  return [
    ...categories,
    {
      name: "Øvrige varer",
      ids: all
        .filter((i) => !categories.some((c) => c.ids.includes(i.id)))
        .map((i) => i.id),
    },
  ]
    .map((c) => ({
      name: c.name,
      items: all.filter((i) => c.ids.includes(i.id)),
    }))
    .filter((c) => c.items.length > 0);
}
export function displayMass(grams: number) {
  // No assumed grams-per-piece or density; stored grams are authoritative.
  return grams >= 1000
    ? `${(grams / 1000).toLocaleString("da-DK", { maximumFractionDigits: 3 })} kg`
    : `${grams} g`;
}
