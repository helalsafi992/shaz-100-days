import data from "./data/ingredients.json";
export const ingredients = data;
export type Ingredient = (typeof ingredients)[number];
export type Recipe = {
  id: string;
  name: string;
  category: "breakfast" | "lunch" | "dinner" | "snack";
  minutes: number;
  servings: number;
  ingredients: { id: string; grams: number }[];
  steps: string[];
  version: number;
  portionMin?: number;
  portionMax?: number;
  maxGrams?: number;
  image?: string;
};
const r = (
  id: string,
  name: string,
  category: Recipe["category"],
  minutes: number,
  servings: number,
  items: [string, number][],
  steps: string[],
): Recipe => ({
  id,
  name,
  category,
  minutes,
  servings,
  ingredients: items.map(([id, grams]) => ({ id, grams })),
  steps,
  version: 1,
});
export const recipes: Recipe[] = [
  r(
    "berry-oats",
    "Overnight oats med blåbær",
    "breakfast",
    10,
    2,
    [
      ["oats", 100],
      ["milk", 250],
      ["yogurt", 200],
      ["blueberry", 150],
      ["chia", 15],
    ],
    [
      "Rør havregryn, mælk, yoghurt og chia sammen i to bøtter.",
      "Sæt på køl i mindst 4 timer; de 10 minutter er aktiv tid.",
      "Fordel skyllede blåbær over inden servering. Spis inden for 2 døgn.",
    ],
  ),
  r(
    "banana-porridge",
    "Varm banangrød med peanutbutter",
    "breakfast",
    12,
    1,
    [
      ["oats", 60],
      ["milk", 200],
      ["banana", 100],
      ["peanut", 15],
    ],
    [
      "Kom havregryn, mælk og 100 g vand i en gryde.",
      "Kog forsigtigt 5–7 minutter under omrøring. Mos halvdelen af bananen i.",
      "Servér med resten af bananen i skiver og peanutbutter.",
    ],
  ),
  r(
    "apple-oats",
    "Æblegrød med mandler",
    "breakfast",
    15,
    1,
    [
      ["oats", 60],
      ["milk", 200],
      ["apple", 150],
      ["almonds", 15],
    ],
    [
      "Skær æblet i små tern uden kernehus.",
      "Kog gryn, mælk, 100 g vand og halvdelen af æblet 7–8 minutter.",
      "Top med resten af æblet og hakkede mandler.",
    ],
  ),
  r(
    "egg-toast",
    "Æg på fuldkornsbrød",
    "breakfast",
    15,
    1,
    [
      ["egg", 100],
      ["bread", 80],
      ["tomato", 120],
      ["oil", 5],
    ],
    [
      "Rist brødet. Skær tomaten i skiver.",
      "Pisk æggene og varm olien på en pande.",
      "Rør æggene ved moderat varme til de er gennemtilberedte. Læg på brødet med tomat.",
    ],
  ),
  r(
    "yogurt-bowl",
    "Yoghurt med bær og sprød havre",
    "breakfast",
    10,
    1,
    [
      ["yogurt", 250],
      ["oats", 35],
      ["strawberry", 150],
      ["almonds", 15],
    ],
    [
      "Rist gryn og hakkede mandler 3 minutter på en tør pande under omrøring. Lad køle.",
      "Skyl jordbærrene og skær dem i mindre stykker.",
      "Kom yoghurt i en skål og fordel bær og havreblanding over.",
    ],
  ),
  r(
    "tofu-breakfast",
    "Tofuscramble med spinat",
    "breakfast",
    15,
    2,
    [
      ["tofu", 250],
      ["spinach", 100],
      ["tomato", 200],
      ["bread", 120],
      ["oil", 10],
    ],
    [
      "Dup tofuen tør og smuldr den. Skyl og hak grøntsagerne.",
      "Varm olie og steg tofu 4–5 minutter. Tilsæt tomat og spinat.",
      "Steg yderligere 3 minutter og servér med ristet brød.",
    ],
  ),
  r(
    "banana-pancake",
    "Bananpandekager med yoghurt",
    "breakfast",
    20,
    2,
    [
      ["banana", 200],
      ["egg", 100],
      ["oats", 80],
      ["yogurt", 150],
      ["oil", 8],
    ],
    [
      "Blend havregryn fint. Mos banan og rør med gryn og æg.",
      "Varm lidt olie ad gangen på en pande. Steg små pandekager 2–3 minutter pr. side.",
      "Kontrollér at midten er gennemtilberedt. Servér med yoghurt.",
    ],
  ),
  r(
    "chia-berry",
    "Chiagrød med jordbær",
    "breakfast",
    10,
    2,
    [
      ["chia", 40],
      ["milk", 300],
      ["yogurt", 200],
      ["strawberry", 200],
      ["oats", 40],
    ],
    [
      "Rør chia, mælk og havre grundigt sammen. Vent 10 minutter og rør igen.",
      "Sæt på køl mindst 4 timer; 10 minutter er aktiv tid.",
      "Rør yoghurt i og top med jordbær. Spis inden for 2 døgn.",
    ],
  ),
  r(
    "chickpea-salad",
    "Kikærtesalat med sprøde grøntsager",
    "lunch",
    15,
    2,
    [
      ["chickpeas", 300],
      ["cucumber", 200],
      ["tomato", 250],
      ["pepper", 150],
      ["oil", 15],
      ["lemon", 30],
      ["bread", 100],
    ],
    [
      "Skyl og dræn kikærterne. Skær grøntsagerne i tern.",
      "Vend kikærter og grøntsager med olie og citronsaft.",
      "Servér med fuldkornsbrød. Gem en eventuel ekstra portion på køl.",
    ],
  ),
  r(
    "tuna-sandwich",
    "Tunsandwich med yoghurtdressing",
    "lunch",
    10,
    2,
    [
      ["tuna", 200],
      ["yogurt", 80],
      ["bread", 180],
      ["cucumber", 150],
      ["lemon", 15],
    ],
    [
      "Dræn tunen og rør den med yoghurt og citronsaft.",
      "Skær agurken tyndt.",
      "Fordel tun og agurk i brødet. Spis straks eller opbevar køligt til samme dag.",
    ],
  ),
  r(
    "chicken-rice",
    "Kyllingebowl med brune ris",
    "lunch",
    35,
    2,
    [
      ["chicken", 300],
      ["rice", 140],
      ["broccoli", 300],
      ["carrot", 150],
      ["oil", 15],
      ["lemon", 20],
    ],
    [
      "Kog risene efter pakkens anvisning.",
      "Skær kyllingen i tern på et separat bræt og steg i olien til gennemtilberedt, mindst 75 °C i midten.",
      "Damp broccoli og gulerødder 5–7 minutter. Fordel med ris og kylling og dryp citronsaft over.",
    ],
  ),
  r(
    "lentil-soup",
    "Linse- og tomatsuppe",
    "lunch",
    30,
    3,
    [
      ["lentils", 180],
      ["canned-tomato", 400],
      ["carrot", 200],
      ["onion", 100],
      ["oil", 15],
      ["bread", 150],
    ],
    [
      "Hak løg og gulerod. Svits dem i olien 4 minutter.",
      "Skyl linserne. Tilsæt linser, tomat og 700 g vand.",
      "Simr til linserne er helt møre, cirka 20–25 minutter. Justér vand og servér med brød.",
    ],
  ),
  r(
    "egg-salad",
    "Æggesalat på fuldkornsbrød",
    "lunch",
    20,
    2,
    [
      ["egg", 200],
      ["yogurt", 100],
      ["cucumber", 150],
      ["bread", 160],
      ["lemon", 10],
    ],
    [
      "Kog æggene cirka 9–10 minutter, afkøl og pil dem. Ingrediensvægten er uden skal.",
      "Hak æggene og bland med yoghurt og citronsaft.",
      "Fordel på brødet og læg agurkeskiver ved. Opbevar koldt.",
    ],
  ),
  r(
    "tofu-rice",
    "Tofubowl med broccoli",
    "lunch",
    35,
    2,
    [
      ["tofu", 300],
      ["rice", 140],
      ["broccoli", 250],
      ["pepper", 150],
      ["oil", 15],
      ["lemon", 25],
    ],
    [
      "Kog risene efter pakken. Dup tofu tør og skær i tern.",
      "Steg tofu i halvdelen af olien 8–10 minutter.",
      "Steg grøntsagerne i resten af olien 5–7 minutter, bland med ris og tofu og tilsæt citron.",
    ],
  ),
  r(
    "bean-toast",
    "Bønner på toast med tomat",
    "lunch",
    15,
    2,
    [
      ["beans", 300],
      ["canned-tomato", 250],
      ["bread", 160],
      ["onion", 60],
      ["oil", 10],
    ],
    [
      "Skyl og dræn bønnerne. Hak løget.",
      "Svits løget i olie 3 minutter. Tilsæt bønner og tomat og varm igennem 6 minutter.",
      "Rist brødet og fordel bønneblandingen på det.",
    ],
  ),
  r(
    "pasta-tuna",
    "Fuldkornspastasalat med tun",
    "lunch",
    25,
    2,
    [
      ["pasta", 150],
      ["tuna", 180],
      ["cucumber", 200],
      ["tomato", 200],
      ["oil", 15],
      ["lemon", 25],
    ],
    [
      "Kog pastaen efter pakken og køl hurtigt af under koldt vand.",
      "Dræn tunen og skær grøntsagerne i tern.",
      "Vend alt med olie og citron. Hold på køl frem til servering.",
    ],
  ),
  r(
    "salmon-tray",
    "Ovnlaks med kartofler og broccoli",
    "dinner",
    40,
    2,
    [
      ["salmon", 300],
      ["potato", 500],
      ["broccoli", 300],
      ["oil", 15],
      ["lemon", 30],
    ],
    [
      "Varm ovnen til 200 °C. Skær kartofler i både, vend med olie og bag 20 minutter.",
      "Læg broccoli og laks i fadet. Bag yderligere 12–18 minutter, til fisken er gennemtilberedt.",
      "Dryp citronsaft over. Tjek kartoflerne med en gaffel.",
    ],
  ),
  r(
    "chicken-tomato",
    "Kylling i tomat med fuldkornspasta",
    "dinner",
    30,
    3,
    [
      ["chicken", 450],
      ["pasta", 225],
      ["canned-tomato", 400],
      ["onion", 100],
      ["spinach", 150],
      ["oil", 15],
    ],
    [
      "Kog pasta efter pakken. Skær kylling og løg på hver sit bræt.",
      "Steg løg og kylling i olien, tilsæt tomat og simr 12–15 minutter.",
      "Tjek kyllingen er mindst 75 °C i midten. Vend spinaten i og servér med pasta.",
    ],
  ),
  r(
    "bean-chili",
    "Mild bønnegryde med ris",
    "dinner",
    35,
    3,
    [
      ["beans", 450],
      ["rice", 210],
      ["canned-tomato", 400],
      ["pepper", 250],
      ["onion", 100],
      ["oil", 15],
    ],
    [
      "Kog ris efter pakken. Skyl og dræn bønnerne.",
      "Hak løg og peberfrugt og svits i olien 5 minutter.",
      "Tilsæt tomat, bønner og 100 g vand. Simr 15–20 minutter og servér med ris.",
    ],
  ),
  r(
    "lentil-bolognese",
    "Linsebolognese",
    "dinner",
    40,
    4,
    [
      ["lentils", 240],
      ["pasta", 280],
      ["canned-tomato", 600],
      ["carrot", 250],
      ["onion", 150],
      ["oil", 20],
    ],
    [
      "Hak løg og riv gulerødder. Svits i olien.",
      "Skyl linser, og tilsæt dem sammen med tomat og 600 g vand. Simr 25–30 minutter til møre; tilføj vand ved behov.",
      "Kog pasta efter pakken og servér med saucen.",
    ],
  ),
  r(
    "tofu-potato",
    "Sprød tofu med ovngrønt",
    "dinner",
    40,
    2,
    [
      ["tofu", 300],
      ["potato", 400],
      ["carrot", 250],
      ["broccoli", 200],
      ["oil", 20],
      ["yogurt", 100],
      ["lemon", 20],
    ],
    [
      "Varm ovnen til 200 °C. Skær kartofler og gulerødder i små stykker. Vend med halvdelen af olien og bag 15 minutter.",
      "Dup tofu tør. Vend tofu og broccoli med resten af olien, tilsæt til fadet og bag 20 minutter mere.",
      "Rør yoghurt med citronsaft og servér som dip.",
    ],
  ),
  r(
    "chickpea-stew",
    "Kikærtegryde med spinat",
    "dinner",
    25,
    3,
    [
      ["chickpeas", 450],
      ["canned-tomato", 400],
      ["spinach", 200],
      ["onion", 100],
      ["oil", 15],
      ["bread", 210],
    ],
    [
      "Skyl og dræn kikærter. Hak løget og svits i olien 4 minutter.",
      "Tilsæt tomat, kikærter og 100 g vand. Simr 12 minutter.",
      "Vend spinaten i, varm igennem og servér med brød.",
    ],
  ),
  r(
    "vegetable-frittata",
    "Grøntsagsfrittata med kartofler",
    "dinner",
    35,
    3,
    [
      ["egg", 300],
      ["potato", 450],
      ["pepper", 200],
      ["spinach", 100],
      ["milk", 100],
      ["oil", 15],
    ],
    [
      "Skær kartofler i små tern og kog dem møre. Varm ovnen til 190 °C.",
      "Vend kartofler og hakket grønt i et ovnfast fad smurt med olien.",
      "Pisk æg og mælk sammen, hæld over og bag 20–25 minutter til helt fast i midten.",
    ],
  ),
  r(
    "chicken-tray",
    "Citronkylling med ovngrønt",
    "dinner",
    40,
    3,
    [
      ["chicken", 450],
      ["potato", 600],
      ["carrot", 300],
      ["onion", 150],
      ["oil", 20],
      ["lemon", 40],
    ],
    [
      "Varm ovnen til 200 °C. Skær kartofler, gulerødder og løg i små stykker.",
      "Vend grøntsager med olie, læg i et fad og bag 15 minutter.",
      "Tilføj kylling og citron. Bag cirka 20–25 minutter mere til kyllingen er mindst 75 °C i midten.",
    ],
  ),
  r(
    "apple-dip",
    "Æblebåde med yoghurtdip",
    "snack",
    5,
    1,
    [
      ["apple", 150],
      ["yogurt", 150],
      ["peanut", 10],
    ],
    [
      "Skyl æblet, fjern kernehuset og skær i både.",
      "Rør peanutbutter i yoghurten.",
      "Servér æblebådene med dippen.",
    ],
  ),
  r(
    "banana-yogurt",
    "Banan-yoghurtskål med mandler",
    "snack",
    5,
    1,
    [
      ["banana", 100],
      ["yogurt", 170],
      ["almonds", 10],
    ],
    [
      "Kom yoghurt i en skål.",
      "Skær bananen i skiver og hak mandlerne.",
      "Fordel banan og mandler over yoghurten.",
    ],
  ),
  r(
    "hummus",
    "Kikærtedip med gulerødder",
    "snack",
    15,
    3,
    [
      ["chickpeas", 240],
      ["oil", 15],
      ["lemon", 30],
      ["carrot", 300],
    ],
    [
      "Skyl og dræn kikærterne.",
      "Blend med olie, citron og 40–60 g vand til en cremet dip.",
      "Skræl gulerødder og skær i stave. Opbevar dippen på køl og spis inden for 2 døgn.",
    ],
  ),
  r(
    "berry-smoothie",
    "Jordbærsmoothie med havre",
    "snack",
    5,
    2,
    [
      ["strawberry", 250],
      ["banana", 100],
      ["milk", 250],
      ["yogurt", 150],
      ["oats", 30],
    ],
    [
      "Skyl jordbær og pil bananen.",
      "Blend frugt, mælk, yoghurt og havre til jævn konsistens.",
      "Tilsæt lidt vand ved behov og servér straks.",
    ],
  ),
  r(
    "egg-crunch",
    "Kogt æg med grønt og brød",
    "snack",
    15,
    1,
    [
      ["egg", 50],
      ["bread", 40],
      ["cucumber", 100],
      ["tomato", 100],
    ],
    [
      "Kog ægget i cirka 9 minutter og afkøl i koldt vand.",
      "Skær agurk og tomat i mundrette stykker.",
      "Pil ægget og servér med brød og grøntsager.",
    ],
  ),
  r(
    "berry-yogurt",
    "Yoghurt med blåbær og chia",
    "snack",
    5,
    1,
    [
      ["yogurt", 170],
      ["blueberry", 100],
      ["chia", 10],
    ],
    [
      "Skyl blåbærrene.",
      "Rør chia i yoghurten. Lad stå 10 minutter, hvis du foretrækker bløde frø.",
      "Top med bærrene og servér.",
    ],
  ),
  r(
    "apple-bircher",
    "Bircher med æble, yoghurt og peanut",
    "breakfast",
    10,
    1,
    [
      ["oats", 90],
      ["yogurt", 220],
      ["apple", 100],
      ["peanut", 25],
      ["chia", 10],
    ],
    [
      "Riv det vaskede æble groft uden kernehus.",
      "Rør havre, yoghurt, æble, peanutbutter og chia med 100 g vand.",
      "Sæt på køl mindst fire timer. Spis inden for to døgn. Aktiv tilberedning er 10 minutter.",
    ],
  ),
  r(
    "berry-crunch-meal",
    "Sprød havreskål med bær og mandler",
    "breakfast",
    15,
    1,
    [
      ["oats", 90],
      ["yogurt", 240],
      ["blueberry", 80],
      ["almonds", 25],
      ["chia", 10],
    ],
    [
      "Rist havre og hakkede mandler på en tør pande i 4 minutter. Rør ofte og lad køle.",
      "Rør chia i yoghurt med lidt vand, og skyl bærrene.",
      "Fordel den sprøde blanding og blåbærrene over yoghurten. Servér straks.",
    ],
  ),
  r(
    "banana-oat-bake",
    "Bagt bananhavre med yoghurt",
    "breakfast",
    30,
    1,
    [
      ["oats", 85],
      ["egg", 50],
      ["banana", 90],
      ["yogurt", 180],
      ["peanut", 20],
      ["chia", 8],
    ],
    [
      "Tænd ovnen på 180 grader. Mos banan og pisk med æg, peanutbutter, havre, chia og 80 g vand.",
      "Hæld i en lille ovnfast form og bag cirka 20 minutter, til ægget er gennemtilberedt og midten fast.",
      "Servér med kold yoghurt. Tilberedningstiden øges ved større forme.",
    ],
  ),
  r(
    "tofu-peanut-pasta",
    "Fuldkornspasta med tofu og peanut",
    "dinner",
    25,
    1,
    [
      ["pasta", 90],
      ["tofu", 180],
      ["pepper", 90],
      ["spinach", 40],
      ["peanut", 15],
      ["oil", 5],
      ["lemon", 10],
    ],
    [
      "Kog fuldkornspasta efter pakkens anvisning. Gem lidt kogevand.",
      "Skær tofu og peberfrugt i tern. Steg i olien i 6–8 minutter og vend spinat i.",
      "Rør peanutbutter og citron med lidt pastavand til sauce. Vend med pasta, tofu og grønt og varm igennem.",
    ],
  ),
  r(
    "bean-egg-toast",
    "Bønnetoast med æg og tomat",
    "lunch",
    15,
    1,
    [
      ["bread", 120],
      ["beans", 140],
      ["egg", 100],
      ["tomato", 100],
      ["oil", 7],
    ],
    [
      "Skyl og dræn bønnerne. Mos halvdelen groft og varm alle bønnerne med hakket tomat i en lille gryde.",
      "Steg æggene i olien, til de er gennemtilberedte, og rist brødet.",
      "Fordel bønner og æg på brødet. Salt og krydderier efter smag er ikke medregnet.",
    ],
  ),
  r(
    "tofu-bean-sandwich",
    "Lun sandwich med tofu og bønner",
    "lunch",
    15,
    1,
    [
      ["bread", 120],
      ["tofu", 140],
      ["beans", 100],
      ["tomato", 80],
      ["spinach", 30],
      ["oil", 7],
      ["lemon", 10],
    ],
    [
      "Dup tofu tør og skær i skiver. Steg i olien i 3 minutter på hver side.",
      "Skyl og dræn bønner, mos med citron og lidt vand. Skyl grøntsagerne.",
      "Rist brødet og fyld med bønnecreme, varm tofu, tomat og spinat.",
    ],
  ),
  r(
    "chicken-peanut-bowl",
    "Kyllingebowl med ris og peanut",
    "dinner",
    40,
    1,
    [
      ["rice", 90],
      ["chicken", 160],
      ["broccoli", 130],
      ["carrot", 70],
      ["peanut", 20],
      ["oil", 7],
      ["lemon", 10],
    ],
    [
      "Kog brune ris efter pakkens anvisning. Damp broccolibuketter og gulerodsstykker de sidste 5 minutter.",
      "Skær kylling i strimler og steg i olie, til den er gennemtilberedt. Følg lokale fødevaresikkerhedsråd for fjerkræ.",
      "Rør peanutbutter og citron med varmt vand. Fordel ris, grønt og kylling i en skål og hæld saucen over.",
    ],
  ),
  r(
    "lentil-tofu-pot",
    "Linsegryde med tofu og fuldkornsbrød",
    "dinner",
    35,
    1,
    [
      ["lentils", 65],
      ["tofu", 140],
      ["canned-tomato", 160],
      ["carrot", 60],
      ["bread", 60],
      ["oil", 10],
    ],
    [
      "Skyl linser og kog efter pakkens anvisning, til de er møre.",
      "Skær gulerod og tofu i tern. Steg kort i olie og tilsæt tomat samt lidt vand. Lad simre til guleroden er mør.",
      "Vend de kogte linser i, varm grundigt og servér med fuldkornsbrød.",
    ],
  ),
];
export function nutrients(recipe: Recipe, servings = 1) {
  const sums = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const item of recipe.ingredients) {
    const food = ingredients.find((x) => x.id === item.id);
    if (!food) throw new Error("Unknown ingredient");
    for (const k of Object.keys(sums) as (keyof typeof sums)[])
      sums[k] +=
        ((food.per100g[k] * item.grams) / 100 / recipe.servings) * servings;
  }
  return Object.fromEntries(
    Object.entries(sums).map(([k, v]) => [k, Math.round(v * 10) / 10]),
  ) as typeof sums;
}
export function suitable(
  recipe: Recipe,
  diet: string,
  avoid: string[],
  minutes = 60,
) {
  return (
    recipe.minutes <= minutes &&
    recipe.ingredients.every((i) => {
      const f = ingredients.find((f) => f.id === i.id);
      return (
        f &&
        !avoid.includes(f.id) &&
        !f.allergens.some((a) => avoid.includes(a)) &&
        (diet !== "vegetarian" || f.vegetarian) &&
        (diet !== "halal" || f.halal)
      );
    })
  );
}
export function shoppingList(meals: { recipe: Recipe; servings: number }[]) {
  const map = new Map<string, number>();
  for (const m of meals)
    for (const i of m.recipe.ingredients)
      map.set(
        i.id,
        (map.get(i.id) || 0) +
          (i.grams / m.recipe.servings) * Number(m.servings),
      );
  return [...map]
    .map(([id, grams]) => ({
      ...ingredients.find((i) => i.id === id)!,
      grams: Math.round(grams),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "da"));
}
