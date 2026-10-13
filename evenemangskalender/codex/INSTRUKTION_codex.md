# EVENEMANGSKALENDER v3 – instruktion för Codex (GPT-6.1 Sol)

## 0. Start

Instruktionen körs bara av en startprompt som börjar med `KÖR EVENEMANGSKALENDER v3`. Startpromptens värden gäller:

- **REGIONER**: ett eller flera län, med ID-prefix inom parentes, t.ex. `Skåne län (S), Kalmar län (K)`.
- **PERIOD**: `vecka N` eller `månad [namn]`.
- **ÅR**: tomt betyder `auto` (närmaste förekomst som inte har passerat, svensk tid).
- **TIDIGARE**: sökväg till förra körningens `…_data.json`, eller tomt.

Saknas REGIONER eller PERIOD: fråga efter just det. Ställ inga andra frågor. Är något oklart: välj standardvärdet här och skriv valet i `val` i data.json.

## 1. Mål och klart när

**Mål:** en klickbar PDF-kalender per region över öppna evenemang under perioden. Arbetsmarknad prioriteras, och jobbmässor och rekryteringsträffar är viktigast.

**Klart när:**

- `python bygg_kalender.py bygg arbete/data.json` slutar med `ALLA KONTROLLER GODKÄNDA`.
- Du har granskat PDF-sidorna som bilder.
- Ditt slutsvar innehåller bara PDF-filerna (en klickbar länk per fil) och högst fem rader om luckor och osäkerheter.

Excel, HTML och rapport skapas av skriptet som bifiler. De ska inte presenteras för användaren.

**Principer:**

- Missa inga evenemang, men hitta aldrig på något. Det som källan inte anger blir `null`. Uppgifterna på korten måste stämma, eftersom arbetssökande läser kalendern direkt.
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
| A, regionala aktörer och mässlistor | Arbetsförmedlingens evenemang, jobbmässor, rekryterings- och informationsträffar i länet, även sidan "Delta i våra aktiviteter" (arbetsformedlingen.se/for-arbetssokande/sa-hittar-du-jobbet/aktiviteter, laddas med JavaScript), regionen, länsstyrelsen, Almi, NyföretagarCentrum och lärosäten (bara öppna evenemang). Mässlistorna allamassor.se/jobbmassor och syvarna.com/jobbmassor (länets sida); Arbetsförmedlingen hänvisar själv till allamassor.se. |
| B, kommunerna | Varje kommun i data.json, största först. Evenemangskalender, arbetsmarknadsenhet, komvux/vuxenutbildning och näringslivssida, samt `site:[kommun].se jobbmässa`. Vid fler än 15 kommuner: dela på två agenter. |
| C, sökningar, sociala medier och aggregatorer | Alla `sokfragor` i data.json, jobbmässorna först, med varianter: `vecka N`, enskilda datum, de största kommunernas namn, `site:arbetsformedlingen.se`, `site:simplesignup.se`, `site:confetti.events`, `site:trippus.net`. Arrangörers egna inlägg via `site:linkedin.com` och Facebook, bara om de går att läsa utan inloggning. Aggregatorer (jobbklick.se, eventbrite.se m.fl.) och mässlistor får bara ge kandidater. |

Varje underagent får avsnitt 4–5 i denna instruktion och regionens kommunlista. Den returnerar enbart JSON: `{"kallor": [...], "evenemang": [...]}`, med fälten från `_mall_kalla` och `_mall_evenemang` i data.json.

Arbetsmetod för underagenterna:

- **Två varv.** Varv 1: bred sökning, och utgå från att det finns fler kandidater än de första träffarna visar. Varv 2: verifiera varje kandidat på arrangörens egen sida.
- **Hämta sidor:**
  - curl för statisk HTML.
  - Playwright för kalendrar som renderas med JavaScript, med scroll och "visa fler" om det behövs.
  - Läs JSON-LD (`"@type":"Event"`, `startDate`) och ICS-filer. Där står ofta året även när det saknas i texten.
- **Sökorden** för jobbmässor bygger på en webbsökning i oktober 2026 av vad arrangörerna faktiskt skriver. Många mässor har egna namn, som Jobbchansen, Jobbmatchen och Opportunity Day, och hittas via fraserna "träffa arbetsgivare" och "ta med ditt CV". `sokfragor` innehåller också "digital jobbmässa" och "digital rekryteringsträff" utan regionnamn.
- **Logga** varje öppnad källa i `kallor`, med `resultat` som är `kandidater`, `inga` eller `ej_lasbar`. Mässlistor loggas som typ `massor` och inlägg som `sociala`. Logga aldrig en källa som inte har öppnats.
- **Mål per region:** minst 25 sökningar, alla källtyper, alla kommuner. Kontrollera täckningen med `python bygg_kalender.py kontroll arbete/data.json`, och gör den research som fattas innan du bygger.

