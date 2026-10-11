# EVENEMANGSKALENDER – PROMPT v3

## 0. INSTÄLLNINGAR (ändra bara här)

```
REGIONER:  Kalmar län (K), Skåne län (S)
PERIOD:    vecka 42
ÅR:        auto
TIDIGARE:  ingen
```

- **REGIONER**: län, med ID-prefix inom parentes. Ett landskap går också, t.ex. `Västergötland (VG)`; då fyller du själv i dess kommuner i data.json.
- **PERIOD**: `vecka N` (ISO-vecka, måndag–söndag) eller `månad oktober`.
- **ÅR**: `auto` = närmaste förekomst av perioden som inte helt har passerat, enligt svensk tid. Eller ett årtal.
- **TIDIGARE**: `ingen`, eller data.json från förra körningen (bifogad). Dess källor kontrolleras först.

Arbeta självständigt och ställ inga frågor. Är något oklart: välj standardvärdet i denna prompt, skriv valet som en mening i `val` i data.json och fortsätt. Valen kommer automatiskt med i slutrapporten.

## 1. UPPDRAG

Ta fram en kalender per region över öppna evenemang under perioden som hjälper arbetssökande, vuxna som vill studera och företagare: jobb- och yrkesmässor, rekryteringsträffar, öppet hus i vuxenutbildningen, frukost- och nätverksmöten för företagare, starta eget-träffar och seminarier om kompetensförsörjning.

Tre principer, i prioritetsordning:

1. **Korrekt före fullständigt.** Ett felaktigt evenemang i kalendern är värre än ett som saknas. Hitta aldrig på uppgifter. Det som källan inte anger blir `null` och visas som "ej angivet".
2. **Samma underlag ger samma resultat.** Bedöm enligt avsnitt 5 och skriv texterna enligt avsnitt 6. Allt annat – layout, taggar, sortering, ID, filnamn och kontroller – bestäms av skriptet. Gör inga egna format- eller stilval.
3. **Spårbart.** Varje evenemang i kalendern har en direktlänk och ett ordagrant belägg från arrangören.

## 2. VERKTYGET bygg_kalender.py

Skriptet är bifogat eller ligger i arbetskatalogen (kopiera det dit om det ligger någon annanstans). Det räknar ut datum, listar kommunerna, validerar data.json, bygger Excel, HTML och PDF med fast mall och förberäknad paginering, kör alla kvalitetskontroller och skriver slutrapporten.

- Ändra aldrig skriptet. Det enda du skriver är data.json.
- Kör `python bygg_kalender.py test` först. Saknas något i miljön: installera det (`pip install playwright openpyxl pypdf pypdfium2 pillow`, vid behov `python -m playwright install chromium`) och kör igen. Misslyckas testet av något annat skäl: fortsätt och redovisa testets utskrift under Avvikelser från specifikationen.
- Finns inget skript: gör researchen ändå, leverera data.json enligt avsnitt 6 och skriv i slutrapporten att HTML, PDF och Excel inte kunde byggas.

## 3. ARBETSGÅNG (i denna ordning)

1. `python bygg_kalender.py test`
2. `python bygg_kalender.py init` med värdena från avsnitt 0, till exempel
   `python bygg_kalender.py init --regioner "Kalmar län (K)" "Skåne län (S)" --period "vecka 42" --ar auto`
   (lägg till `--tidigare FIL` om TIDIGARE är satt). Init skapar `arbete/data.json` med periodens datum, kontrolldatum, kommunlistor och sökfrågor. Skriv ut periodens datum innan du börjar söka.
3. Research enligt avsnitt 4. Logga varje källa i regionens `kallor` medan du arbetar.
4. Bedöm varje kandidat enligt avsnitt 5. För in alla i `evenemang`, även obekräftade och uteslutna.
5. Fyll i fälten och texterna enligt avsnitt 6. Kör `python bygg_kalender.py kontroll arbete/data.json` och rätta tills den visar 0 fel.
6. Kör `python bygg_kalender.py bygg arbete/data.json`. Rätta data.json och bygg om tills utskriften slutar med `ALLA KONTROLLER GODKÄNDA` (avsnitt 7).
7. Granska bilderna som skriptet listar (avsnitt 7).
8. Leverera enligt avsnitt 8.

Kan du köra underagenter parallellt: låt en underagent per region göra steg 3–4 med denna prompt och lämna regionens `kallor` och `evenemang` som JSON. Du för in dem i data.json.

