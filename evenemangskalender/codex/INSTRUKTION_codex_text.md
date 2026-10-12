# EVENEMANGSKALENDER v3 – textinstruktion för Codex (GPT-6.1 Sol)

> **Till användaren, inte till Codex.**
> - Välj GPT-6.1 Sol och resonemangsnivån Extra High.
> - Slå på live-sökning med `codex --search` eller `web_search = "live"`, och tillåt nätverk i sandlådan.
> - Fyll i startprompten nedan och skicka den tillsammans med hela texten.

```
KÖR EVENEMANGSKALENDER v3
REGIONER: Skåne län (S)
PERIOD: månad november
ÅR: 2026
TIDIGARE:
```

## 0. Start

Instruktionen körs bara när meddelandet innehåller en startprompt som börjar med `KÖR EVENEMANGSKALENDER v3`. Startpromptens värden gäller.

| Fält | Innehåll |
|---|---|
| REGIONER | Ett eller flera län, med ID-prefix inom parentes. Utan prefix används första bokstaven, och om två regioner skulle få samma bokstav används två bokstäver. |
| PERIOD | `vecka N`, `månad [namn]` eller `ÅÅÅÅ-MM-DD–ÅÅÅÅ-MM-DD`. |
| ÅR | Tomt betyder närmaste förekomst av perioden som inte helt har passerat, enligt svensk tid. |
| TIDIGARE | Sökväg till förra körningens `data.json`, eller tomt. |

- Saknas startprompten: svara bara "Instruktionen är inläst. Skicka startprompten."
- Saknas REGIONER eller PERIOD: fråga efter just det.
- Ställ inga andra frågor. Är något oklart: välj standardvärdet i denna instruktion och skriv valet i `val` i `arbete/data.json`.

## 1. Mål, gränser och klart när

**Mål:** en klickbar PDF-kalender per region i `leverans/`, i A4 och med designen i BILAGA A. Varje kort ska vara en länk till arrangörens sida eller inlägg. Arbetsmarknad prioriteras, och jobbmässor och rekryteringsträffar är viktigast.

**Klart när:**
1. alla kontroller i avsnitt 8 är OK för varje region,
2. du har tittat på varje PDF-sida som bild, och
3. slutsvaret följer avsnitt 9.

**Aldrig:**
- Hitta på eller gissa uppgifter. Det som saknas blir `null` och visas inte.
- Verifiera mot en aggregator.
- Ändra CSS, skript eller kortens uppbyggnad i BILAGA A, eller dela upp korten på sidor själv. Mallen gör sidindelningen.
- Kringgå inloggning, betalvägg, captcha eller spärr. Logga källan som `ej_lasbar` och gå vidare.
- Leverera PNG, Excel, HTML eller rapporter till användaren. Arbetsfiler stannar i `arbete/`.

Uppgiften är lång. Håll planen aktuell och sluta inte förrän kriterierna under "Klart när" är uppfyllda.

## 2. Förberedelser

1. **Plan.** Lägg upp avsnitt 2–9 som steg i plan-verktyget.
2. **Miljö.**
   - Installera det som behövs: `pip install playwright pypdf pypdfium2 pillow` och `python -m playwright install chromium`.
   - Testa genom att rendera en liten sida till PDF.
   - Saknas både Arial och Liberation Sans: installera fonts-liberation, eller lägg Liberation Sans i `~/.fonts` och kör `fc-cache`.
   - Kontrollera nätet med `curl -sI https://www.arbetsformedlingen.se`.
   - Ger webbsökningen bara gamla, cachade resultat: hämta sidor direkt och skriv det i `val`.
3. **Period.**
   - Räkna med Python: ISO-vecka är `date.fromisocalendar(år, nr, 1)` plus 6 dagar. En månad går från första till sista dagen.
   - Skriv raden `Inställningar: [regioner med prefix] · [period] = [första–sista datum] · kontrolldatum [idag]`.
4. **Kommuner.**
   - Lista varje läns kommuner, helst från SCB:s "Län och kommuner i kodnummerordning".
   - Kontrollera antalet: Stockholm 26, Uppsala 8, Södermanland 9, Östergötland 13, Jönköping 13, Kronoberg 8, Kalmar 12, Gotland 1, Blekinge 5, Skåne 33, Halland 6, Västra Götaland 49, Värmland 16, Örebro 12, Västmanland 10, Dalarna 15, Gävleborg 10, Västernorrland 7, Jämtland 8, Västerbotten 15, Norrbotten 14.
   - Sortera kommunerna efter folkmängd, största först.
