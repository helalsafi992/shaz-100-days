# Beregningsregler og faglig status

**Status: review, kun fiktive testprofiler. Ikke fagligt godkendt til kundelancering.** Versioner findes i `shaz_content` og gemmes som snapshot på madplanen. En publiceret regel og CONTENT_APPROVED kræves uden for det isolerede testmiljø. Administrator kan stramme de servervaliderede rammer, og den valgte version anvendes ved nye beregninger.

## Dokumenteret grundlag

1. Mifflin et al., 1990: https://pubmed.ncbi.nlm.nih.gov/2305711/ — hvilestofskifte = 10 × kg + 6,25 × cm − 5 × alder + 5 (mandlig koefficient) eller −161 (kvindelig). Det er et populationsbaseret estimat, ikke en måling eller universelt præcist individuelt behov.
2. NICE NG246, Physical activity and diet: https://www.nice.org.uk/guidance/ng246/chapter/Physical-activity-and-diet — individuel tilpasning og specialistunderstøttelse ved lavenergiinterventioner. NICE's 800–1200-kcal-kategori er ikke grundlag for at kalde vores numeriske grænser klinisk validerede.
3. EFSA: https://www.efsa.europa.eu/en/press/news/nda100326 — 25 g fiber/dag for voksne. https://www.efsa.europa.eu/en/press/news/120209 — protein-PRI 0,83 g/kg/dag for raske voksne. DRV-værdier er referencer, ikke individuelt optimal sportsnutrition.
4. Ingredienser: USDA FoodData Central SR Legacy, april 2018. Hvert fødevareobjekt i `lib/recipes.ts` indeholder FDC-ID, beskrivelse, kilde-URL, næringsværdi pr. 100 g og vægtgrundlag. Ingen kalorier justeres kunstigt for at ramme målet.

Kilder gennemset 8. oktober 2026. Faglig reviewer skal kontrollere aktualitet og målgruppe igen før lancering.

## Foreløbige produktvalg — ikke medicinske kategorier

| Valg | Testpolitik v1 | Faglig status |
| --- | --- | --- |
| Samlet aktivitet | Hverdag 1,20/1,35/1,50 + træning 0,10/0,20/0,30, højst 1,90 | Produktantagelse, skal kalibreres/godkendes; aldrig ekstra kcal for logget cardio |
| Minimum ved fedttab | 1.800 kcal mandlig / 1.500 kcal kvindelig koefficient | Foreløbigt konservativt produktværn, ikke universel sikkerhedsgrænse |
| Maksimum underskud | 600 kcal/dag | Foreløbigt produktværn; en procent alene giver ikke sikkerhed |
| BMI | Beregner afviser under 18,5 eller over 35; under 20 højst 10 % underskud | Afgrænsning til generisk testprodukt, ikke diagnose |
| Alder og særlige behov | Ingen beregnet plan under 18/over64, ved graviditet/amning, relevante medicinske behov eller spiseforstyrrelsesproblematik | Kunden henvises til individuel vurdering; ingen automatisk vægttabsplan |
| Høj træningsbelastning | Heavy/høj aktivitet, mindst6 samlede pas eller over300 min/uge: højst10 % | Produktdefinition, ikke klinisk tærskel |
| Aggressivt | 25 %, særskilt accept,7dage ad gangen, højst14dage; ny uge kræver mindst2ugers check-ins uden lav energi/dårlig restitution | Foreløbigt værn; ikke anbefaling om at bruge niveauet |
| Muskelmål | 5 % overskud, højst150kcal | Særskilt produktmål; ingen tvunget vægttabsplan |
| Protein |1,2g/kg, tolerance5 % i automatisk portionssøgning | Produktmål for denne test; ikke direkte EFSA-PRI eller en individuel optimalværdi |
| Fiber |25g/dag,tolerance5 % | EFSA-reference plus teknisk tolerance |
| Fedt |20–40energiprocent,2procentpoint teknisk tolerance | Foreløbig produktindstilling, ikke gengivet som EFSA's interval |
| Portion |Som udgangspunkt0,5–2,5grundportioner og højst1.000g | Opskriftsspecifikke bounds kan redigeres; ikke universelt passende portionsstørrelse |

Ved blokeret valg afvises gemning på serveren, og der vises et mindre underskud/vedligeholdelse eller portionsvejledning som alternativ. Vi klipper ikke blot et lavt tal til en grænse og kalder det sikkert. Ingen justering fra én vejning. Kaloriemål ændres kun med forhåndsvisning og accept.

Automatisk måltidssøgning kontrollerer energi, protein, fiber, fedtandel, portionsgrænser og kostudelukkelser. En fuldt automatisk plan sigter efter ±5 % energi. **Mikronæringsstoffer og alle aspekter af ernæringsmæssig tilstrækkelighed er endnu ikke dokumenteret.** Det er en eksplicit lanceringsblokering, ikke en påstand om en fuldt ernæringsmæssigt godkendt kost. Stramme allergier kan give under tre egnede retter; det vises, og filteret brydes aldrig.

Cardioprogression på5 % om ugen, begynderstart højst20min og en fuld ugentlig restitutionsdag er versionerede produktregler til faglig gennemgang. De beskrives ikke som en universel skadesforebyggende formel. Udstyr, niveau og formål styrer alternativer; ingen kaloriebaseret straf eller kompensation.