Måste du avbryta researchen i förtid, till exempel på grund av en tidsgräns: bygg ändå med det du har. Det som inte hann kontrolleras redovisas automatiskt som researchluckor.

## 4. RESEARCH

Gör hela protokollet för varje region, i denna ordning. Det är protokollet som gör resultatet jämnt mellan körningar. Är TIDIGARE satt: börja med källorna i `tidigare_kallor`.

1. **Regionala aktörer** (typ inom parentes):
   - regionen, Region X (`region`)
   - länsstyrelsen (`lansstyrelse`)
   - Arbetsförmedlingens evenemang och mässor, filtrerade på länet (`af`)
   - handelskammare, NyföretagarCentrum, Almi, Företagarna, Svenskt Näringsliv (`naringsliv`)
   - science parks, inkubatorer, energikontor, branschorganisationer, IUC (`innovation`)
   - universitet och högskolor, bara evenemang som är öppna för allmänheten (`larosate`)
2. **Sökningar** (`sokning`): kör alla `sokfragor` i data.json ordagrant – 14 per region, där sökorden är kombinerade med regionen och periodens månad. Fler sökningar är tillåtna, till exempel med namnen på de största kommunerna.
3. **Kommunerna**, för varje kommun i regionens `kommuner`:
   - kommunens evenemangskalender eller näringslivssida (`kommun`)
   - komvux eller vuxenutbildningen (`komvux`)
   - lokala näringslivsbolag och företagarföreningar loggas som `naringsliv`, med kommunen angiven.
4. **Aggregatorer och regionala kalendrar** (`aggregator`): bara för att hitta kandidater, aldrig som verifiering.

Logga varje källa du har öppnat, även de utan träff och de som inte gick att läsa:

```json
{"typ": "kommun", "kommun": "Nybro", "url": "https://…", "fraga": null, "resultat": "inga", "notering": null}
```

`resultat` är `kandidater`, `inga` eller `ej_lasbar`. För sökningar anges `fraga` i stället för `url`. Logga aldrig en källa som du inte har öppnat. `kontroll` visar täckningen per kommun och källtyp, och det som saknas blir automatiskt researchluckor i Excel och slutrapport.

Researchen är klar när varje kommun har både `kommun` och `komvux`, varje källtyp i punkt 1 har minst en post, alla sökfrågor är körda och alla kandidater är bedömda.

## 5. BEDÖMNING

**VERIFIERAD** betyder att arrangörens egen sida, eller en anmälningssida som arrangören länkar till (till exempel Trippus, Eventbrite eller Teams), uttryckligen anger allt detta – i text, i sidans adress eller i sidans maskinläsbara data (JSON-LD, ICS):

- år
- datum inom perioden
- starttid
- plats eller "digitalt"

Kopiera de rader som visar detta ordagrant till `belagg`.

Pröva varje kandidat mot reglerna i tur och ordning. Den första regel som träffar avgör.

| Regel | Kandidaten … | status |
|---|---|---|
| R1 | har datum utanför perioden eller fysisk plats utanför regionen | `utesluten` |
| R2 | handlar inte om jobb, utbildningsvägledning, arbetsgivarkontakter, företagande eller kompetensförsörjning | `utesluten` |
| R3 | har en stängd målgrupp: endast studenter vid ett visst lärosäte, endast elever, endast interna deltagare eller en stängd kurs | `utesluten` |
| R4 | är ett slutet medlemsevenemang eller slutsålt utan väntelista. (Öppet för alla men med medlemspris: gå vidare.) | `utesluten` |
| R5 | är en betald kurs eller kursserie, en kongress för en enda snäv yrkesgrupp eller ren regelinformation utan karriär- eller företagarinnehåll | `utesluten` |
| R6 | är digitalt utan tydlig koppling till regionen (arrangör, målgrupp eller finansiering) | `utesluten` |
| R7 | uppfyller inte VERIFIERAD (till exempel bara tidigare års upplaga, bara aggregator eller ingen starttid) | `obekraftad` |
| R8 | har ställts in av arrangören | `installt` |
| – | träffas inte av någon regel | `verifierad`, eller `vantelista` om det är fullbokat med väntelista |

Blandad publik (till exempel elever och arbetssökande) och väntelista hindrar inte att ett evenemang tas med.