5. **Filer.**
   - Spara avsnitt 3.2 och 4–6 ordagrant i `arbete/regler.md`. Underagenterna läser den.
   - Skapa `arbete/data.json` med `period`, `kontrolldatum`, `val: []` och `regioner: [{namn, kort, prefix, kommuner, kallor: [], evenemang: []}]`.
   - Finns TIDIGARE: läs dess `kallor`. De kontrolleras först.

## 3. Research med underagenter

### 3.1 Fördelning

Underagenter startas bara om du uttryckligen ber om dem, så gör det. Gör i första hand så här, med `spawn_agents_on_csv`:

1. Skapa `arbete/uppdrag.csv` med kolumnerna `id,region,uppgift,kallor`. Varje region får dessa rader, i denna ordning så att jobbmässorna startar först:
   - **Sökningar, jobbmässor A:** jobbmässa, jobb- och utbildningsmässa, rekryteringsmässa, rekryteringsträff, rekryteringsdag, rekryteringsevent.
   - **Sökningar, jobbmässor B:** framtidsmässa, kompetensmässa, sommarjobbsmässa, jobbdag, samt fraserna "träffa arbetsgivare", "ta med ditt CV" och snabbintervjuer, som hittar mässor med egna namn. Sök också "digital jobbmässa" och "digital rekryteringsträff" utan regionnamn.
   - **Mässlistor:** allamassor.se/jobbmassor och syvarna.com/jobbmassor (länets sida). Arbetsförmedlingen hänvisar själv till allamassor.se.
   - **Arbetsförmedlingen:** evenemang, jobbmässor och rekryteringsträffar i länet.
   - **Sociala medier:** arrangörers egna inlägg på LinkedIn och Facebook, till exempel `site:linkedin.com jobbmässa [region]`. Bara inlägg som går att läsa utan inloggning.
   - **En rad per kommun:** kommunens evenemangskalender, arbetsmarknadsenhet, komvux/vuxenutbildning och näringslivssida, `site:[kommun].se jobbmässa`, samt TIDIGARE-källor för kommunen.
   - **Regionen och länsstyrelsen.**
   - **Lärosäten:** bara evenemang som är öppna för allmänheten, till exempel öppet hus och utbildningsmässor.
   - **Sökningar, utbildning och övrigt:** utbildningsmässa, komvuxmässa, komvux öppet hus, yrkesutbildning, studie- och yrkesvägledning, kostnadsfri kompetensutveckling, starta eget, företagarmässa.
   - **Starta eget:** Almi och NyföretagarCentrum.
   - **Aggregatorer och anmälningssidor:** jobbklick.se, simplesignup.se, confetti.events, trippus.net, eventbrite.se. Dessa och mässlistorna ger bara kandidater, och varje kandidat verifieras hos arrangören.
2. Anropa `spawn_agents_on_csv` med:
   - `csv_path: arbete/uppdrag.csv`, `id_column: id`, `max_concurrency: 6`, `output_csv_path: arbete/uppdrag_resultat.csv`
   - `output_schema: {"type":"object","required":["kallor","evenemang"],"properties":{"kallor":{"type":"array","items":{"type":"object"}},"evenemang":{"type":"array","items":{"type":"object"}}}}`
   - `instruction`: "Du söker evenemang i {region} under [första–sista datum]. Uppgift: {uppgift}. Börja med: {kallor}. Läs arbete/regler.md och följ den exakt. Rapportera exakt en gång med report_agent_job_result ett JSON-objekt {kallor, evenemang} med fälten i avsnitt 5. Hitta aldrig på något."
3. **Reserv** om verktyget saknas: starta vanliga `worker`-underagenter, högst sex åt gången, med samma rader och samma instruktion.
4. Läs `result_json` och för in allt i `data.json`. Kör om rader med fel en gång.

### 3.2 Arbetsmetod för varje underagent

