# Evenemangskalender v3

| Fil | Vad |
|---|---|
| `PROMPT_v3.md` | Prompten. Ändra bara avsnitt 0 (regioner, period, år, tidigare körning). |
| `bygg_kalender.py` | Byggskriptet som prompten kör. Bifoga det tillsammans med prompten. |

## Användning

- **Chatt med kodkörning (claude.ai m.fl.):** bifoga `bygg_kalender.py`, och förra körningens `…_data.json` om du har den, och klistra in prompten.
- **Claude Code i det här repot:** skriptet finns redan här. Be Claude köra `evenemangskalender/PROMPT_v3.md`.
- **Testa miljön:** `python bygg_kalender.py test` bygger en fiktiv kalender och kör alla kontroller (tar cirka 15 sekunder).

Skriptet behöver Python 3.9+, `playwright` med Chromium, `openpyxl` och `pypdf`. `pypdfium2` och `pillow` (eller `pdftoppm`) behövs för rastreringen.

## Varför resultaten blir jämnare än med v2

1. **Det mekaniska är kod, inte prosa.** Datum, kommunlistor (SCB 2026, alla 290 kommuner), sortering, ID, taggar, Excel, HTML, mätning, paginering, PDF, kvalitetskontroller och slutrapport görs av skriptet. Tidigare skrev modellen om allt detta varje gång, på lite olika sätt. Nu lägger den tiden på research och bedömning.
2. **En enda datakälla.** Excel, HTML och PDF byggs från samma `data.json`. Antalen kan inte glida isär.
3. **Valideringen stoppar vanliga modellfel:** felstavade fält (med förslag), kvarlämnade platshållare, taggar utanför vokabulären, datum utanför perioden, kommuner utanför länet, beskrivningar med fel längd eller med tid, pris eller titel, dubbletter och kopierad exempeldata.
4. **Fast researchprotokoll med logg.** Samma källtyper och samma 14 sökfrågor per region varje gång. Varje kontrollerad källa loggas, och täckningen räknas per kommun. Luckorna hamnar automatiskt i Excel och rapport. Förra körningens källor kan återanvändas (`--tidigare`).
5. **Belägg krävs.** Varje verifierat evenemang har ett ordagrant citat med år, datum och starttid. Det gör det svårare för modellen att hitta på och lätt för dig att kontrollera.
6. **Kalibreringsexempel** för regelbedömning och beskrivningar, och ett fiktivt exempel på en hel post.

## Beslut som skiljer sig från v2 (ändra om du vill)

- **Regelordningen:** uteslutningsreglerna prövas före verifieringen, så tid läggs inte på att verifiera sådant som ändå utesluts. Två regler har tillkommit, R2 (fel ämne) och R8 (inställt), och numreringen har därför ändrats.
- **Passerad anmälningsfrist:** kortet visar "Anmälan krävs" i stället för ett datum som redan har passerat. Excel behåller fristen med "(passerad)". Det styrs i `harled_kort()` i skriptet.
- **Året kan styrkas** av sidans adress eller dess maskinläsbara data (JSON-LD, ICS), inte bara av synlig text.
- **Taggar:** "Även digitalt" (hybrid), "Pågår 13–15 oktober" (flera dagar) och "Anmälan krävs" har tillkommit. "Endast medlemmar" är borttagen eftersom den krockar med R4.
- **"Tid meddelas"** är borttagen. Starttid krävs för att ett evenemang ska räknas som verifierat, så fallet kan inte uppstå.
- **Rättningar:** Excel-filnamnet följer samma mönster överallt (v2 hade två olika). Sökorden följer perioden (v2 hade "oktober 2026" hårdkodat). ID-prefixen anges i inställningarna, så att till exempel Västra Götaland och Västerbotten inte krockar. "ÅR: auto" klarar vecka 1 när prompten körs i december.
- **Ny kontroll:** kortets kolumner ska ha proportionen 2:1. Ett mycket långt ord i en lokal eller titel trycker annars isär kolumnerna utan att något flyter över.

## Mallen

BILAGA A från v2 är oförändrad och finns i skriptet (`CSS`, `SVG_*`, `ZOOM_JS`). En egenhet: `.sheet:last-child` matchar aldrig, eftersom `<script>` är det sista barnet i `body`. Chromium lägger ändå inte till någon tom sista sida, så regeln har lämnats som den är.

## Testat

Med Chromium 141 och Liberation Sans (Arial saknades):

- `test`: 11 fiktiva kort på 4 sidor, plus en region med bara uteslutna evenemang. Alla kontroller passerar.
- Månadsläge med 30 kort på 10 sidor, där en dag med 9 kort sträcker sig över tre sidor med upprepad dagsrubrik.
- Felfall som stoppas eller underkänns: en beskrivning på tre rader, ett långt ord i en lokal (löses med ett mjukt bindestreck), felstavade fält, kvarlämnade platshållare, dubbletter, datum utanför perioden och en kommun utanför länet.
- Prompten själv: dess fiktiva exempelpost är giltig enligt skriptet, men stoppas om den kopieras ordagrant.
- `init` för vecka 53 över årsskiftet (28 december 2026–3 januari 2027), krockande ID-prefix och ett landskap som inte är ett län.