Fler regler:

- Om aggregator och arrangör anger olika uppgifter gäller arrangörens. Skriv avvikelsen i `osakerheter`.
- Varje evenemang förs in en gång per region. Ett evenemang kan finnas i två regioner bara om det är digitalt och har koppling till båda.
- Flerdagarsevenemang: en post med `datum` = första dagen och `datum_slut` = sista dagen. Skriptet visar det under den första dagen inom perioden, med hela intervallet.
- Samma evenemang vid flera tillfällen (till exempel drop-in tisdag och torsdag): en post per tillfälle.
- En passerad anmälningsfrist betyder inte att anmälan är stängd. Ange `tidsfrist` ändå; skriptet markerar den som passerad.

Exempel att kalibrera mot:

- Öppet hus på komvux, "alla välkomna", med år, datum, tid och plats på kommunens sida → `verifierad`, typ Öppet hus.
- Karriärdag för ett universitets studenter → `utesluten`, R3.
- Frukostmöte "endast för medlemmar" → `utesluten`, R4. Samma frukostmöte med "250 kr för icke-medlemmar" → gå vidare.
- Rikstäckande webbinarium om nya momsregler → `utesluten`, R5.
- Jobbmässa som bara finns i en aggregator, där arrangörens sida visar förra årets datum → `obekraftad`.
- Arrangörens sida anger "tisdag 13 oktober kl. 17.30" men inget år, varken i text, adress eller maskinläsbar data → `obekraftad`.

## 6. DATA OCH TEXTER

data.json innehåller `_mall_evenemang` med alla fält. Kopiera mallen för varje kandidat och ersätt varje platshållare med ett värde eller `null`. Skriptet stoppar okända fält, kvarlämnade platshållare och värden utanför vokabulären.

**Alla kandidater:** `status`, `titel` och `kalla`. `utesluten` kräver `regel` (R1–R6) och `skal`. `obekraftad` och `installt` kräver `skal`. Övriga fält fylls i när uppgiften finns hos källan, annars `null`; de syns i Excel avsnitt B.

**Kalenderevenemang** (`verifierad`, `vantelista`) fylls i helt:

| Fält | Regel |
|---|---|
| `titel` | Arrangörens titel ordagrant, på originalspråket, utan emojier. |
| `arrangor` | Arrangören eller arrangörerna, fullständigt. Är arrangören inte verifierad: `null` (raden utelämnas på kortet). |
| `arrangor_kort` | Bara om `arrangor` är längre än 90 tecken: en kortare form på högst 90 tecken. "i samarbete med" blir "med" automatiskt. |
| `typ` | Exakt en av: Mässa, Seminarium, Konferens, Nätverksträff, Frukostmöte, Lunchträff, Workshop, Rekryteringsträff, Öppet hus. Använd arrangörens egen benämning när den finns i listan, annars den som bäst beskriver formen. |
| `beskrivning` | Se nedan. |
| `datum`, `datum_slut` | ÅÅÅÅ-MM-DD. `datum_slut` bara för flerdagarsevenemang. |
| `tid_start`, `tid_slut` | HH:MM (24 h). `tid_slut` är `null` om bara starttiden anges. |
| `format` | `plats`, `digitalt` eller `hybrid`. |
| `kommun`, `ort`, `lokal`, `adress` | Kommunen där evenemanget äger rum (den måste finnas i regionens lista), orten, lokalen och gatuadressen utan postnummer. Digitalt: `kommun` och `ort` är `null`. |
| `preliminar_lokal` | `true` om arrangören kallar lokalen preliminär. |
| `digital_plattform` | Till exempel Teams eller Zoom, annars `null`. |
| `regional_koppling` | Krävs om `format` är `digitalt`: vad som kopplar evenemanget till regionen. |
| `dropin` | HH:MM–HH:MM om evenemanget har en drop-in-tid. |
| `pris` | Prisuppgiften ordagrant, så som källan anger den (till Excel). |
| `pris_tagg` | `Gratis` · `Fri entré` (bara mässor) · `150 kr` · `150 kr ex moms` · `150 kr medlem / 250 kr övriga ex moms`. Okänt pris, eller ett pris som inte passar något mönster (till exempel "från 150 kr"): `null`. |
| `villkor` | Lista med taggar, bara ur: `Endast [grupp]`, `Från [ålder] år`, `För [målgrupp]`, `Begränsat antal platser`, `Bindande anmälan`, `Uteblivande [belopp] kr ex moms`. (`Väntelista` läggs till automatiskt.) |
| `ovrigt` | Högst en tagg på högst 40 tecken om något annat som påverkar deltagandet, till exempel `Del 2: workshop 23 okt`. |
| `anmalan` | `kravs`, `ingen` eller `okand`. |
| `tidsfrist` | Sista anmälningsdag ÅÅÅÅ-MM-DD, annars `null`. |
| `lank` | Direktlänk till evenemangets egen sida. Finns bara en samlingssida: länka dit och sätt `samlingssida` till `true`. |
| `kalla` | Var kandidaten hittades och var den verifierades, till exempel "Hittad via Arbetsförmedlingen, verifierad på nybro.se". |
| `belagg` | Ordagrant citat från arrangörens sida som visar år, datum och starttid. |
| `malgrupp`, `deltagarkrav`, `anmalan_text` | Källans uppgifter, kort (till Excel). |
| `osakerheter` | Avvikelser och tveksamheter, till exempel "Aggregatorn anger 09:00, arrangören 09:30". |
| `kontrolldatum` | `null`. Ange ett datum bara om evenemanget kontrollerades en annan dag än det globala kontrolldatumet. |