- **Två varv.** Varv 1: sök brett efter kandidater, och utgå från att det finns fler än de första träffarna visar. Varv 2: verifiera varje kandidat på arrangörens egen sida.
- **Hämta sidor:**
  - curl för statisk HTML.
  - Playwright för kalendrar som renderas med JavaScript: scrolla, klicka "visa fler" och filtrera på perioden.
  - Läs JSON-LD (`"@type":"Event"`, `startDate`) och ICS. Där står ofta året även när det saknas i texten.
  - Följ länkar till anmälningssidor.
- **Varianter.** Sök på `[sökord] [kommun eller region] [månad år]`, på `vecka N`, på enskilda datum ("13 november"), med `site:` mot kommunens domän (`site:[kommun].se jobbmässa`) och med `site:linkedin.com`.
- **Om sökorden.** Orden för jobbmässor bygger på en webbsökning i oktober 2026 av vad arrangörerna faktiskt skriver. "Jobb- och utbildningsmässa" är kommunernas vanligaste namn. Många mässor har egna namn, som Jobbchansen, Jobbmatchen och Opportunity Day, och hittas bäst via fraserna "träffa arbetsgivare" och "ta med ditt CV". Kör varje sökord i din rad minst en gång.
- **Inlägg.** Läs bara inlägg som är öppna utan inloggning. Skriv inläggets publiceringsdatum i `uppdaterad`.
- **Logga** varje källa du har öppnat i `kallor` som `{typ, kommun, url eller fraga, resultat}`. `resultat` är `kandidater`, `inga` eller `ej_lasbar`. Logga aldrig något du inte har öppnat.
- **Returnera** alla kandidater du har bedömt, även uteslutna (med regel och skäl).

## 4. Bedömning

**VERIFIERAD** betyder att arrangörens egen sida, ett eget inlägg från arrangören (LinkedIn, Facebook) eller en anmälningssida som arrangören länkar till anger datum inom perioden, ort eller "digitalt", och år.
- Uppgifterna får stå i text, i adressen eller i JSON-LD/ICS.
- **Saknas året** får det räknas fram, om sidan eller inlägget är publicerat eller uppdaterat under periodens år eller halvåret före och en angiven veckodag stämmer med datumet det året. Skriv publicerings- eller uppdateringsdatumet i `uppdaterad`. En veckodag som inte stämmer tyder på en gammal sida, och då blir posten `obekraftad`.
- **Starttid krävs inte.** Leta efter den, även på anmälningssidan. Saknas den blir `tid_start` `null`, och kortet visar "Tid ej angiven".
- Kopiera det som visar detta ordagrant till `belagg`.

Att missa ett evenemang är värre än att visa ett med "Tid ej angiven". Men allt på kortet ska komma från arrangören, eftersom arbetssökande läser kalendern direkt.

Pröva reglerna i ordning. Första regel som träffar avgör.

| Regel | Om | status |
|---|---|---|
| R1 | datum utanför perioden eller plats utanför regionen | `utesluten` |
| R2 | inte arbetsmarknad, kompetensutveckling eller företagande | `utesluten` |
| R3 | stängd målgrupp: bara inbjudna, elever, pensionärer, studenter vid ett visst lärosäte, deltagare i en insats eller ett visst företags anställda; evenemang som uttalat riktar sig till yrkesverksamma i sin yrkesroll (till exempel HR, chefer, en viss yrkesgrupp, fackmässor); stängd kurs | `utesluten` |
| R4 | slutet medlemsevenemang, eller slutsålt utan väntelista. Öppet för alla men med medlemspris: gå vidare | `utesluten` |
| R5 | kompetensutveckling som kostar, betald kurs, ren regelinformation | `utesluten` |
| R6 | digitalt utan koppling till regionen. Undantag: digitala jobbmässor och rekryteringsträffar | `utesluten` |
| R7 | inte VERIFIERAD | `obekraftad` |
| R8 | inställt | `installt` |
| – | ingen regel träffar | `verifierad`, eller `vantelista` om fullbokat med väntelista |

**Med i kalendern** när ingen regel träffar:
- Mässor av alla slag: jobb-, rekryterings-, utbildnings-, komvux-, framtids-, sommarjobbs- och företagarmässor.
- Evenemang för arbetssökande, unga 16–29 år, nyanlända och utrikes födda eller personer med funktionsnedsättning. Målgruppen visas med villkorstaggen `För [målgrupp]`.
- Blandad publik och väntelista hindrar inte. Har eleverna och allmänheten olika tider gäller allmänhetens tid.

