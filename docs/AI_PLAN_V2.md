# SHAZ: OpenAI-genererede, aktiverbare planer

Version: openai-active-plan-v2. Forbliver staging indtil frigivelse.

- Klienten indsamler mål, uge, kost og en kort skadebeskrivelse. Ingen separat helbredsside for mad; tidligere oplyste medicinske risici slettes ikke.
- Numeric inputs har tekstbuffer; tomt bliver ikke 0.
- OpenAI vælger faktiske øvelser, dosering og måltider fra servervaliderede kandidater. Det er ikke blot en ekstra AI-kommentar.
- Serveren kontrollerer skema, katalog-ID'er, udstyr pr. sted, tid, bevægelsesmønstre, energi, allergier og tilgængelige kilder. Den aktiverer intet før brugerens separate bekræftelse.
- Generering bruger dataminimerede input, særskilt samtykke til skadebeskrivelsen, store:false, begrænsede kald og 24-timers krypterede forslag. Det betyder ikke automatisk nul leverandørlogs.
- POST /api/ai/plan generate → valideret preview. POST apply med proposal-id → atomisk lagring af 100 programdage og madplanens 7-dages rotation. Gennemførte, flyttede eller påbegyndte pas og registreret mad bevares. Idempotent bekræftelse.
- Nye kalorieberegninger bruger hverdagsaktivitet og valgte ugeminutter frem for at videreføre en uigennemsigtig 1,6-faktor. Det er stadig et estimat med modelusikkerhed.
- Muskeloverskud er 150/250/350 kcal med 250 som udgangspunkt, ikke en garanti eller et universelt minimum.
- Aktuelle milde gener kan medføre konservativ, almindelig fitness uden berørte bevægelser. Akutte eller alvorlige symptomer, nylig operation og kendte medicinske restriktioner kræver faglig vurdering. Ingen AI-godkendt genoptræningsprotokol.

## Test og frigivelse
CI: eksisterende unit, integration, browser, ny faktisk planpersistens, idempotens, ejerskab, historikbevarelse og inputtømning. Modeloutput i CI er eksplicit syntetisk. Live modeltest er en separat, autoriseret POST /api/test/ai-probe, kun i den isolerede testdatabase; den sender fiktive profiler og ændrer ingen kundedata. Testflag AI_PLAN_ENABLED; produktion kræver særskilt frigivelse.

## Fagligt grundlag og begrænsninger
Mifflin et al. (1990), PMID 2305711: hvilestofskifte, ikke en direkte måling af samlet forbrug. Aktivitetskoefficienterne er produktantagelser og skal kalibreres mod faktiske registreringer. Helms et al. (2023), PMID 37914977: større energioverskud giver ikke automatisk større muskeltilvækst; mere vægtøgning var primært forbundet med mere fedt. API-format: https://developers.openai.com/api/docs/guides/structured-outputs .