Vanliga benämningar och deras `typ`:

- jobbmässa, yrkesmässa, utbildningsmässa → Mässa
- frukost, lunch → Frukostmöte, Lunchträff (bara när evenemanget uttryckligen är en frukost eller lunch)
- föreläsning, webbinarium, informationsmöte → Seminarium
- konferens, branschdag, heldag med flera talare → Konferens
- after work, mingel, nätverkskväll → Nätverksträff
- rekryteringsevent, jobbspeeddating, arbetsgivarträff → Rekryteringsträff
- öppet hus, studiebesök, drop-in hos skola → Öppet hus
- verkstad, praktiskt arbetspass → Workshop

**beskrivning**: en mening på 60–115 tecken som får plats på högst två rader på kortet.

- Mönster: "[Typ] om/för [innehåll eller målgrupp][, med X]."
- Upprepa inte titel, tid eller pris. Skriv sakligt, utan säljande ord och utan utropstecken.
- Exempel:
  - "Frukostmöte om rekrytering och kompetensförsörjning för små och medelstora företag, med Almi."
  - "Rekryteringsträff där arbetsgivare inom vård och omsorg möter arbetssökande."
  - "Öppet hus för vuxna som vill läsa in gymnasiet, byta yrke eller lära sig svenska."

**Det här sköter skriptet – gör det inte själv:** ID (K1 … i kalendern, KU1 … i avsnitt B), sortering (datum, starttid, titel A–Ö), dagsrubriker ("Tisdag 13 oktober"), tidsraden ("07:30–09:00"), platsraden ("Lokal, Gatuadress, Ort", "Digitalt", "(preliminärt)"), taggarna i fast ordning (typ; Digitalt, Även digitalt, Drop-in, Pågår 13–15 oktober; pris; villkor; övrigt; anmälan sist), anmälningstaggen ("Anmäl senast 14 oktober", eller "Anmälan krävs" när fristen saknas eller har passerat), rubriker, Excel-format och filnamn.

Fiktivt exempel på en kalenderpost (återanvänd aldrig innehållet):

```json
{
  "status": "verifierad", "regel": null, "skal": null,
  "titel": "Företagarfrukost: Rekrytera rätt",
  "arrangor": "Exempelstads kommun, näringslivsenheten i samarbete med Almi",
  "arrangor_kort": null, "typ": "Frukostmöte",
  "beskrivning": "Frukostmöte om rekrytering och kompetensförsörjning för små och medelstora företag, med Almi.",
  "datum": "2026-10-13", "datum_slut": null, "tid_start": "07:30", "tid_slut": "09:00",
  "format": "plats", "kommun": "Exempelstad", "ort": "Exempelstad", "lokal": "Stadshuset", "adress": "Storgatan 1",
  "preliminar_lokal": false, "digital_plattform": null, "regional_koppling": null, "dropin": null,
  "malgrupp": "Företagare", "deltagarkrav": null, "pris": "Kostnadsfritt", "pris_tagg": "Gratis",
  "villkor": ["Begränsat antal platser"], "ovrigt": null,
  "anmalan": "kravs", "anmalan_text": "Via formulär på sidan", "tidsfrist": "2026-10-09",
  "lank": "https://exempelstad.invalid/evenemang/foretagarfrukost", "samlingssida": false,
  "kalla": "Hittad och verifierad i kommunens evenemangskalender",
  "belagg": "Tisdag 13 oktober 2026, kl. 07.30–09.00, Stadshuset, Storgatan 1",
  "osakerheter": null, "kontrolldatum": null
}
```

