# Indhold, data og transparente regler

## Træning

`lib/training.ts` indeholder 25 øvelser med teknik, udstyr, bevægelsesmønster og alternativer. 12 skabeloner kombinerer hjemme/center × begynder/let øvet × 2/3/4 dage. 2/3 dage bruger helkrop med mindst én hviledag mellem valgte dage; 4 dage skifter over-/underkrop og tillader højst to dage i træk. Et kort pas har færre øvelser. Dag 100 er status; de øvrige 99 dage har planlagte pas eller restitution, i alt præcis 100 kalenderdage.

Faser: 1–14 Fundament, 15–35 Opbygning, 36–65 Progression, 66–85 Konsistens, 86–100 Status. Faserne ændrer fokus, ikke automatisk træningsvægt. Begyndere starter med 2 sæt; let øvede kan have 3 efter fundamentet. Standard 8–12 gentagelser, 90 sekunders pause (60 for core) og ca. 2–3 gentagelser i reserve. Faglig review kræves.

Et belastningsforslag kræver mindst to tidligere loggede pas i øvelsen, alle registrerede sæt ved toppen af intervallet og RPE højst 8. Forslaget er en mulig lille stigning (2–5 %), som kunden selv vurderer; systemet ændrer ikke vægten. Check-in med lav energi/træthed/for stor plan foreslår ét sæt mindre de næste 7 dage (mindst ét), kun efter aktiv accept. Ingen ændring af afsluttede pas.

Uden trækudstyr er liggende W en let øvelse for skulderkontrol, ikke en fuld erstatning for belastet roning. Dette fremgår både af onboarding og øvelsen. Programmet stiller ingen diagnose.

Kilder: [ACSM, opdaterede retningslinjer 2026](https://acsm.org/resistance-training-guidelines-update-2026/) (variation, mindst to ugentlige styrkepas, regelmæssighed og tilpasning), [ACSM progression 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/) (historisk basis for små stigninger efter dokumenteret overskud), [WHO fysisk aktivitet](https://www.who.int/news-room/fact-sheets/detail/physical-activity). Programmet er en implementering med konservative standardvalg og er ikke en klinisk valideret intervention.

## 30 opskrifter og næringsberegning

32 råvarer er udtrukket direkte fra USDA FoodData Central, **SR Legacy april 2018**. Kilden er offentligt tilgængelig, public domain. Download: https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip

Reproduktion: `python scripts/import-nutrition.py /sti/til/udpakket/datasæt`. Scriptet bruger `food.csv` og `food_nutrient.csv`, FDC-ID samt nutrient-ID 1008 (kcal), 1003 (protein), 1004 (fedt), 1005 (total kulhydrat) og 1079 (fibre). Filerne i `lib/data/ingredients.json` indeholder originalt navn, ID, URL, vægtbasis og per-100-g-værdier. Der er ikke manuelt fundet på kalorietal.

Opskriftens næring = summen af hver råvares gram / 100 × råvarens næring, divideret med grundopskriftens portioner, ganget med det valgte antal portioner. Alle mængder er gram, også væsker, så indkøbslisten kan aggregere uden ukendte densitetsomregninger. Visningen konverterer gram til kg over 1000 g. Rå/tør/drænet vægt står ved hver ingrediens.

Begrænsninger: amerikanske generiske råvarer repræsenterer ikke hvert dansk mærke; fx er mælk 1 % og græsk yoghurt fedtfattig. Havredata er USDA oats. USDA total kulhydrat inkluderer fibre og svarer derfor ikke direkte til en EU-deklarations kulhydratfelt. Dette står ved næringsvisningen. Beregningen korrigerer ikke særskilt for tilberedningstab. Vand, salt og eventuelle ekstra krydderier er ikke energibærende ingredienser i datasættet; ekstra olie, sukker m.m. skal tilføjes som dokumenterede ingredienser. Værdier vises som estimater.

Vegetarisk filter er råvarebaseret. Halal-egnet angiver ingen svinekød/alkohol i opskriften; certifikater for kundens købte produkter kontrolleres ikke. Allergifiltre er ikke garanti mod krydskontaminering.

## Energi og portioner

Standard er en enkel portionsbaseret tilgang, der ikke kræver vægt/højde/kropskategori. Beregning bruger [Mifflin–St Jeor 1990](https://pubmed.ncbi.nlm.nih.gov/2305711/): 10 × kg + 6,25 × cm − 5 × år + 5 eller −161. Aktivitetsfaktorer 1,4/1,6/1,8 er synlige skøn valgt af brugeren, ikke målinger. Metoden er begrænset til 18–64 år og BMI 18,5–35; øvrige henvises til portioner/individuel vurdering. Ingen graviditet/amning, spiseforstyrrelser eller medicinske diæter i beregningsflowet.

Implementeringens forsigtige måljustering: fedttab højst 10 % eller 300 kcal under vedligehold, muskelmål højst 5 % eller 150 kcal over; afrundes til 50 kcal. Disse grænser er produktvalg, som kræver en ernæringsfagpersons godkendelse, ikke en universel garanti. Ingen automatisk ændring ud fra en vejning. Madplanen er opskriftsinspiration og fordeler ikke automatisk et kalorimål.
