import { db, schema } from "./db";
import { exercises, focuses } from "./training";
import { nutritionRule } from "./nutrition";
import { cardioRule } from "./cardio";
import { recipes } from "./recipes";
let ready: Promise<void> | undefined;
export function seedContent() {
  return (ready ??= (async () => {
    await schema();
    const entries = [
      { kind: "nutrition-rule", id: nutritionRule.id, data: nutritionRule },
      { kind: "cardio-rule", id: cardioRule.id, data: cardioRule },
      ...exercises.map((x) => ({ kind: "exercise", id: x.id, data: x })),
      ...recipes.map((x) => ({ kind: "recipe", id: x.id, data: x })),
      ...focuses.map((x, i) => ({
        kind: "focus",
        id: String(i + 1),
        data: { text: x },
      })),
      ...["home", "gym"].flatMap((place) =>
        ["beginner", "intermediate"].flatMap((level) =>
          [2, 3, 4].map((days) => ({
            kind: "template",
            id: `${place}-${level}-${days}`,
            data: {
              place,
              level,
              days,
              ruleVersion: "shaz-rules-1",
              description:
                days === 4
                  ? "Skiftevis overkrop og underkrop."
                  : "Helkrop med restitution mellem pas.",
              sets: level === "beginner" ? 2 : 3,
              min: 8,
              max: 12,
              rest: 90,
            },
          })),
        ),
      ),
      {
        kind: "help",
        id: "safety",
        data: {
          text: "Træn med kontrol og stop ved smerte, svimmelhed eller usædvanligt ubehag. Ved skader, graviditet eller sygdom: få en faglig vurdering før du følger programmet. Forløbet behandler ikke helbredsproblemer.",
        },
      },
    ];
    for (const e of entries)
      await db().query(
        "INSERT INTO shaz_content(kind,id,version,status,data) VALUES($1,$2,1,'review',$3) ON CONFLICT DO NOTHING",
        [e.kind, e.id, JSON.stringify(e.data)],
      );
  })().catch((e) => {
    ready = undefined;
    throw e;
  }));
}
export async function catalog(kind: string) {
  await seedContent();
  const result = await db().query(
    `SELECT DISTINCT ON(id) id,version,status,data FROM shaz_content WHERE kind=$1 AND ($2 OR status='published') ORDER BY id,version DESC`,
    [kind, process.env.STRIPE_MODE !== "live"],
  );
  return result.rows.map((r) => ({ ...r.data, id: r.id, version: r.version }));
}
