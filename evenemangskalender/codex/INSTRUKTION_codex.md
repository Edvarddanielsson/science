# EVENEMANGSKALENDER v3 – instruktion för Codex (GPT-6.1 Sol)

## 0. Start

Instruktionen körs bara av en startprompt som börjar med `KÖR EVENEMANGSKALENDER v3`. Startpromptens värden gäller:

- **REGIONER**: ett eller flera län, med ID-prefix inom parentes, t.ex. `Skåne län (S), Kalmar län (K)`.
- **PERIOD**: `vecka N` eller `månad [namn]`.
- **ÅR**: tomt betyder `auto` (närmaste förekomst som inte har passerat, svensk tid).
- **TIDIGARE**: sökväg till förra körningens `…_data.json`, eller tomt.

Saknas REGIONER eller PERIOD: fråga efter just det. Ställ inga andra frågor. Är något oklart: välj standardvärdet här och skriv valet i `val` i data.json.

## 1. Mål och klart när

**Mål:** en klickbar PDF-kalender per region över öppna evenemang under perioden. Arbetsmarknad prioriteras.

**Klart när:**

- `python bygg_kalender.py bygg arbete/data.json` slutar med `ALLA KONTROLLER GODKÄNDA`.
- Du har granskat PDF-sidorna som bilder.
- Ditt slutsvar innehåller bara PDF-filerna (en klickbar länk per fil) och högst fem rader om luckor och osäkerheter.

Excel, HTML och rapport skapas av skriptet som bifiler. De ska inte presenteras för användaren.

**Principer:**

- Korrekt före fullständigt. Hitta aldrig på något. Det som källan inte anger blir `null`.
- Allt mekaniskt sköts av `bygg_kalender.py`: datum, kommuner, sökfrågor, validering, taggar, sortering, paginering, PDF och kontroller. Ändra aldrig skriptet. Allt du skriver hamnar i `arbete/data.json`.
- Detta är en lång, grundlig uppgift. Kör med högsta resonemangsnivån. Stanna inte förrän kriterierna under "Klart när" är uppfyllda.

## 2. Förberedelser

1. Lägg upp arbetet i plan-verktyget med stegen i avsnitt 3–7, och håll planen uppdaterad.
2. Kör `python bygg_kalender.py test`. Saknas något: installera det med `pip install playwright openpyxl pypdf pypdfium2 pillow` och `python -m playwright install chromium`, och kör igen.
3. Kontrollera nätverket med `curl -sI https://www.arbetsformedlingen.se`.
   - Om webbsökningen bara ger cachade resultat (gamla datum, saknade 2026-sidor): hämta arrangörernas sidor direkt med curl eller Playwright. Skriv i `val` att sökningen inte gick live.
4. Kör `python bygg_kalender.py init --regioner … --period … --ar … [--tidigare …]`. Skriv ut periodens datum.

## 3. Research med underagenter

Starta underagenter (`worker`). Du måste uttryckligen be om dem, annars startas inga. Ge tre per region, högst sex samtidigt:

| Underagent | Källor |
|---|---|
| A, regionala aktörer | Arbetsförmedlingens evenemang för länet, regionen, länsstyrelsen, Almi, NyföretagarCentrum, Företagarna, handelskammaren, science parks, IUC och lärosäten (bara öppna evenemang) |
| B, kommunerna | Varje kommun i data.json, största först. Evenemangskalender, arbetsmarknadsenhet, komvux/vuxenutbildning och näringslivssida. Vid fler än 15 kommuner: dela på två agenter. |
| C, sökningar och aggregatorer | Alla `sokfragor` i data.json, med varianter: `vecka N`, enskilda datum, de största kommunernas namn, `site:arbetsformedlingen.se`, `site:[kommun].se evenemang`, `site:simplesignup.se`, `site:confetti.events`, `site:trippus.net`. Aggregatorer (allamassor.se, jobbklick.se, syvarna.com m.fl.) får bara ge kandidater. |

Varje underagent får avsnitt 4–5 i denna instruktion och regionens kommunlista. Den returnerar enbart JSON: `{"kallor": [...], "evenemang": [...]}`, med fälten från `_mall_kalla` och `_mall_evenemang` i data.json.

Arbetsmetod för underagenterna:

- **Två varv.** Varv 1: bred sökning, och utgå från att det finns fler kandidater än de första träffarna visar. Varv 2: verifiera varje kandidat på arrangörens egen sida.
- **Hämta sidor:**
  - curl för statisk HTML.
  - Playwright för kalendrar som renderas med JavaScript, med scroll och "visa fler" om det behövs.
  - Läs JSON-LD (`"@type":"Event"`, `startDate`) och ICS-filer. Där står ofta året även när det saknas i texten.
- **Logga** varje öppnad källa i `kallor`, med `resultat` som är `kandidater`, `inga` eller `ej_lasbar`. Logga aldrig en källa som inte har öppnats.
- **Mål per region:** minst 25 sökningar, alla källtyper, alla kommuner. Kontrollera täckningen med `python bygg_kalender.py kontroll arbete/data.json`, och gör den research som fattas innan du bygger.

Du slår ihop underagenternas JSON i data.json, tar bort dubbletter (arrangörens uppgifter vinner) och kör `kontroll`.

