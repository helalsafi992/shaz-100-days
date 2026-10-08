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
      ...["home", "gym", "both"].flatMap((place) =>
        ["beginner", "intermediate", "experienced"].flatMap((level) =>
          [0, 1, 2, 3, 4].map((days) => ({
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
    await db().query(
      "INSERT INTO shaz_content(kind,id,version,status,data) SELECT kind,id,CASE WHEN kind IN ('exercise','template') THEN 2 ELSE 1 END,'review',data FROM jsonb_to_recordset($1::jsonb) AS item(kind text,id text,data jsonb) ON CONFLICT DO NOTHING",
      [JSON.stringify(entries)],
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
