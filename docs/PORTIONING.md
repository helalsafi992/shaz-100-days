# Praktiske ingrediensmængder

`practical-grams-v1` anvendes kun ved nye beregninger og eksplicitte portionsændringer. Gemte måltider og spist historik bevarer deres præcise ingredienser, næringssnapshot og kildegrundlag. Fortryd fjernelse og valg af et tidligere gemt alternativ genbruger det præcise snapshot; en senere opskriftsversion kræver et nyt valg.

- Æg: 50 g rå spiselig vægt som praktisk reference for ét stort æg. Antal er cirka; vej uden skal. USDA SR Legacy/NDB 01123 angiver 50 g pr. stort æg i [energitabellen](https://www.nal.usda.gov/sites/default/files/page-files/Total%20Kcal.pdf). Det svarer til fødevarepost FDC 171287 i kataloget.
- Olie, nødder/frø, peanutbutter og citronsaft: hele gram.
- Øvrige katalogingredienser: 5 g-trin.
- En opskriftsversion kan have et eksplicit `stepGrams` på 1–50 pr. ingrediens. Det valideres i admin og følger den almindelige kladde-/review-/publiceringsproces.

Trin er køkkenpraktiske produktregler, ikke kostanbefalinger eller en faglig godkendelse. Der gættes ikke på vægt pr. skive brød, ml eller størrelse på en frugt. Indkøb summeres i gram/kg fra de faktisk valgte, afrundede mængder.

Algoritmen søger nærliggende portionsfaktorer, kontrollerer opskriftens portions- og vægtgrænser og beregner energi og makroer fra de afrundede ingredienser. Den ændrer ikke næringsdata for at ramme et mål. Standardalternativer skal stadig bestå måltidsgrænserne; utilstrækkelige alternativer forklares i brugerfladen. Alle 3^N-kombinationer for de definerede egnede profiler testes igen.

Dette opfylder ikke alene kravet om fuld ernæringsmæssig tilstrækkelighed. Mikronæringsdata og godkendte standarduger kræver fortsat kildegrundlag og faglig gennemgang.