**Kategori:**
- **Arbetsmarknad** (prioriterad): jobbmässor och rekryteringsträffar, utbildningsmässor, studie- och yrkesvägledning, öppet hus på komvux.
- **Kompetensutveckling**: bara kostnadsfri.
- **Företagande**: starta eget, företagarmässor, nätverk för företagare.

**Kvot:** Kompetensutveckling och Företagande får tillsammans vara högst 40 % per region.
- Taket är golv(2 × antal arbetsmarknadskort / 3).
- Överskottet får status `utesluten` med regel `R9`. Ta Företagande först, och därefter det som ligger senast i perioden.

**Övrigt:**
- Arrangörens uppgifter gäller före aggregatorns.
- Inga dubbletter. Samma titel, datum och tid räknas som dubblett, liksom samma länk, datum och tid.
- Flerdagarsevenemang: en post med `datum_slut`.
- Återkommande tillfällen: en post per tillfälle.
- En passerad anmälningsfrist betyder inte att anmälan är stängd.

**Kalibrering:**
- Gymnasiemässa, och yrkesmässa för högstadiet → R3.
- Karriärmässa eller arbetsmarknadsdag för ett lärosätes studenter, till exempel ARKAD → R3.
- Rekryteringsevent där man bara kan delta efter inbjudan → R3.
- Jobbmässa för en yrkesgrupp, till exempel vården eller ingenjörer → med, eftersom den riktar sig till jobbsökande.
- HR-konferens, chefsnätverk eller fackmässa → R3.
- Träff "för dig som är pensionär" → R3.
- Mässa för elever på förmiddagen och för alla på eftermiddagen → med, med eftermiddagens tid.
- "Endast för medlemmar" → R4.
- "Torsdag 12 november kl. 16.30" utan år, på en kommunsida uppdaterad 26 augusti 2026 → 2026, eftersom 12 november 2026 är en torsdag.
- Samma text på en sida som senast uppdaterades 2024, eller utan synligt uppdateringsdatum → `obekraftad`.
- Datum och ort hos arrangören, men inget klockslag → med, och kortet visar "Tid ej angiven".
- Inlägg publicerat 7 september 2026 om "onsdag 16 september kl. 13" → 2026, eftersom 16 september 2026 är en onsdag.
- Fjolårets sida → R1, men sök efter årets upplaga.
- Spel- eller hobbymässa → R2.

## 5. Datafält (ett objekt per evenemang i data.json)

| Fält | Innehåll |
|---|---|
| `status`, `regel`, `skal` | Status enligt avsnitt 4. Regel och skäl anges vid `utesluten`, och skäl även vid `obekraftad`. |
| `kategori` | `Arbetsmarknad`, `Kompetensutveckling` eller `Företagande` |
| `titel` | ordagrant, utan emojier |
| `arrangor` | arrangören |
| `typ` | `Mässa`, `Seminarium`, `Konferens`, `Nätverksträff`, `Frukostmöte`, `Lunchträff`, `Workshop`, `Rekryteringsträff` eller `Öppet hus`. Jobbmässa räknas som Mässa och webbinarium som Seminarium. |
| `beskrivning` | se avsnitt 6 |
| `datum`, `datum_slut` | ÅÅÅÅ-MM-DD |
| `tid_start`, `tid_slut` | HH:MM, eller `null` om arrangören inte anger någon tid |
| `format` | `plats`, `digitalt` eller `hybrid` |
| `kommun`, `ort`, `lokal`, `adress` | adressen utan postnummer |
| `preliminar_lokal` | true/false |
| `regional_koppling` | krävs om `format` är digitalt, utom för jobbmässor och rekryteringsträffar |
| `malgrupp` | målgruppen enligt källan, eller `null` |
| `dropin` | HH:MM–HH:MM |
| `pris_tagg` | `Gratis`, `Fri entré` (bara mässor), `150 kr`, `150 kr medlem / 250 kr övriga ex moms` eller `null` |
| `villkor` | lista ur: `Endast [grupp]`, `Från [ålder] år`, `För [målgrupp]`, `Begränsat antal platser`, `Bindande anmälan`, `Uteblivande [belopp] kr ex moms` |
| `ovrigt` | högst en tagg på högst 40 tecken |
| `anmalan` | `kravs`, `ingen` eller `okand` |
| `tidsfrist` | ÅÅÅÅ-MM-DD |
| `lank`, `samlingssida` | direktlänk till arrangörens sida eller inlägg; `samlingssida` är true om länken bara går till en samlingssida |
| `kalla` | var kandidaten hittades och var den verifierades |
| `belagg` | ordagrant citat med datum, år och starttid (det som anges) |
| `uppdaterad` | ÅÅÅÅ-MM-DD då sidan eller inlägget publicerades eller uppdaterades; krävs om året inte står i `belagg` |
| `osakerheter` | avvikelser och tveksamheter |

