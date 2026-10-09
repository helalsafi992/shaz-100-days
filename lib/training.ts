import type { Profile } from "./profile";
import { addDays, normalizeProfile, sessionProfile } from "./profile";
import { HttpError } from "./errors";
export type Exercise = {
  id: string;
  name: string;
  pattern: string;
  equipment: string[];
  instructions: string[];
  cue: string;
  videoId?: string;
  version: number;
  unit?: "reps" | "seconds";
  perSide?: boolean;
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
    "barbell-squat",
    "Squat med vægtstang",
    "squat",
    ["barbell", "rack"],
    [
      "Indstil sikkerhedsstøtterne og placér stangen stabilt på øvre ryg.",
      "Bøj knæ og hofter under kontrol, mens hele foden støtter.",
      "Rejs dig uden at miste kropsspændingen. Start med let belastning.",
    ],
    "Brug kun rack med sikkerhedsstøtter; få teknikken gennemgået ved tvivl.",
  ),
  x(
    "barbell-rdl",
    "Rumænsk dødløft med vægtstang",
    "hinge",
    ["barbell"],
    [
      "Hold stangen tæt foran lårene med bløde knæ.",
      "Skub hoften bagud med rolig ryg og stangen tæt langs benene.",
      "Rejs dig fra en kontrolleret dybde uden at læne bagud.",
    ],
    "Start let; bevægelighed bestemmer dybden.",
  ),
  x(
    "barbell-row",
    "Foroverbøjet roning med vægtstang",
    "pull",
    ["barbell"],
    [
      "Bøj i hoften med bløde knæ og stabil ryg.",
      "Træk stangen mod nederste ribben uden at rykke.",
      "Sænk roligt og behold samme kropsposition.",
    ],
    "Vælg håndvægtsroning med støtte hvis positionen er svær at holde.",
  ),
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
    ["leg-press"],
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
    ["chest-press"],
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
    ["cable"],
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
    "knee-flexion",
    ["leg-curl"],
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
    ["lat-pull"],
    [
      "Sæt lårpuden, så du sidder stabilt.",
      "Træk grebet mod øverste bryst uden at rykke.",
      "Før langsomt op igen.",
    ],
    "Træk foran kroppen, aldrig bag nakken.",
  ),
];
for (const e of exercises) {
  e.perSide = [
    "db-row",
    "split-squat",
    "db-split",
    "deadbug",
    "bird-dog",
    "side-plank",
  ].includes(e.id);
  if (e.id === "side-plank") {
    e.unit = "seconds";
    e.cue =
      "Hold en rolig position 15–25 sekunder på hver side; stop når kontrollen mistes.";
  }
}
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
  locationId?: string;
  locationName?: string;
  equipment?: Profile["equipment"];
  split?: "full" | "upper" | "lower";
  explanations?: string[];
  paused?: boolean;
  easyRestart?: boolean;
};
export function hasEquipment(e: Exercise, p: Profile) {
  return e.equipment.every(
    (eq) =>
      eq === "bodyweight" ||
      p.equipment.includes(eq as Profile["equipment"][number]) ||
      (["leg-press", "chest-press", "cable", "leg-curl", "lat-pull"].includes(
        eq,
      ) &&
        p.equipment.includes("machines")),
  );
}
export function alternatives(e: Exercise, p: Profile, catalog = exercises) {
  return catalog.filter(
    (x) =>
      x.id !== e.id &&
      !(p.exerciseAvoid || []).includes(x.id) &&
      x.pattern === e.pattern &&
      hasEquipment(x, p),
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
      hasEquipment(e, p),
  );
  if (!options.length)
    throw new HttpError(
      400,
      `Ingen egnet øvelse til ${pattern} på den valgte lokation. Tilføj egnet udstyr eller ændr dit frivillige øvelsesfravalg.`,
    );
  // An explicitly preferred, eligible exercise wins within the same movement pattern.
  // Equipment requirements and avoid-list filtering above are never overridden.
  const favorites = options.filter((e) => (p.exercisePreferred || []).includes(e.id));
  if (favorites.length) return favorites[index % favorites.length];
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
  p = normalizeProfile(p);
  const adjacent = p.weekdays.some((d) => p.weekdays.includes((d + 1) % 7));
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
    const weekday = new Date(date + "T12:00:00Z").getUTCDay();
    const slot = p.schedule!.find((s) => s.weekday === weekday);
    const location =
      p.locations!.find((l) => l.id === slot?.locationId) || p.locations![0];
    const local = sessionProfile(p, weekday);
    const split =
      p.days >= 4 || adjacent ? (n % 2 === 0 ? "upper" : "lower") : "full";
    let patterns = ["squat", "push", "pull", "hinge", "core"];
    if (split !== "full") {
      patterns =
        n % 2 === 0
          ? ["push", "pull", "shoulder", "core"]
          : ["squat", "hinge", "single", "calf", "core"];
    }
    if (local.minutes <= 25)
      patterns = patterns.slice(0, local.minutes === 20 ? 3 : 4);
    if (local.minutes >= 55 && split === "full")
      patterns.splice(4, 0, "single");
    if (isTraining) n++;
    // No calendar-driven progression: volume changes only after an accepted adjustment.
    const sets =
      local.minutes <= 25
        ? 2
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
            : split !== "full"
              ? index % 2 === 0
                ? "Overkrop & kontrol"
                : "Underkrop & fundament"
              : `Helkrop ${index % 2 === 0 ? "A" : "B"}`,
      minutes: kind === "workout" ? local.minutes : 0,
      locationId: location.id,
      locationName: location.name,
      equipment: location.equipment,
      split,
      explanations: [
        p.days === 1
          ? "Ét ugentligt pas er et begrænset start-/vedligeholdelsesvalg."
          : split !== "full"
            ? "Over-/underkropsfordeling respekterer dine valgte dage uden at gentage samme belastning."
            : "Helkrop fordelt på dine valgte dage.",
        "Omfanget tilpasses varigheden. Fremgang kræver registreret præstation og dit valg.",
      ],
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
            ...choose(pat, local, index + j, catalog),
            sets,
            min: template?.min || 8,
            max: template?.max || 12,
            rest: pat === "core" ? 60 : template?.rest || 90,
            intensity:
              "Stop med ca. 2–3 gode gentagelser tilbage. Ingen træning til udmattelse.",
          }))
        : [],
      ruleVersion: "shaz-hybrid-2-review",
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