Du slår ihop underagenternas JSON i data.json, tar bort dubbletter (arrangörens uppgifter vinner) och kör `kontroll`.

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
| R3 | stängd målgrupp: bara inbjudna, elever, pensionärer, studenter vid ett visst lärosäte, deltagare i en insats eller ett visst företags anställda; evenemang som uttalat riktar sig till yrkesverksamma i sin yrkesroll (till exempel HR, chefer, en viss yrkesgrupp, fackmässor); stängd kurs; gymnasiemässor och andra evenemang inför gymnasievalet, även dagar som är öppna för allmänheten; sommarjobbsmässor för skolungdom | `utesluten` |
| R4 | slutet medlemsevenemang, eller slutsålt utan väntelista. Öppet för alla men med medlemspris: gå vidare | `utesluten` |
| R5 | kompetensutveckling som kostar, betald kurs, ren regelinformation för företag | `utesluten` |
| R6 | digitalt utan koppling till regionen. Undantag: digitala jobbmässor och rekryteringsträffar | `utesluten` |
| R7 | inte VERIFIERAD | `obekraftad` |
| R8 | inställt | `installt` |
| – | ingen regel träffar | `verifierad`, eller `vantelista` om fullbokat med väntelista |

**Med i kalendern** när ingen regel träffar:

- Mässor av alla slag: jobb-, rekryterings-, utbildnings-, student-, komvux-, framtids- och företagarmässor. En sommarjobbs- eller säsongsmässa som uttryckligen är öppen för alla vuxna arbetssökande räknas som jobbmässa.
- Informationsträffar för arbetssökande, till exempel om arbetsmarknadsutbildningar, a-kassa, validering eller jobbsökning.
- Evenemang för arbetssökande, även när de bara är för den som är inskriven på Arbetsförmedlingen, unga 16–29 år, nyanlända och utrikes födda eller personer med funktionsnedsättning. Målgruppen visas med villkorstaggen `För [målgrupp]`.
- Blandad publik och väntelista hindrar inte. Har eleverna och allmänheten olika tider gäller allmänhetens tid.

**Kategori:**

- **Arbetsmarknad** (prioriterad): jobbmässor, rekryterings- och informationsträffar, utbildnings- och studentmässor, studie- och yrkesvägledning, öppet hus på komvux.
- **Kompetensutveckling**: bara kostnadsfri.
- **Företagande**: starta eget, företagarmässor, nätverk för företagare.

**Kvot:** Kompetensutveckling och Företagande får tillsammans vara högst 40 % per region, det vill säga högst 2 per 3 arbetsmarknadskort, avrundat nedåt. Minst 2 är alltid tillåtna, så kalendern blir aldrig tom bara på grund av kvoten. Skriptet räknar och anger vilka som ska strykas: Företagande först, därefter det som ligger senast i perioden. Sätt `utesluten` och regel `R9` på dem.

**Övrigt:**

- Flerdagarsevenemang: en post, med `datum` och `datum_slut`.
- Återkommande tillfällen, till exempel ett jobbcafé varje tisdag: en post för hela serien, på första tillfället i perioden, med övriga datum i `fler_datum`. Skriptet ger kortet taggen "Även 17, 24 november" och varnar om samma titel står på flera kort.
- Passerad anmälningsfrist betyder inte stängd anmälan. Ange `tidsfrist` ändå.

**Kalibrering:**