Efter sorteringen får kalenderposterna ID `[prefix]1, [prefix]2 …`, och övriga poster `[prefix]U1 …`.

## 6. Kort och texter

**Fält på kortet:**
- **Arrangörsrad:** högst 90 tecken. "i samarbete med" skrivs "med". Raden utelämnas om arrangören inte är verifierad.
- **Tid:** "HH:MM–HH:MM" med kort tankstreck, "HH:MM" om bara starttiden anges, eller "Tid ej angiven" om arrangören inte anger någon tid.
- **Plats:** "Lokal, Gatuadress, Ort", eller "Digitalt". Vid preliminär lokal läggs " (preliminärt)" till.
- **Beskrivning:** en mening på 60–115 tecken, högst två rader. Mönster: "[Typ] om/för [innehåll eller målgrupp][, med X]." Upprepa inte titel, tid eller pris. Saklig ton. Exempel: "Rekryteringsträff där arbetsgivare inom vård och omsorg möter arbetssökande."

**Taggar, i denna ordning:**
1. typ
2. `Digitalt`, `Även digitalt`, `Drop-in HH:MM–HH:MM` eller `Pågår d–d månad`
3. pris
4. villkor (`Väntelista` vid fullbokat)
5. övrigt
6. anmälningstaggen, alltid sist, med `class="tag dl"`:
   - `Anmäl senast [d månad]` om fristen inte har passerat
   - `Anmälan krävs` om anmälan krävs men fristen saknas eller har passerat
   - ingen tagg om ingen anmälan krävs

**Dagar och ordning:**
- Dagsrubrik: "Tisdag 3 november". Ett flerdagarsevenemang visas under sin första dag inom perioden.
- Sortering: datum, starttid (utan tid sist), titel A–Ö.

## 7. HTML och PDF

1. Generera `arbete/[filnamn].html` från BILAGA A med Python och `html.escape` på all text.
   - CSS och skript lämnas tecken för tecken.
   - Fyll i `<title>`, h1 och underrad:
     - h1: `EVENEMANG · VECKA [nr]`, `EVENEMANG · [MÅNAD]`, eller bara `EVENEMANG` vid datumintervall.
     - Underrad: `<b>[REGION I VERSALER]</b> · [datumintervall år]`.
   - Lägg en `<div class="day">` per dag, med dagens kort enligt mallens kortkod, i den enda `<section class="sheet" style="height:auto">`. Utelämna `<div class="o">` utan arrangör.
2. Skapa PDF:en med Playwright Chromium:
   - Fönster minst 1280 px brett. `page.goto(fil-URI)` och `wait_for_load_state("load")`.
   - `page.pdf(path=…, prefer_css_page_size=True, print_background=True, scale=1, margin=0 på alla sidor, display_header_footer=False)`.
   - Mallens skript lägger in ikonerna och delar upp korten på A4-sidor i webbläsaren.
3. **Filnamn:** `leverans/Evenemang_[Region]_[period].pdf`, där Region är länets namn utan "län" och utan genitiv-s, och mellanslag blir "_". Exempel: `Evenemang_Skåne_V47_2026.pdf`, `Evenemang_Skåne_November_2026.pdf`, `Evenemang_Skåne_2026-11-02_2026-11-15.pdf`.
4. En region utan kalenderposter får ingen PDF.

## 8. Kontroller

Skriv `arbete/kontroll.py` en gång och kör den efter varje bygge. Allt ska vara OK. Rätta data, aldrig mallen, och bygg om.

- **Data:**
  - Alla kalenderdatum ligger inom perioden.
  - Inga dubbletter, och unika ID.
  - Kvoten hålls.
  - Beskrivningarna har 60–115 tecken, utan tid, pris eller titel.
  - Taggarna kommer från vokabulären och står i rätt ordning.
  - Inga tomma fält visas.
