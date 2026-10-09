# Kontrol af næringsdatagrundlag — 9. oktober 2026

Der er endnu ingen påstand om, at madplanerne dækker alle mikronæringsbehov. Dette er en konkret datakontrol af det anvendte USDA SR Legacy-datasæt fra april 2018, ikke en faglig godkendelse. `scripts/import-nutrition.py` importerer aktuelt energi, protein, kulhydrat, fedt og fibre.

Kontrol af de 32 valgte `sourceId` mod datasættets `food_nutrient.csv` viste:

| Næringsstof / USDA nutrient ID | Poster med data | Mangler |
|---|---:|---|
| Calcium 1087 | 32/32 | Ingen |
| Jern 1089 | 32/32 | Ingen |
| Kalium 1092 | 32/32 | Ingen |
| D-vitamin i µg 1114 | 30/32 | Chia og den valgte tunpost |
| B12 1178 | 32/32 | Ingen |
| Jod 1100 | 0/32 | Alle |

Manglende værdier må ikke erstattes med nul eller med tal fra en anden vilkårlig fødevare. De ovenstående mikronæringsværdier er endnu ikke indlæst i kundens plan-snapshots.

To konkrete produktmatch skal afklares før mikronæringsberegningen: mælkepost 170872 er amerikansk mælk tilsat vitamin A og D; tofupost 172475 er fast tofu fældet med calciumsulfat. Generiske danske produkter kan ikke uden videre antages at have samme berigelse eller calciumindhold. Det er udviklerens opgave at implementere kilde-/produktmatch, ukendte værdier, snapshots og ugekontrol; fagpersonen skal godkende referencevalg og relevante begrænsninger.

Primære referencekapitler hentet til gennemgangen:

- https://pub.norden.org/nord2023-003/vitamin-d-.html
- https://pub.norden.org/nord2023-003/vitamin-b12.html
- https://pub.norden.org/nord2023-003/calcium.html
- https://pub.norden.org/nord2023-003/potassium.html
- https://pub.norden.org/nord2023-003/iron.html
- https://pub.norden.org/nord2023-003/iodine-.html

Befolkningsreferencer er ikke individuelle mangeldiagnoser, og en enkelt dags beregnede værdi er ikke en klinisk måling. Ingen ny grænse er åbnet i produktion på baggrund af denne kildekontrol.