## 7. BYGG OCH KONTROLL

`bygg` gör i ordning: validering → Excel → mätning av rubrik, dagsrubriker och kort i webbläsaren → paginering enligt fasta regler → HTML → PDF (Chromium, A4, marginal 0, med bakgrund) → kontroller → slutrapport.

Kontrollerna, som alla måste vara OK:

- **Data:** antal kort i HTML = länkar i PDF = rader i Excel A. Alla datum inom perioden, inga dubbletter, unika ID.
- **Layout:** varje beskrivning högst 2 rader, tiden bryts inte, huvudrubriken på en rad, varje sida 297 mm, sista kortet minst 10 mm ovanför underkanten, ingen dagsrubrik ensam sist på en sida, inget överlapp eller dolt innehåll, kortens kolumner i proportionen 2:1 och sidindelning enligt plan.
- **PDF:** A4, antal sidor = planerat, en länk per kort (ca 190 mm bred, rätt URI) och inbäddade typsnitt.
- **Raster:** varje sida rastreras i 100 dpi och gradienten når alla fyra hörn.
- **Mobil:** ingen horisontell scroll vid 390 px.

Vid FEL: rätta data.json, aldrig skriptet.

| Meddelande | Åtgärd |
|---|---|
| beskrivningen har fel längd, mer än 2 rader, tid, pris eller titel | Skriv om meningen enligt avsnitt 6. |
| arrangörsraden har fler än 90 tecken | Skriv `arrangor_kort`. |
| kolumnerna har inte proportionen 2:1 | Ett mycket långt ord i titel, lokal eller adress. Lägg in ett mjukt bindestreck (U+00AD) i ordet; titelns text ändras aldrig. |
| okänt fält, platshållare, fel format eller värde utanför vokabulären | Rätta fältet enligt avsnitt 6. |
| dubblett | Behåll en post och för över eventuella uppgifter som bara fanns i den andra. |

Kan ett FEL inte rättas via data.json, till exempel för att något i miljön saknas: leverera ändå och redovisa kontrollen och dess utskrift under Avvikelser från specifikationen.

Varningar stoppar inte bygget men ska åtgärdas eller bekräftas: täckningsluckor (gör den research som saknas, annars blir de researchluckor), belägg utan år, datum eller starttid (kontrollera verifieringen) och möjliga dubbletter.

**Granska bilderna.** Öppna varje PNG som `bygg` listar under GRANSKA BILDERNA. Kontrollera att gradienten går ut i kanterna, att inget överlappar eller är avskuret, att å, ä, ö och tankstreck visas rätt och att alla kort har samma uppbyggnad. Hittar du ett fel som kontrollerna missade: rätta data om det går, annars beskriv felet under Avvikelser från specifikationen.

## 8. LEVERANS OCH SLUTRAPPORT

Leverera filerna i `leverans/` så att användaren kan ladda ned dem:

- `V42_2026_Kalmar_Evenemang.html` och `.pdf` – en per region med verifierade evenemang. En region utan verifierade evenemang får ingen kalender.
- `V42_2026_Evenemang_Källunderlag.xlsx`
- `V42_2026_data.json` – bifoga den som TIDIGARE nästa gång.

Vid månadsurval börjar filnamnen med `Oktober_2026_`. Leverera inga PNG- eller infografikfiler.

Avsluta svaret med innehållet i `arbete/rapport.md`, oförändrat. Det har exakt denna struktur:

```
| Region | Verifierade evenemang | PDF-sidor | Obekräftade/uteslutna |
- Osäkerheter: en punkt per evenemang med passerad frist, väntelista, preliminär lokal, länk till samlingssida, saknat pris eller annan osäkerhet
- Avvikelser från specifikationen: typsnitt och standardval
- Researchluckor: källor som inte gick att läsa, källor och kommuner som inte kontrollerades, kommuner utan träffar
```

Vill du lägga till något: skriv det före rapporten, inte i den.
