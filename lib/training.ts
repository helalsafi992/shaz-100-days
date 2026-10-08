import type { Profile } from "./profile";
import { addDays } from "./profile";
export type Exercise = {
  id: string;
  name: string;
  pattern: string;
  equipment: string[];
  instructions: string[];
  cue: string;
  videoId?: string;
  version: number;
};
const x = (
  id: string,
  name: string,
  pattern: string,
  equipment: string[],
  instructions: string[],
  cue: string,
): Exercise => ({
  id,
  name,
  pattern,
  equipment,
  instructions,
  cue,
  version: 1,
});
export const exercises: Exercise[] = [
  x(
    "chair-squat",
    "Rejs dig fra en stol",
    "squat",
    ["bodyweight"],
    [
      "Stil en stabil stol mod en væg. Sæt fødderne i hoftebredde.",
      "Læn overkroppen let frem, pres gennem fødderne og rejs dig.",
      "Sæt dig langsomt ned igen med knæene i samme retning som tæerne.",
    ],
    "Brug hænderne let som støtte ved behov.",
  ),
  x(
    "squat",
    "Kropsvægtssquat",
    "squat",
    ["bodyweight"],
    [
      "Stå med fødderne i en behagelig bredde.",
      "Bøj knæ og hofter, som om du vil sætte dig.",
      "Pres gulvet væk og rejs dig i et roligt tempo.",
    ],
    "Stop i den dybde, du kan kontrollere.",
  ),
  x(
    "goblet-squat",
    "Goblet squat",
    "squat",
    ["dumbbells"],
    [
      "Hold én håndvægt tæt foran brystet.",
      "Sæt dig roligt ned mellem fødderne, og hold hælene i gulvet.",
      "Rejs dig med knæene i samme retning som tæerne.",
    ],
    "Vælg en vægt, der ikke trækker dig forover.",
  ),
  x(
    "leg-press",
    "Benpres",
    "squat",
    ["machines"],
    [
      "Indstil sædet, og sæt fødderne midt på pladen.",
      "Sænk vægten kontrolleret, mens ryg og bækken bliver i sædet.",
      "Pres tilbage uden at låse knæene hårdt.",
    ],
    "Start let; få hjælp til maskinens indstilling.",
  ),
  x(
    "wall-push",
    "Armbøjning mod væg",
    "push",
    ["bodyweight"],
    [
      "Sæt hænderne på væggen lidt bredere end skuldrene.",
      "Hold kroppen i en lige linje, og bøj albuerne roligt.",
      "Skub dig tilbage. Flyt fødderne tættere på væggen for en lettere variant.",
    ],
    "Lad albuerne pege skråt bagud.",
  ),
  x(
    "knee-push",
    "Armbøjning på knæ",
    "push",
    ["bodyweight"],
    [
      "Støt på hænder og knæ med en lige linje fra knæ til hoved.",
      "Sænk brystet kontrolleret mod gulvet.",
      "Pres op uden at lade lænden hænge.",
    ],
    "Forkort bevægelsen, hvis du mister kontrollen.",
  ),
  x(
    "floor-press",
    "Gulvpres med håndvægte",
    "push",
    ["dumbbells"],
    [
      "Læg dig på ryggen med bøjede knæ og vægte over brystet.",
      "Sænk, til overarmene let rører gulvet.",
      "Pres op med håndleddene over albuerne.",
    ],
    "Hold albuerne skråt ind mod kroppen.",
  ),
  x(
    "chest-press",
    "Brystpres i maskine",
    "push",
    ["machines"],
    [
      "Indstil grebene i brysthøjde og hold fødderne i gulvet.",
      "Pres frem uden at løfte skuldrene.",
      "Før roligt tilbage til en behagelig dybde.",
    ],
    "Undgå at svaje for at flytte vægten.",
  ),
  x(
    "prone-w",
    "Liggende W-løft",
    "pull",
    ["bodyweight"],
    [
      "Lig på maven med panden mod et foldet håndklæde.",
      "Bøj armene til et W, og løft hænder/albuer ganske lidt.",
      "Sænk roligt igen uden at løfte hovedet.",
    ],
    "En let øvelse for skulderkontrol; begrænset erstatning for belastet roning.",
  ),
  x(
    "band-row",
    "Roning med elastik",
    "pull",
    ["band"],
    [
      "Sid med let bøjede knæ og elastikken sikkert rundt om fødderne med sko.",
      "Træk albuerne bagud uden at læne overkroppen.",
      "Før armene frem under kontrol.",
    ],
    "Kontrollér elastikken for skader og sikkert greb før start.",
  ),
  x(
    "db-row",
    "Enarmsroning",
    "pull",
    ["dumbbells"],
    [
      "Støt den frie hånd på et stabilt bord eller en bænk.",
      "Hold ryggen rolig, og træk vægten mod hoften.",
      "Sænk under kontrol. Gentag på begge sider.",
    ],
    "Undgå at dreje kroppen for at få vægten op.",
  ),
  x(
    "cable-row",
    "Siddende kabelroning",
    "pull",
    ["machines"],
    [
      "Sid stabilt med bløde knæ og lang ryg.",
      "Træk grebet mod den nederste del af brystkassen.",
      "Før roligt frem uden at runde lænden kraftigt.",
    ],
    "Bevæg albuerne; hold overkroppen næsten stille.",
  ),
  x(
    "bridge",
    "Hoftebro",
    "hinge",
    ["bodyweight"],
    [
      "Lig på ryggen, bøj knæene, og sæt fødderne i gulvet.",
      "Løft hoften, til kroppen danner en linje fra skuldre til knæ.",
      "Sænk roligt igen.",
    ],
    "Stop før du overstrækker lænden.",
  ),
  x(
    "hip-hinge",
    "Hoftebøjning uden vægt",
    "hinge",
    ["bodyweight"],
    [
      "Stå med bløde knæ og hænderne på hofterne.",
      "Skub hoften bagud, mens ryggen holder sin naturlige position.",
      "Pres fødderne ned og rejs dig.",
    ],
    "Øv bevægelsen roligt før du tilføjer belastning.",
  ),
  x(
    "db-rdl",
    "Rumænsk dødløft med håndvægte",
    "hinge",
    ["dumbbells"],
    [
      "Hold vægtene tæt foran lårene med let bøjede knæ.",
      "Skub hoften bagud, og før vægtene tæt langs benene.",
      "Stop ved et kontrolleret stræk i baglårene og rejs dig.",
    ],
    "Ingen pligt til at nå gulvet.",
  ),
  x(
    "leg-curl",
    "Siddende lårcurl",
    "hinge",
    ["machines"],
    [
      "Indstil maskinens drejepunkt ved knæene.",
      "Bøj knæene og træk puden ned uden at løfte hoften.",
      "Før langsomt tilbage.",
    ],
    "Brug en vægt, der tillader en rolig tilbageføring.",
  ),
  x(
    "split-squat",
    "Støttet split squat",
    "single",
    ["bodyweight"],
    [
      "Stå i skridtstilling ved en stabil støtte.",
      "Bøj begge knæ og sænk dig lodret.",
      "Pres op gennem forreste fod og gentag på begge sider.",
    ],
    "Brug støtten til balance, ikke til at trække dig op.",
  ),
  x(
    "db-split",
    "Split squat med håndvægte",
    "single",
    ["dumbbells"],
    [
      "Hold en let håndvægt i hver hånd og stå i skridtstilling.",
      "Sænk dig lodret, til du når en kontrolleret dybde.",
      "Rejs dig og gentag på begge sider.",
    ],
    "Start med kropsvægt, hvis balancen begrænser dig.",
  ),
  x(
    "calf",
    "Stående lægløft",
    "calf",
    ["bodyweight"],
    [
      "Stå ved en stabil støtte med vægten fordelt på begge fødder.",
      "Løft hælene roligt så højt som behageligt.",
      "Sænk hælene helt ned.",
    ],
    "Undgå at vippe ud på fodens yderside.",
  ),
  x(
    "deadbug",
    "Dead bug",
    "core",
    ["bodyweight"],
    [
      "Lig på ryggen med bøjede hofter og knæ.",
      "Sænk modsatte arm og ben langsomt mod gulvet.",
      "Kom tilbage og skift side. Hold ryggen rolig.",
    ],
    "Gør bevægelsen kortere, hvis lænden løfter sig.",
  ),
  x(
    "bird-dog",
    "Bird dog",
    "core",
    ["bodyweight"],
    [
      "Stå på alle fire med hænder under skuldre.",
      "Stræk modsatte arm og ben uden at dreje bækkenet.",
      "Sæt tilbage og skift side.",
    ],
    "Ræk langt frem og tilbage; løft ikke højt.",
  ),
  x(
    "side-plank",
    "Sideplanke på knæ",
    "core",
    ["bodyweight"],
    [
      "Lig på siden med albuen under skulderen og bøjede knæ.",
      "Løft hoften og hold en rolig linje gennem overkroppen.",
      "Sænk roligt og gentag på den anden side.",
    ],
    "En gentagelse er et roligt løft; hold 2 sekunder i toppen.",
  ),
  x(
    "db-shoulder",
    "Skulderpres med håndvægte",
    "shoulder",
    ["dumbbells"],
    [
      "Sid oprejst med vægtene ved skuldrene.",
      "Pres op i en behagelig bane uden at svaje.",
      "Sænk langsomt til start.",
    ],
    "Brug let belastning og en smertefri bevægelse.",
  ),
  x(
    "wall-slide",
    "Armløft mod væg",
    "shoulder",
    ["bodyweight"],
    [
      "Stå med ryggen mod væggen uden at presse lænden flad.",
      "Før armene roligt op i en behagelig bevægelse.",
      "Sænk igen uden at løfte skuldrene mod ørerne.",
    ],
    "Mobilitets- og kontroløvelse, ikke et tungt pres.",
  ),
  x(
    "lat-pull",
    "Nedtræk",
    "pull",
    ["machines"],
    [
      "Sæt lårpuden, så du sidder stabilt.",
      "Træk grebet mod øverste bryst uden at rykke.",
      "Før langsomt op igen.",
    ],
    "Træk foran kroppen, aldrig bag nakken.",
  ),
];
export const focuses = [
  "Find to faste tidspunkter og lær bevægelserne.",
  "Gentag roligt. Skriv dine første sæt ned.",
  "Vælg en belastning, du kan styre fra start til slut.",
  "Gør plads til søvn og restitution mellem passene.",
  "Forbered to måltider, du kan lide.",
  "Se efter bedre kontrol før mere vægt.",
  "Sammenlign med dine egne tidligere registreringer.",
  "Hold rytmen enkel, også i en travl uge.",
  "Overvej en lille fremgang, hvis de sidste to pas var overskuelige.",
  "Gentag de vaner, der fungerer for dig.",
  "En kort træning er også en træning.",
  "Planlæg indkøb og træning sammen.",
  "Se tilbage på din faktiske gennemførelse.",
  "Vælg de vaner, du vil fortsætte med.",
  "Gør status. Et afsluttet forløb er begyndelsen på næste rutine.",
];
export function phase(day: number) {
  return day <= 14
    ? "Fundament"
    : day <= 35
      ? "Opbygning"
      : day <= 65
        ? "Progression"
        : day <= 85
          ? "Konsistens"
          : "Status & næste skridt";
}
export type PlannedExercise = Exercise & {
  sets: number;
  min: number;
  max: number;
  rest: number;
  intensity: string;
};
export type DayPlan = {
  day: number;
  date: string;
  week: number;
  phase: string;
  focus: string;
  kind: "workout" | "rest" | "finish";
  title: string;
  minutes: number;
  warmup: string[];
  exercises: PlannedExercise[];
  archivedExercises?: PlannedExercise[];
  removedExercises?: PlannedExercise[];
  ruleVersion: string;
  profileVersion: number;
};
export function alternatives(e: Exercise, p: Profile, catalog = exercises) {
  return catalog.filter(
    (x) =>
      x.id !== e.id &&
      !(p.exerciseAvoid || []).includes(x.id) &&
      x.pattern === e.pattern &&
      x.equipment.every(
        (eq) =>
          p.equipment.includes(eq as Profile["equipment"][number]) ||
          eq === "bodyweight",
      ),
  );
}
function choose(
  pattern: string,
  p: Profile,
  index: number,
  catalog: Exercise[],
) {
  const options = catalog.filter(
    (e) =>
      e.pattern === pattern &&
      !(p.exerciseAvoid || []).includes(e.id) &&
      e.equipment.every(
        (eq) =>
          eq === "bodyweight" ||
          p.equipment.includes(eq as Profile["equipment"][number]),
      ),
  );
  if (!options.length) throw new Error("MISSING_EXERCISE_VARIANT");
  const loaded = options.filter((e) => e.equipment[0] !== "bodyweight");
  const pool = loaded.length ? loaded : options;
  return pool[(p.level === "beginner" ? index : index + 1) % pool.length];
}
export function generatePlan(
  p: Profile,
  catalog = exercises,
  focus = focuses,
  version = 1,
  template?: { sets: number; min: number; max: number; rest: number },
): DayPlan[] {
  let n = 0;
  return Array.from({ length: 100 }, (_, i) => {
    const day = i + 1,
      date = addDays(p.startDate, i),
      week = Math.floor(i / 7) + 1;
    const isTraining =
      p.weekdays.includes(new Date(date + "T12:00:00Z").getUTCDay()) &&
      day < 100;
    const kind = day === 100 ? "finish" : isTraining ? "workout" : "rest";
    const index = n;
    let patterns = ["squat", "push", "pull", "hinge", "core"];
    if (p.days === 4) {
      patterns =
        n % 2 === 0
          ? ["push", "pull", "shoulder", "core"]
          : ["squat", "hinge", "single", "calf", "core"];
    }
    if (p.minutes === 25) patterns = patterns.slice(0, 4);
    if (p.minutes === 55 && p.days < 4) patterns.splice(4, 0, "single");
    if (isTraining) n++;
    const sets =
      day <= 14
        ? Math.min(2, template?.sets || 2)
        : template?.sets || (p.level === "beginner" ? 2 : 3);
    return {
      day,
      date,
      week,
      phase: phase(day),
      focus: focus[week - 1] || focuses[week - 1],
      kind,
      title:
        kind === "finish"
          ? "100 dage. Dit næste kapitel."
          : kind === "rest"
            ? "Plads til restitution"
            : p.days === 4
              ? index % 2 === 0
                ? "Overkrop & kontrol"
                : "Underkrop & fundament"
              : `Helkrop ${index % 2 === 0 ? "A" : "B"}`,
      minutes: kind === "workout" ? p.minutes : 0,
      warmup:
        kind === "workout"
          ? [
              "3–5 minutter rolig gang eller cykling.",
              "5 rolige gentagelser af squat og hoftebøjning uden vægt.",
              "Ét let øvesæt før den første pres-, træk- og benøvelse.",
            ]
          : [],
      exercises: isTraining
        ? patterns.map((pat, j) => ({
            ...choose(pat, p, index + j, catalog),
            sets,
            min: template?.min || 8,
            max: template?.max || 12,
            rest: pat === "core" ? 60 : template?.rest || 90,
            intensity:
              "Stop med ca. 2–3 gode gentagelser tilbage. Ingen træning til udmattelse.",
          }))
        : [],
      ruleVersion: "shaz-rules-1",
      profileVersion: version,
    };
  });
}
export function progression(
  history: { reps: number; kg: number; effort: number }[][],
  max = 12,
) {
  if (history.length < 2)
    return "Find en kontrolleret belastning. Registrér mindst to pas før du vurderer en stigning.";
  const two = history.slice(-2);
  return two.every(
    (s) => s.length > 0 && s.every((x) => x.reps >= max && x.effort <= 8),
  )
    ? "Du nåede toppen af intervallet i to pas med overskud. Overvej den mindste mulige vægtstigning (ca. 2–5 %) næste gang, hvis teknikken stadig er god."
    : "Behold belastningen eller gør øvelsen lettere. Arbejd roligt mod flere kontrollerede gentagelser.";
}
