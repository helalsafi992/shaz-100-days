/** Owner-review questionnaire. No customer activation until explicitly approved. */
export const questionnaire = {
  "version": "shaz-questionnaire-2026-10-09-review1",
  "status": "owner-review",
  "targetAudience": "adults",
  "groups": [
    {
      "id": "goals",
      "title": "01 · Mål og udgangspunkt",
      "items": [
        {
          "id": "goal_main",
          "title": "Hvad vil du primært opnå?",
          "type": "single",
          "path": "wishes.priority",
          "choices": [
            {
              "value": "fat-loss",
              "label": "Tabe fedt"
            },
            {
              "value": "hypertrophy",
              "label": "Bygge muskler"
            },
            {
              "value": "strength",
              "label": "Blive stærkere"
            },
            {
              "value": "fitness",
              "label": "Bedre kondition og form"
            },
            {
              "value": "sport",
              "label": "Præstere bedre i min sport"
            },
            {
              "value": "maintenance",
              "label": "Holde formen"
            }
          ],
          "required": true
        },
        {
          "id": "goal_focus",
          "title": "Vil du prioritere bestemte områder?",
          "type": "multi",
          "path": "wishes.focus",
          "choices": [
            {
              "value": "whole-body",
              "label": "Hele kroppen"
            },
            {
              "value": "glutes",
              "label": "Baller"
            },
            {
              "value": "legs",
              "label": "Ben"
            },
            {
              "value": "back",
              "label": "Ryg"
            },
            {
              "value": "chest",
              "label": "Bryst"
            },
            {
              "value": "shoulders",
              "label": "Skuldre"
            },
            {
              "value": "core",
              "label": "Core"
            }
          ],
          "required": true,
          "hint": "Vælg højst to. Ikke et løfte om lokalt fedttab.",
          "maxChoices": 2
        },
        {
          "id": "goal_metric",
          "title": "Har du et konkret, målbart mål?",
          "type": "single",
          "path": "wishes.target.metric",
          "choices": [
            {
              "value": "none",
              "label": "Ikke nødvendigt"
            },
            {
              "value": "weight-kg",
              "label": "En bestemt kropsvægt"
            },
            {
              "value": "exercise-kg",
              "label": "En styrkepræstation"
            },
            {
              "value": "run-km",
              "label": "En løbedistance"
            },
            {
              "value": "consistent-weeks",
              "label": "En stabil rutine"
            }
          ],
          "required": false
        },
        {
          "id": "goal_value",
          "title": "Hvad er dit ønskede resultat og tidshorisont?",
          "type": "structured",
          "path": "wishes.target",
          "choices": [],
          "required": true,
          "hint": "Valgfrit udgangspunkt og målværdi med enhed. Systemet garanterer ikke resultatet.",
          "when": [
            {
              "id": "goal_metric",
              "op": "not",
              "value": "none"
            }
          ]
        },
        {
          "id": "experience",
          "title": "Hvor erfaren er du med styrketræning?",
          "type": "single",
          "path": "wishes.recentTraining",
          "choices": [
            {
              "value": "none",
              "label": "Helt ny"
            },
            {
              "value": "under-3-months",
              "label": "Under 3 måneder"
            },
            {
              "value": "3-12-months",
              "label": "3–12 måneder"
            },
            {
              "value": "over-1-year",
              "label": "Over et år"
            }
          ],
          "required": true
        },
        {
          "id": "break",
          "title": "Har du haft en længere pause fra træning?",
          "type": "single",
          "path": "wishes.interruption",
          "choices": [
            {
              "value": "none",
              "label": "Nej"
            },
            {
              "value": "under-4-weeks",
              "label": "Under 4 uger"
            },
            {
              "value": "over-4-weeks",
              "label": "4 uger eller længere"
            }
          ],
          "required": true
        }
      ]
    },
    {
      "id": "training",
      "title": "02 · Træning og cardio",
      "items": [
        {
          "id": "training_place",
          "title": "Hvor vil du træne?",
          "type": "single",
          "path": "profile.place",
          "choices": [
            {
              "value": "home",
              "label": "Hjemme"
            },
            {
              "value": "gym",
              "label": "Fitnesscenter"
            },
            {
              "value": "both",
              "label": "Begge steder"
            }
          ],
          "required": true
        },
        {
          "id": "equipment_home",
          "title": "Hvilket udstyr har du hjemme?",
          "type": "multi",
          "path": "profile.locations[home].equipment",
          "choices": [
            {
              "value": "bodyweight",
              "label": "Kropsvægt"
            },
            {
              "value": "band",
              "label": "Elastikker"
            },
            {
              "value": "dumbbells",
              "label": "Håndvægte"
            },
            {
              "value": "bench",
              "label": "Bænk"
            },
            {
              "value": "pullup",
              "label": "Pull-up-stang"
            },
            {
              "value": "barbell",
              "label": "Vægtstang"
            },
            {
              "value": "rack",
              "label": "Rack"
            }
          ],
          "required": true,
          "hint": "Udstyr registreres separat for hver lokation.",
          "when": [
            {
              "id": "training_place",
              "op": "one_of",
              "value": [
                "home",
                "both"
              ]
            }
          ]
        },
        {
          "id": "equipment_gym",
          "title": "Hvilket udstyr har du i centeret?",
          "type": "multi",
          "path": "profile.locations[gym].equipment",
          "choices": [
            {
              "value": "bodyweight",
              "label": "Kropsvægt"
            },
            {
              "value": "machines",
              "label": "Maskiner"
            },
            {
              "value": "cable",
              "label": "Kabel"
            },
            {
              "value": "dumbbells",
              "label": "Håndvægte"
            },
            {
              "value": "barbell",
              "label": "Vægtstang"
            },
            {
              "value": "rack",
              "label": "Rack"
            },
            {
              "value": "bench",
              "label": "Bænk"
            },
            {
              "value": "pullup",
              "label": "Pull-up-stang"
            }
          ],
          "required": true,
          "when": [
            {
              "id": "training_place",
              "op": "one_of",
              "value": [
                "gym",
                "both"
              ]
            }
          ]
        },
        {
          "id": "strength_days",
          "title": "Hvor mange styrkepas vil du have hver uge?",
          "type": "single",
          "path": "profile.days",
          "choices": [
            {
              "value": 0,
              "label": "0 · kun kost og/eller cardio"
            },
            {
              "value": 1,
              "label": "1 dag"
            },
            {
              "value": 2,
              "label": "2 dage"
            },
            {
              "value": 3,
              "label": "3 dage"
            },
            {
              "value": 4,
              "label": "4 dage"
            }
          ],
          "required": true,
          "hint": "5–6 pas vises først, når passende programmer er godkendt."
        },
        {
          "id": "strength_weekdays",
          "title": "Hvilke dage passer dig?",
          "type": "multi",
          "path": "profile.weekdays",
          "choices": [
            {
              "value": 1,
              "label": "Mandag"
            },
            {
              "value": 2,
              "label": "Tirsdag"
            },
            {
              "value": 3,
              "label": "Onsdag"
            },
            {
              "value": 4,
              "label": "Torsdag"
            },
            {
              "value": 5,
              "label": "Fredag"
            },
            {
              "value": 6,
              "label": "Lørdag"
            },
            {
              "value": 0,
              "label": "Søndag"
            }
          ],
          "required": true,
          "hint": "Vælg præcis lige så mange dage som antallet af styrkepas.",
          "when": [
            {
              "id": "strength_days",
              "op": "gt",
              "value": 0
            }
          ]
        },
        {
          "id": "session_schedule",
          "title": "Hvor og hvor længe træner du på hver valgt dag?",
          "type": "per_day",
          "path": "profile.schedule",
          "choices": [],
          "required": true,
          "hint": "Sted ud fra dine lokationer og 20, 25, 30, 40, 45, 55, 60 eller 75 minutter inkl. opvarmning.",
          "when": [
            {
              "id": "strength_days",
              "op": "gt",
              "value": 0
            }
          ]
        },
        {
          "id": "cardio_days",
          "title": "Vil du træne cardio ved siden af styrken?",
          "type": "single",
          "path": "profile.cardio.days",
          "choices": [
            {
              "value": 0,
              "label": "Ingen ekstra cardio"
            },
            {
              "value": 1,
              "label": "1 gang"
            },
            {
              "value": 2,
              "label": "2 gange"
            },
            {
              "value": 3,
              "label": "3 gange"
            },
            {
              "value": 4,
              "label": "4 gange"
            }
          ],
          "required": true
        },
        {
          "id": "cardio_forms",
          "title": "Hvilken cardio foretrækker du?",
          "type": "multi",
          "path": "profile.cardio.forms",
          "choices": [
            {
              "value": "walk",
              "label": "Gang"
            },
            {
              "value": "cycle",
              "label": "Cykling"
            },
            {
              "value": "walk-run",
              "label": "Løb/gang"
            },
            {
              "value": "run",
              "label": "Løb"
            },
            {
              "value": "elliptical",
              "label": "Crosstrainer"
            },
            {
              "value": "row",
              "label": "Romaskine"
            }
          ],
          "required": true,
          "when": [
            {
              "id": "cardio_days",
              "op": "gt",
              "value": 0
            }
          ]
        },
        {
          "id": "cardio_schedule",
          "title": "Hvilke dage, hvor længe og hvor hårdt?",
          "type": "per_day",
          "path": "profile.cardio",
          "choices": [],
          "required": true,
          "hint": "Let eller moderat; mindst én passende restitutionsmulighed i den samlede uge.",
          "when": [
            {
              "id": "cardio_days",
              "op": "gt",
              "value": 0
            }
          ]
        },
        {
          "id": "other_sport",
          "title": "Dyrker du anden sport?",
          "type": "single",
          "path": "wishes.otherSport",
          "choices": [
            {
              "value": "no",
              "label": "Nej"
            },
            {
              "value": "yes",
              "label": "Ja"
            }
          ],
          "required": false
        },
        {
          "id": "other_sport_detail",
          "title": "Hvilken sport, hvilke dage og hvor lang tid?",
          "type": "structured",
          "path": "profile.otherSport",
          "choices": [],
          "required": true,
          "when": [
            {
              "id": "other_sport",
              "op": "eq",
              "value": "yes"
            }
          ]
        },
        {
          "id": "exercise_preferences",
          "title": "Er der øvelser, du foretrækker eller ikke kan lide?",
          "type": "catalog_multi",
          "path": "wishes.preferredExercises",
          "choices": [],
          "required": false,
          "hint": "Vælg kun fra det eksisterende øvelsesbibliotek. Smerte håndteres i næste trin."
        }
      ]
    },
    {
      "id": "safety",
      "title": "03 · Skader og sikkerhed",
      "items": [
        {
          "id": "urgent",
          "title": "Har du lige nu alvorlige eller pludselige symptomer?",
          "type": "single",
          "path": "safety.urgentSymptoms",
          "choices": [
            {
              "value": "no",
              "label": "Nej"
            },
            {
              "value": "yes",
              "label": "Ja"
            },
            {
              "value": "unsure",
              "label": "Ved ikke / usikker"
            }
          ],
          "required": true,
          "hint": "Fx brystsmerter, besvimelse, alvorlig åndenød eller akut kraftnedsættelse. Ved akut alvorlig situation: søg akut hjælp."
        },
        {
          "id": "exertion",
          "title": "Har du uforklarede symptomer under fysisk aktivitet?",
          "type": "single",
          "path": "safety.exertionalSymptoms",
          "choices": [
            {
              "value": "no",
              "label": "Nej"
            },
            {
              "value": "yes",
              "label": "Ja"
            },
            {
              "value": "unsure",
              "label": "Ved ikke / usikker"
            }
          ],
          "required": true,
          "hint": "Fx besvimelse, trykken for brystet eller usædvanlig åndenød."
        },
        {
          "id": "medical_training",
          "title": "Har en læge eller fysioterapeut begrænset din træning?",
          "type": "single",
          "path": "safety.medicalExerciseRestriction",
          "choices": [
            {
              "value": "no",
              "label": "Nej"
            },
            {
              "value": "yes",
              "label": "Ja"
            },
            {
              "value": "unsure",
              "label": "Ved ikke / usikker"
            }
          ],
          "required": true
        },
        {
          "id": "injury_status",
          "title": "Har du skader eller smerter, som påvirker træning?",
          "type": "single",
          "path": "safety.injury.status",
          "choices": [
            {
              "value": "none",
              "label": "Nej"
            },
            {
              "value": "resolved",
              "label": "Tidligere, men overstået"
            },
            {
              "value": "current",
              "label": "Aktuelle gener"
            },
            {
              "value": "postoperative",
              "label": "Opereret / i genoptræning"
            }
          ],
          "required": true
        },
        {
          "id": "injury_area",
          "title": "Hvor sidder generne, og på hvilken side?",
          "type": "structured",
          "path": "safety.injury.areas",
          "choices": [],
          "required": true,
          "hint": "Vælg kropsområde og venstre/højre/begge – ikke en obligatorisk diagnose.",
          "when": [
            {
              "id": "injury_status",
              "op": "not",
              "value": "none"
            }
          ]
        },
        {
          "id": "injury_course",
          "title": "Hvor længe, hvor meget og hvordan reagerer kroppen?",
          "type": "structured",
          "path": "safety.injury",
          "choices": [],
          "required": true,
          "hint": "Smerte 0–10, varighed, om det forværres, hverdagsfunktion og efterreaktion.",
          "when": [
            {
              "id": "injury_status",
              "op": "not",
              "value": "none"
            }
          ]
        },
        {
          "id": "injury_triggers",
          "title": "Hvilke bevægelser provokerer generne?",
          "type": "multi",
          "path": "safety.injury.triggers",
          "choices": [
            {
              "value": "squat",
              "label": "Squat"
            },
            {
              "value": "hinge",
              "label": "Hoftebøjning/hinge"
            },
            {
              "value": "push",
              "label": "Pres"
            },
            {
              "value": "pull",
              "label": "Træk"
            },
            {
              "value": "overhead",
              "label": "Over hovedet"
            },
            {
              "value": "run",
              "label": "Løb"
            },
            {
              "value": "jump",
              "label": "Hop"
            },
            {
              "value": "other",
              "label": "Andet"
            }
          ],
          "required": true,
          "when": [
            {
              "id": "injury_status",
              "op": "not",
              "value": "none"
            }
          ]
        },
        {
          "id": "professional_assessment",
          "title": "Er du undersøgt eller i behandling/genoptræning?",
          "type": "single",
          "path": "safety.injury.professionalAssessment",
          "choices": [
            {
              "value": "none",
              "label": "Nej"
            },
            {
              "value": "assessed",
              "label": "Tidligere vurderet"
            },
            {
              "value": "under-care",
              "label": "Aktuelt i behandling/genoptræning"
            }
          ],
          "required": true,
          "when": [
            {
              "id": "injury_status",
              "op": "not",
              "value": "none"
            }
          ]
        },
        {
          "id": "pregnancy",
          "title": "Graviditet, nylig fødsel eller amning – er det aktuelt?",
          "type": "single",
          "path": "safety.pregnancyOrPostpartum",
          "choices": [
            {
              "value": "no",
              "label": "Nej"
            },
            {
              "value": "yes",
              "label": "Ja"
            },
            {
              "value": "unsure",
              "label": "Ved ikke / usikker"
            }
          ],
          "required": true,
          "hint": "Et ja/usikkert svar kræver en anden planlægningsvej. Hvis ikke relevant, vælg nej."
        },
        {
          "id": "medical_nutrition",
          "title": "Har du behov for en individuelt medicinsk tilpasset kost?",
          "type": "single",
          "path": "safety.medicalDietNeeded",
          "choices": [
            {
              "value": "no",
              "label": "Nej"
            },
            {
              "value": "yes",
              "label": "Ja"
            },
            {
              "value": "unsure",
              "label": "Ved ikke / usikker"
            }
          ],
          "required": true
        },
        {
          "id": "calorie_concern",
          "title": "Kan kalorietælling eller vægttab være uhensigtsmæssigt for dig?",
          "type": "single",
          "path": "safety.calorieTrackingConcern",
          "choices": [
            {
              "value": "no",
              "label": "Nej"
            },
            {
              "value": "yes",
              "label": "Ja"
            },
            {
              "value": "unsure",
              "label": "Ved ikke / usikker"
            }
          ],
          "required": true,
          "hint": "Fx aktuelt eller tidligere problematisk forhold til mad, krop eller kalorietælling."
        },
        {
          "id": "severe_allergy",
          "title": "Har du alvorlig fødevareallergi, hvor spor/krydskontaminering kan være et problem?",
          "type": "single",
          "path": "safety.severeFoodAllergy",
          "choices": [
            {
              "value": "no",
              "label": "Nej"
            },
            {
              "value": "yes",
              "label": "Ja"
            },
            {
              "value": "unsure",
              "label": "Ved ikke / usikker"
            }
          ],
          "required": true
        }
      ]
    },
    {
      "id": "food",
      "title": "04 · Mad og ernæring",
      "items": [
        {
          "id": "diet_pattern",
          "title": "Hvordan ønsker du at spise?",
          "type": "single",
          "path": "dietPattern",
          "choices": [
            {
              "value": "all",
              "label": "Ingen særlige præferencer"
            },
            {
              "value": "vegetarian",
              "label": "Vegetarisk"
            },
            {
              "value": "vegan",
              "label": "Vegansk"
            },
            {
              "value": "pescatarian",
              "label": "Pescetarisk"
            }
          ],
          "required": true
        },
        {
          "id": "halal",
          "title": "Skal opskrifterne være halal-egnede?",
          "type": "single",
          "path": "profile.halal",
          "choices": [
            {
              "value": false,
              "label": "Nej"
            },
            {
              "value": true,
              "label": "Ja"
            }
          ],
          "required": true,
          "hint": "Ingredienstyper er ikke en garanti for certificering."
        },
        {
          "id": "allergies",
          "title": "Hvilke allergier eller intolerancer har du?",
          "type": "multi",
          "path": "profile.avoid",
          "choices": [
            {
              "value": "milk",
              "label": "Mælk"
            },
            {
              "value": "gluten",
              "label": "Glutenholdige råvarer"
            },
            {
              "value": "egg",
              "label": "Æg"
            },
            {
              "value": "soy",
              "label": "Soja"
            },
            {
              "value": "nuts",
              "label": "Nødder"
            },
            {
              "value": "peanut",
              "label": "Jordnødder"
            },
            {
              "value": "fish",
              "label": "Fisk"
            }
          ],
          "required": false,
          "hint": "Allergier håndteres særskilt fra smag. Ved svær allergi kan opskriftsfiltre ikke stå alene."
        },
        {
          "id": "avoid_food",
          "title": "Hvilke råvarer vil du gerne undgå?",
          "type": "ingredient_multi",
          "path": "profile.avoid",
          "choices": [],
          "required": false
        },
        {
          "id": "meal_count",
          "title": "Hvor mange måltider passer din hverdag?",
          "type": "single",
          "path": "profile.mealCount",
          "choices": [
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            }
          ],
          "required": true
        },
        {
          "id": "cook_time",
          "title": "Hvor lang tid må et måltid tage at tilberede?",
          "type": "single",
          "path": "profile.cookTime",
          "choices": [
            {
              "value": 15,
              "label": "Op til 15 min."
            },
            {
              "value": 30,
              "label": "Op til 30 min."
            },
            {
              "value": 60,
              "label": "Op til 60 min."
            }
          ],
          "required": true
        },
        {
          "id": "food_variety",
          "title": "Hvor meget variation vil du have?",
          "type": "single",
          "path": "wishes.foodVariety",
          "choices": [
            {
              "value": "repeat-ok",
              "label": "Gerne gentagelser"
            },
            {
              "value": "balanced",
              "label": "En god blanding"
            },
            {
              "value": "high-variety",
              "label": "Mest mulig variation"
            }
          ],
          "required": false
        },
        {
          "id": "batch_cooking",
          "title": "Vil du lave flere portioner ad gangen?",
          "type": "single",
          "path": "wishes.batchCooking",
          "choices": [
            {
              "value": false,
              "label": "Nej"
            },
            {
              "value": true,
              "label": "Ja"
            }
          ],
          "required": false
        },
        {
          "id": "food_budget",
          "title": "Hvilket madbudget passer dig?",
          "type": "single",
          "path": "wishes.foodBudget",
          "choices": [
            {
              "value": "low",
              "label": "Lavt"
            },
            {
              "value": "medium",
              "label": "Almindeligt"
            },
            {
              "value": "flexible",
              "label": "Fleksibelt"
            }
          ],
          "required": false,
          "hint": "Der bruges ikke opfundne prisdata."
        },
        {
          "id": "nutrition_method",
          "title": "Vil du tælle kalorier eller bruge portionsvejledning?",
          "type": "single",
          "path": "profile.nutrition",
          "choices": [
            {
              "value": "portions",
              "label": "Portionsvejledning uden kalorietælling"
            },
            {
              "value": "calculated",
              "label": "Beregnet kaloriemål"
            }
          ],
          "required": true
        },
        {
          "id": "measurements",
          "title": "Oplysninger til estimeret ligevægtsindtag",
          "type": "structured",
          "path": "profile.estimatedCaloriesInputs",
          "choices": [],
          "required": true,
          "hint": "Alder, højde, vægt, beregningskategori, hverdagsaktivitet, træningsaktivitet og særskilt databehandlingssamtykke.",
          "when": [
            {
              "id": "nutrition_method",
              "op": "eq",
              "value": "calculated"
            }
          ]
        },
        {
          "id": "deficit",
          "title": "Hvilket kalorieunderskud ønsker du?",
          "type": "single",
          "path": "profile.deficitLevel",
          "choices": [
            {
              "value": "moderate",
              "label": "Moderat"
            },
            {
              "value": "high",
              "label": "Meget"
            },
            {
              "value": "higher",
              "label": "Rigtig meget"
            },
            {
              "value": "aggressive",
              "label": "Aggressivt"
            }
          ],
          "required": true,
          "hint": "Serverbaseret sikkerhedskontrol kan blokere en uegnet mulighed. Aggressivt er ikke standard.",
          "when": [
            {
              "id": "nutrition_method",
              "op": "eq",
              "value": "calculated"
            },
            {
              "id": "goal_main",
              "op": "eq",
              "value": "fat-loss"
            }
          ]
        }
      ]
    },
    {
      "id": "finish",
      "title": "05 · Opsummering og samtykke",
      "items": [
        {
          "id": "barriers",
          "title": "Hvad kan gøre planen svær at følge?",
          "type": "multi",
          "path": "wishes.barriers",
          "choices": [
            {
              "value": "time",
              "label": "For lidt tid"
            },
            {
              "value": "fatigue",
              "label": "Træthed"
            },
            {
              "value": "motivation",
              "label": "Motivation"
            },
            {
              "value": "cooking",
              "label": "Madlavning"
            },
            {
              "value": "irregular-week",
              "label": "Uregelmæssig uge"
            },
            {
              "value": "none",
              "label": "Intet særligt"
            }
          ],
          "required": false,
          "maxChoices": 3
        },
        {
          "id": "start_date",
          "title": "Hvornår skal din dag 1 begynde?",
          "type": "date",
          "path": "profile.startDate",
          "choices": [],
          "required": true,
          "hint": "Vis hele trænings- og kostopsætningen til godkendelse før aktivering."
        },
        {
          "id": "processing_consent",
          "title": "Accepterer du nødvendig behandling af dine oplysninger til det valgte forløb?",
          "type": "consent",
          "path": "processingConsent",
          "choices": [
            {
              "value": false,
              "label": "Nej"
            },
            {
              "value": true,
              "label": "Ja"
            }
          ],
          "required": true,
          "hint": "Forklar særskilt lovligt behandlingsgrundlag og frivillige oplysninger. Ikke automatisk grundlag for markedsføring."
        },
        {
          "id": "ai_consent",
          "title": "Vil du bruge frivillig AI-assisteret planvurdering?",
          "type": "single",
          "path": "aiConsent",
          "choices": [
            {
              "value": false,
              "label": "Nej"
            },
            {
              "value": true,
              "label": "Ja, efter information om data og leverandør"
            }
          ],
          "required": true,
          "hint": "Ingen AI forespørgsel uden særskilt accept. Almindelig plan fungerer også med nej."
        }
      ]
    }
  ]
} as const;
export type QuestionnaireQuestion = typeof questionnaire.groups[number]["items"][number];
type Primitive = string | number | boolean | null;
export type QuestionnaireAnswers = Record<string, Primitive | readonly Primitive[] | undefined>;
export function visibleQuestions(answers: QuestionnaireAnswers) {
 return questionnaire.groups.flatMap(group => group.items.filter(question => {
   if (!("when" in question) || !question.when) return true;
   return question.when.every(rule => {
     const given = answers[rule.id];
     if (rule.op === "gt") return typeof given === "number" && given > Number(rule.value);
     if (rule.op === "eq") return given === rule.value;
     if (rule.op === "not") return given !== undefined && given !== rule.value;
     if (rule.op === "one_of") return Array.isArray(rule.value) && rule.value.some(value => value === given);
     return false;
   });
 }));
}
export function questionnaireContractIssues() {
 const ids = new Set<string>(); const errors: string[] = [];
 for (const group of questionnaire.groups) for(const item of group.items) {
  if(ids.has(item.id))errors.push("duplicate:"+item.id);
  if ("when" in item && item.when) for(const rule of item.when) if(!ids.has(rule.id))errors.push("forward-condition:"+item.id+"->"+rule.id);
  ids.add(item.id);
 }
 return errors;
}
