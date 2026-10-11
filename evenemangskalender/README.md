# Evenemangskalender v3 – Microsoft Copilot

`INSTRUKTION_v3_copilot.txt` är hela instruktionen: först själva instruktionen (7 975 tecken), sedan BILAGA A med HTML-mallen (5 849 tecken). Ändra bara avsnitt 0.

## Användning

1. **Klistra in hela filen i Copilot.** Om Copilot säger att meddelandet är för långt (gränsen är ofta 8 000 tecken): skicka först allt före raden "BILAGA A", och sedan bilagan i ett nytt meddelande. Copilot svarar "Väntar på BILAGA A" i mellantiden.
2. **Skriv FORTSÄTT** när Copilot ber om det. Den gör ett steg per svar: research och tabeller för region 1, HTML och PDF för region 1, samma sak för region 2 och sist Excel och slutrapport. Uppdelningen gör att långa svar inte kortas av.
3. **Spara HTML-filen.** Kopiera kodblocket till Anteckningar och spara som till exempel `V42_2026_Kalmar_Evenemang.html`. Öppna filen i Edge. En röd ruta överst betyder att något inte får plats; be då Copilot att korta beskrivningen för det kort som nämns.
4. **PDF:en** skapas av Copilot i samma steg som HTML-filen, med klickbara kort. Om den avviker från HTML-filen: öppna HTML-filen i Edge, tryck Ctrl+P och välj Spara som PDF med A4, marginaler Inga, skala 100, bakgrundsgrafik på och sidhuvud/sidfot av.
5. **Excel** skapas i sista steget. Om Copilot inte kan skapa filen exporterar du tabellerna från steg 1 och 3 till Excel.
6. **Välj den högsta resonemangsnivån** om Copilot låter dig göra det. Researchen och regelbedömningen blir då mer genomarbetade.

## Ändringar jämfört med v2

- **Prioritering:** arbetsmarknad (jobb- och yrkesmässor, rekrytering, arbetsgivarträffar, studie- och yrkesvägledning, öppet hus på komvux) går först. Kostnadsfri kompetensutveckling och företagande får tillsammans vara högst 40 % av korten per region; överskottet hamnar i tabell B som "Utesluten: R9 – kvot 40 %". Avgiftsbelagd kompetensutveckling utesluts (R5). Källunderlaget har en ny kolumn, Kategori.

- **Inga steg som Copilot inte kan utföra.** v2 krävde Playwright, Chromium, pypdf och rastrering. Copilot har inget av detta, så mätning, PDF-export och de mätbara kontrollerna fick gissas. I v3 sköter HTML-filen själv det som kräver en webbläsare:
  - Sidindelningen följer v2:s regler: korthöjderna mäts i webbläsaren, en dagsrubrik placeras bara om minst ett kort ryms efter den, dagsrubriken upprepas på nästa sida och 0,8 mm lämnas i marginal.
  - Kontrollerna (synliga bara på skärmen): beskrivningen högst 2 rader, tiden bryts inte, kolumnerna har proportionen 2:1 och huvudrubriken står på en rad.
  - PDF:en skapas av Copilot med klickbara kort, med utskrift från Edge som reserv.
- **Kortare.** v2 var cirka 12 000 tecken. v3 kan delas i två meddelanden som vart och ett ryms inom 8 000 tecken.
- **Ett steg per svar** i stället för allt i ett svar.
- **Fasta researchsteg:** samma källordning och samma fem sökningar per region varje gång. Kommuner som inte hinner kontrolleras redovisas som researchluckor. Listan "Kontrollerade källor" kan klistras in som TIDIGARE KÄLLOR nästa vecka.
- **Kolumnen Belägg** i källunderlaget: ett ordagrant citat med år, datum och starttid. Det gör det svårare för modellen att hitta på uppgifter.
- **Regler och exempel:**
  - Uteslutningsreglerna prövas före verifieringen.
  - Nya regler: R2 (fel ämne) och R8 (inställt).
  - Exempel visar hur gränsfall ska bedömas.
- **Beslut du kan vilja ändra:**
  - Har anmälningsfristen passerat visar kortet "Anmälan krävs" i stället för ett passerat datum. Excel behåller fristen med "(passerad)".
  - Året får också styrkas av sidans webbadress.
  - Nya taggar: "Även digitalt" och "Pågår 13–15 oktober".
  - "Endast medlemmar" är borttagen eftersom den krockar med R4.
  - Slutrapporten har en kolumn för antalet kort inom kompetensutveckling och företagande.
- **Mallen:** CSS:en är oförändrad. Ikonerna läggs in av skriptet, så att Copilot har mindre kod att skriva av, och skriptet ligger sist i filen.

## Testat (Chromium 141, Liberation Sans)

- Mallen ger exakt samma sidindelning som en mätning med Playwright och v2:s algoritm:
  - 11 kort på 4 sidor
  - 30 kort på 10 sidor, där en dag fortsätter över tre sidor
- PDF:erna är A4 och har en länk på 190 mm per kort. Sista kortet slutar minst 10 mm ovanför underkanten. Vid 390 px bredd blir sidindelningen densamma, utan horisontell scroll.
- Den röda kontrollrutan visas för en beskrivning på tre rader och för ett för långt ord, men inte i PDF:en.
- Mallen klarar vanliga avvikelser från Copilot:
  - Om ikonerna redan finns med eller korten ligger på flera `sheet` blir resultatet ändå detsamma.
  - Om skriptet går sönder syns ändå alla kort.

Instruktionen har inte provkörts i Copilot. Researchdelen är alltså otestad.

Den tidigare versionen med ett byggskript i Python finns i commit `854d9b7`.