- Gymnasiemässa, även lördagen när den är öppen för allmänheten → R3.
- Mässa som är både gymnasiemässa och jobbmässa och uttryckligen bjuder in arbetssökande, till exempel Framtidsmässan i Kristianstad → med.
- Studentmässa inför högskola och YH, till exempel Saco Studentmässa → med.
- Sommarjobbsmässa för 16–20-åringar → R3. Sommarjobbsmässa "öppen för alla som vill jobba i sommar" → med.
- Yrkesmässa för högstadiet → R3.
- Informationsträff om en arbetsmarknadsutbildning för arbetssökande → med. Informationsträff om nya momsregler för företag → R5.
- Karriärmässa eller arbetsmarknadsdag för ett lärosätes studenter, till exempel ARKAD → R3.
- Rekryteringsevent där man bara kan delta efter inbjudan → R3.
- Jobbmässa för en yrkesgrupp, till exempel vården eller ingenjörer → med, eftersom den riktar sig till jobbsökande.
- HR-konferens, chefsnätverk eller fackmässa → R3.
- Träff "för dig som är pensionär" → R3.
- Jobbmässa för elever på förmiddagen och för alla på eftermiddagen → med, med eftermiddagens tid.
- "Endast för medlemmar" → R4.
- "Torsdag 12 november kl. 16.30" utan år, på en kommunsida uppdaterad 26 augusti 2026 → 2026, eftersom 12 november 2026 är en torsdag.
- Samma text på en sida som senast uppdaterades 2024, eller utan synligt uppdateringsdatum → `obekraftad`.
- Datum och ort hos arrangören, men inget klockslag → med, och kortet visar "Tid ej angiven".
- Inlägg publicerat 7 september 2026 om "onsdag 16 september kl. 13" → 2026, eftersom 16 september 2026 är en onsdag.
- Fjolårets sida → R1, men sök efter årets upplaga.
- Spel- eller hobbymässa → R2.

## 5. Fält och texter

Använd `_mall_evenemang` i data.json. Ersätt varje platshållare med ett värde eller `null`. Skriptet stoppar okända fält, kvarlämnade platshållare och värden utanför vokabulären.

- **titel:** arrangörens titel ordagrant, utan emojier.
- **typ:** exakt en av Mässa, Seminarium, Konferens, Nätverksträff, Frukostmöte, Lunchträff, Workshop, Rekryteringsträff, Öppet hus. Jobbmässa räknas som Mässa och webbinarium som Seminarium.
- **beskrivning:** en mening på 60–115 tecken, högst två rader. Mönster: "[Typ] om/för [innehåll eller målgrupp][, med X]." Upprepa inte titel, tid eller pris. Exempel: "Rekryteringsträff där arbetsgivare inom vård och omsorg möter arbetssökande."
- **pris_tagg:** `Gratis`, `Fri entré` (bara mässor), `150 kr` eller `150 kr medlem / 250 kr övriga ex moms`. Okänt pris eller pris som inte passar mönstret: `null`.
- **villkor:** bara `Endast [grupp]`, `Från [ålder] år`, `För [målgrupp]`, `Begränsat antal platser`, `Bindande anmälan` och `Uteblivande [belopp] kr ex moms`.
- **adress:** utan postnummer.
- **tid_start:** `null` om arrangören inte anger någon tid. Kortet visar då "Tid ej angiven".
- **uppdaterad:** sidans eller inläggets publicerings- eller uppdateringsdatum. Krävs när året inte står i `belagg`; skriptet kontrollerar datumet och veckodagen.
- **fler_datum:** övriga tillfällen i perioden för ett återkommande evenemang, annars `[]`.
- **lank:** direktlänk till arrangörens sida eller inlägg. Finns bara en samlingssida: sätt `samlingssida` till true.
- **regional_koppling:** krävs för digitala evenemang, utom jobbmässor och rekryteringsträffar.

## 6. Bygg och rätta

Kör `python bygg_kalender.py bygg arbete/data.json`. Rätta data.json, aldrig skriptet, tills utskriften slutar med `ALLA KONTROLLER GODKÄNDA`.

| Fel | Åtgärd |
|---|---|
| beskrivningen är för lång eller har fler än 2 rader | skriv om den kortare |
| kolumnerna har inte proportionen 2:1 | sätt ett mjukt bindestreck (U+00AD) i det långa ordet |
| kvoten överskrids | sätt R9 på de poster skriptet räknar upp |
| året står inte i belägget, eller sidan är för gammal | ange `uppdaterad`, eller sätt `obekraftad` |
| veckodagen stämmer inte med datumet | sätt `obekraftad`: sidan gäller troligen ett tidigare år |

Om ett fel inte går att rätta via data, till exempel för att något saknas i miljön: leverera ändå och nämn felet.

## 7. Granska och leverera

1. Öppna varje PNG under GRANSKA BILDERNA. Kontrollera gradienten, att inget överlappar, att å, ä och ö visas rätt och att korten ser likadana ut.
2. Kontrollera att varje kalenderlänk svarar med `curl -sIL`. En död länk är en osäkerhet.
3. Slutsvaret innehåller:
   - PDF:erna i `leverans/` som klickbara filer.
   - En rad per region: antal kort, varav jobbmässor och rekryteringsträffar, och varav kompetensutveckling eller företagande.
   - De viktigaste luckorna, högst fem rader.
   - Sökvägen till `…_data.json`, att använda som TIDIGARE nästa gång.