- **Belägg:** hämta varje kalenderlänk på nytt (text och JSON-LD). Datumet, och starttiden om den anges, ska finnas där. Har året räknats fram ska `uppdaterad` ligga i periodens år eller halvåret före, och en veckodag i belägget ska stämma. Annars blir posten `obekraftad`. Det gäller också ett inlägg som inte längre går att läsa utan inloggning.
- **Webbläsare, efter laddning:**
  - Elementet `#kontroll` får inte finnas. Det skapas av mallens egen kontroll och betyder att en beskrivning har fler än 2 rader, att tiden bryts, att kolumnerna inte har proportionen 2:1 eller att huvudrubriken bryts.
  - Antalet `a.card` är lika med antalet kalenderposter, och varje `href` är lika med `lank`.
  - Varje `.sheet` är 297 mm hög.
  - Sista kortet slutar minst 10 mm ovanför sidans underkant.
  - Det sista elementet på varje sida är ett kort.
- **PDF (pypdf):**
  - Sidorna är A4, och antalet sidor är lika med antalet `.sheet`.
  - Varje kort har en länkannotering, cirka 190 mm bred och med rätt URI.
  - Typsnitten är inbäddade.
- **Bild:** rastrera varje sida i 100 dpi med pypdfium2 och titta på bilderna. Kontrollera att gradienten går ut i kanterna, att inget överlappar och att å, ä, ö och tankstreck visas rätt.
- **Länkar:** `curl -sIL` ska ge 2xx eller 3xx. Annars noteras det i `osakerheter`.

Om ett fel inte går att rätta via data: leverera ändå och nämn felet.

## 9. Slutsvar

- PDF:erna i `leverans/` som klickbara filer.
- En rad per region: antal kort, varav jobbmässor och rekryteringsträffar, och varav kompetensutveckling eller företagande.
- De viktigaste luckorna, högst fem rader: ej läsbara källor, kommuner som inte hanns med och obekräftade evenemang som är värda att följa upp.
- Sökvägen till `arbete/data.json`, att ange som TIDIGARE nästa gång.

## BILAGA A – HTML-mall (kopiera ordagrant och ersätt bara [hakparenteserna])