## 4. Bedömning

**VERIFIERAD** betyder att arrangörens egen sida, eller en anmälningssida som arrangören länkar till, anger år, datum inom perioden, starttid och plats eller "digitalt". Uppgifterna får stå i text, i sidans adress eller i JSON-LD/ICS. Kopiera det som visar detta ordagrant till `belagg`.

Pröva reglerna i ordning. Första regel som träffar avgör.

| Regel | Om | status |
|---|---|---|
| R1 | datum utanför perioden eller plats utanför regionen | `utesluten` |
| R2 | inte arbetsmarknad, kompetensutveckling eller företagande | `utesluten` |
| R3 | stängd målgrupp: bara studenter vid ett visst lärosäte, bara elever, interna deltagare, stängd kurs | `utesluten` |
| R4 | slutet medlemsevenemang, eller slutsålt utan väntelista. Öppet för alla men med medlemspris: gå vidare | `utesluten` |
| R5 | kompetensutveckling som kostar, betald kurs, kongress för en snäv yrkesgrupp, ren regelinformation | `utesluten` |
| R6 | digitalt utan koppling till regionen | `utesluten` |
| R7 | inte VERIFIERAD | `obekraftad` |
| R8 | inställt | `installt` |
| – | ingen regel träffar | `verifierad`, eller `vantelista` om fullbokat med väntelista |

**Kategori:**

- **Arbetsmarknad** (prioriterad): jobb- och yrkesmässor, rekryterings- och arbetsgivarträffar, studie- och yrkesvägledning, öppet hus på komvux.
- **Kompetensutveckling**: bara kostnadsfri.
- **Företagande.**

**Kvot:** Kompetensutveckling och Företagande får tillsammans vara högst 40 % per region, det vill säga högst 2 per 3 arbetsmarknadskort, avrundat nedåt. Skriptet räknar och anger vilka som ska strykas: Företagande först, därefter det som ligger senast i perioden. Sätt `utesluten` och regel `R9` på dem.

**Övrigt:**

- Flerdagarsevenemang: en post, med `datum` och `datum_slut`.
- Återkommande tillfällen: en post per tillfälle.
- Passerad anmälningsfrist betyder inte stängd anmälan. Ange `tidsfrist` ändå.

**Kalibrering:**

- Karriärdag för ett universitets studenter → R3.
- "Endast för medlemmar" → R4.
- Sidan anger "12 november kl. 16.30" men inget år, varken i text, adress eller JSON-LD → `obekraftad`.

## 5. Fält och texter

Använd `_mall_evenemang` i data.json. Ersätt varje platshållare med ett värde eller `null`. Skriptet stoppar okända fält, kvarlämnade platshållare och värden utanför vokabulären.

- **titel:** arrangörens titel ordagrant, utan emojier.
- **typ:** exakt en av Mässa, Seminarium, Konferens, Nätverksträff, Frukostmöte, Lunchträff, Workshop, Rekryteringsträff, Öppet hus. Jobbmässa räknas som Mässa och webbinarium som Seminarium.
- **beskrivning:** en mening på 60–115 tecken, högst två rader. Mönster: "[Typ] om/för [innehåll eller målgrupp][, med X]." Upprepa inte titel, tid eller pris. Exempel: "Rekryteringsträff där arbetsgivare inom vård och omsorg möter arbetssökande."
- **pris_tagg:** `Gratis`, `Fri entré` (bara mässor), `150 kr` eller `150 kr medlem / 250 kr övriga ex moms`. Okänt pris eller pris som inte passar mönstret: `null`.
- **villkor:** bara `Endast [grupp]`, `Från [ålder] år`, `För [målgrupp]`, `Begränsat antal platser`, `Bindande anmälan` och `Uteblivande [belopp] kr ex moms`.
- **adress:** utan postnummer.
- **lank:** direktlänk. Finns bara en samlingssida: sätt `samlingssida` till true.

## 6. Bygg och rätta

Kör `python bygg_kalender.py bygg arbete/data.json`. Rätta data.json, aldrig skriptet, tills utskriften slutar med `ALLA KONTROLLER GODKÄNDA`.

| Fel | Åtgärd |
|---|---|
| beskrivningen är för lång eller har fler än 2 rader | skriv om den kortare |
| kolumnerna har inte proportionen 2:1 | sätt ett mjukt bindestreck (U+00AD) i det långa ordet |
| kvoten överskrids | sätt R9 på de poster skriptet räknar upp |

Om ett fel inte går att rätta via data, till exempel för att något saknas i miljön: leverera ändå och nämn felet.

## 7. Granska och leverera

1. Öppna varje PNG under GRANSKA BILDERNA. Kontrollera gradienten, att inget överlappar, att å, ä och ö visas rätt och att korten ser likadana ut.
2. Kontrollera att varje kalenderlänk svarar med `curl -sIL`. En död länk är en osäkerhet.
3. Slutsvaret innehåller:
   - PDF:erna i `leverans/` som klickbara filer.
   - En rad per region: antal kort, varav kompetensutveckling eller företagande.
   - De viktigaste luckorna, högst fem rader.
   - Sökvägen till `…_data.json`, att använda som TIDIGARE nästa gång.