```html
<!doctype html><html lang="sv"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EVENEMANG · VECKA [nr] · [Region] · [datumintervall år]</title>
<style>
:root{--navy:#143460;--orange:#C25700;--card:#f7fbfc;--line:#d7e0e7;--tag:#e8edf1}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:Arial,"Liberation Sans",Helvetica,sans-serif;color:var(--navy);background:#477780;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet{width:210mm;height:297mm;padding:10mm;margin:0 auto 4mm;background:linear-gradient(135deg,#517fa6,#477780);position:relative;overflow:hidden;break-after:page;page-break-after:always}
.sheet:last-child{break-after:auto;page-break-after:auto;margin-bottom:0}
h1{font-size:32.5pt;font-weight:700;color:#fff;text-align:center;line-height:1.15;white-space:nowrap}
.sub{font-size:22.5pt;font-weight:400;color:#fff;text-align:center;line-height:1.2;margin-top:4mm;margin-bottom:7mm}
.sub b{font-weight:900}
.day{margin-top:8mm}
.day.first{margin-top:0}
.dh{margin-bottom:2mm;break-after:avoid}
.dh span{display:inline-block;background:var(--orange);color:#fff;font-size:16pt;font-weight:700;line-height:1.2;padding:1.4mm 3mm;border-radius:2mm}
a.card{display:block;background:var(--card);border-radius:4mm;padding:6mm;color:var(--navy);text-decoration:none;margin-bottom:2mm;break-inside:avoid}
a.card:last-child{margin-bottom:0}
a.card:hover,a.card:focus-visible{background:#e9f2f7}
a.card:active{background:#d9e8f0}
a.card:focus-visible{outline:3px solid var(--orange);outline-offset:1px}
.top{display:grid;grid-template-columns:2fr 1fr;column-gap:4mm}
.t{font-size:20pt;font-weight:700;line-height:1.15}
.o{font-size:12.5pt;margin-top:1.2mm;line-height:1.25}
.r{border-left:1px solid var(--line);padding-left:4mm}
.tm,.pl{display:flex;align-items:flex-start;gap:1.6mm}
.tm{font-size:15pt;font-weight:700;line-height:1.2;white-space:nowrap}
.pl{font-size:12.5pt;line-height:1.25;margin-top:1.6mm}
.tm svg{width:16.5pt;height:16.5pt;flex:none;margin-top:.2mm}
.pl svg{width:13.75pt;height:13.75pt;flex:none;margin-top:.2mm}
svg{fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.d{font-size:14pt;line-height:1.4;margin-top:3mm}
.tags{display:flex;flex-wrap:wrap;gap:1.6mm;border-top:1px solid var(--line);margin-top:3mm;padding-top:3mm}
.tag{font-size:12.5pt;line-height:1.2;padding:1mm 2.8mm;border-radius:999px;background:var(--tag);color:var(--navy)}
.tag.dl{background:#fff;color:var(--orange);border:1px solid var(--orange);padding:calc(1mm - 1px) calc(2.8mm - 1px)}
@page{size:A4;margin:0}
@media print{body{background:none}.sheet{margin:0}a.card{background:var(--card)!important}}
</style></head><body>
<section class="sheet" style="height:auto">
<h1>EVENEMANG · VECKA [nr]</h1>
<div class="sub"><b>[REGION]</b> · [datumintervall år]</div>
<div class="day"><div class="dh"><span>[Veckodag d månad]</span></div>
<a class="card" href="[direktlänk]" data-id="[ID]"><div class="top"><div class="l"><div class="t">[titel]</div><div class="o">[arrangör]</div></div><div class="r"><div class="tm"><span>[tid]</span></div><div class="pl"><span>[plats]</span></div></div></div><p class="d">[beskrivning]</p><div class="tags"><span class="tag">[tagg]</span><span class="tag dl">[anmälningstagg]</span></div></a>
</div>
</section>
<script>(function(){
var I=['<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.6"/></svg>'];
function A(q,r){return [].slice.call((r||document).querySelectorAll(q))}
A('.tm,.pl').forEach(function(e){if(!e.querySelector('svg'))e.insertAdjacentHTML('afterbegin',I[e.className=='tm'?0:1])});
var S=A('.sheet'),s=S[0],D=A('.day'),B,F=[];
D.forEach(function(d){d.remove()});S.slice(1).forEach(function(x){x.remove()});s.style.height='';
function blk(h){B=document.createElement('div');B.className=s.querySelector('.day')?'day':'day first';B.appendChild(h.cloneNode(true));s.appendChild(B)}
function ut(c){var r=s.getBoundingClientRect();return c.getBoundingClientRect().bottom-r.top>r.height*286.2/297}
D.forEach(function(d){var h=d.querySelector('.dh');B=null;A('a.card',d).forEach(function(c){
if(!B)blk(h);B.appendChild(c);
if(ut(c)&&A('a.card',s).length>1){c.remove();if(!B.querySelector('a.card'))B.remove();var n=document.createElement('section');n.className='sheet';s.after(n);s=n;blk(h);B.appendChild(c)}})});
A('a.card').forEach(function(c){var id=c.getAttribute('data-id'),R=document.createRange(),t=c.querySelector('.tm');R.selectNodeContents(c.querySelector('.d'));
if(R.getClientRects().length>2)F.push(id+': beskrivningen har fler än 2 rader');
if(t.scrollWidth>t.clientWidth)F.push(id+': tiden bryts');
if(Math.abs(c.querySelector('.l').offsetWidth/c.querySelector('.r').offsetWidth-2)>.05)F.push(id+': för långt ord i titel eller plats')});
var h=document.querySelector('h1');if(h&&h.scrollWidth>h.clientWidth)F.push('huvudrubriken bryts');
if(F.length){document.head.insertAdjacentHTML('beforeend','<style>@media print{#kontroll{display:none}}</style>');document.body.insertAdjacentHTML('beforeend','<div id="kontroll" style="position:fixed;top:0;left:0;right:0;z-index:9;padding:8px;background:#b00;color:#fff;font:14px Arial"></div>');document.getElementById('kontroll').textContent='KONTROLL: '+F.join(' · ')}
})();</script>
<script>(function(){var w=210/25.4*96;function f(){var s=Math.min(1,document.documentElement.clientWidth/w);document.body.style.zoom=s<1?s:""}if(!matchMedia("print").matches){f();addEventListener("resize",f)}})();</script>
</body></html>
```
