# Evenemangskalender v3 – Codex (GPT-6.1 Sol)

| Fil | Vad |
|---|---|
| `INSTRUKTION_codex.md` | Instruktionen som Codex följer |
| `STARTPROMPT.txt` | Det enda du fyller i inför varje körning: regioner, period och år |
| `INSTRUKTION_codex_text.md` | **Endast text:** allt i en fil (startprompt, regler och HTML-mall), inget skript behövs |
| `bygg_kalender.py` | Byggskriptet: datum, kommuner (SCB 2026), validering, 40 %-kvot, paginering, klickbar PDF och kontroller |

## Inställningar i Codex (en gång)

Lägg detta i `~/.codex/config.toml`, eller i `.codex/config.toml` i repot:

```toml
model = "gpt-6.1-sol"
model_reasoning_effort = "xhigh"   # Extra High, för långa agentuppgifter
web_search = "live"                # standardläget "cached" ger gamla resultat
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true              # curl och Playwright behöver nätet

[agents]
max_threads = 6                    # högst sex underagenter samtidigt (fyra per region)
```

I CLI:n gör `codex --search` samma sak för en enstaka körning.

## Körning

1. Öppna repot i Codex (app eller CLI).
2. Klistra in startprompten med dina värden och skicka.
3. Codex arbetar självständigt och levererar en PDF per region i `evenemangskalender/codex/leverans/`.

## Varför den här versionen är starkare än Copilot-versionen

- **Underagenter parallellt:** fyra per region, som tar regionala aktörer, kommunerna, sökningar och aggregatorer respektive utbildning, omställning och branschmässor. Codex startar dem bara om den blir uttryckligen ombedd, vilket instruktionen gör.
- **Live-sökning och direkt hämtning:** sidor hämtas med curl och Playwright, även kalendrar som renderas med JavaScript. Året läses ur JSON-LD och ICS när det saknas i texten.
- **Skriptet garanterar formatet:** v2-mallen, sidindelning som mäts i webbläsaren, klickbara kort och 40 %-kvoten. Kvoten räknas automatiskt, och skriptet anger vilka poster som ska strykas.
- **Klart-kriterier enligt Codex best practices:** mål, kontext, begränsningar och "klart när". Planen förs i plan-verktyget, och resonemangsnivån är Extra High.

Testat: självtestet passerar med kategorier, och ett fall med överskriden kvot stoppas med rätt poster att stryka.

## Samma regler som Copilot-versionen

Båda Codex-instruktionerna och skriptet följer Copilot-instruktionens regler från oktober 2026. Codex har ingen teckengräns, så här står också de exempel som Copilot-versionen fick korta bort.

- **Målgrupp:** arbetssökande 20–65 år, med en snittålder på 43 år.
  - Evenemang vars hela målgrupp ligger utanför 20–65 år, till exempel pensionärer eller ungdomar under 20, stängs ute av R3.
  - Det räcker att målgruppen delvis ligger inom åldrarna, till exempel unga 16–24 år.
- **Jobbmässor först:** sökorden bygger på en webbsökning av vad arrangörerna faktiskt skriver. Se tabellen i `../README.md`. Mässlistorna allamassor.se och syvarna.com/jobbmassor är egna källor.
- **Omställning och yrkesbyte:**
  - sökningar på omställningsstudiestöd, byta yrke, validering, arbetsmarknadsutbildning och öppet hus på yrkeshögskolor och folkhögskolor
  - källorna omfattar yrkeshögskolor, folkhögskolor, kommunernas vägledningscentrum, omställningsorganisationerna (TRR, TSL, Omställningsfonden) och CSN, men bara evenemang med koppling till regionen
  - instruktionen påminner om att ansökan om omställningsstudiestöd öppnar 1 april och 1 oktober, och att informationsträffarna ofta ligger veckorna före.
- **Branschmässor och fackmässor** är med när vem som helst får komma eller registrera sig, även mot entréavgift. De räknas som Kompetensutveckling, och priset står på kortet. Mässor "endast för yrkesverksamma besökare", som Elfack och FFCR, stängs ute av R3.
- **R3 stänger ute:**
  - evenemang bara för inbjudna, elever, ett visst lärosätes studenter, deltagare i en insats eller ett visst företags anställda
  - evenemang som uttalat riktar sig till yrkesverksamma, till exempel HR, chefer, företagare eller en yrkesgrupp. Jobbmässor för en yrkesgrupp är ändå med, och mässor stängs bara ute om de inte släpper in andra.
  - gymnasiemässor, även dagar då de är öppna för alla, och sommarjobbsmässor för skolungdom. En mässa som både är gymnasiemässa och jobbmässa och uttryckligen bjuder in arbetssökande är ändå med.
- **R5** stänger ute kurser och kompetensutveckling som kostar, men inte entréavgifter till mässor. Regelinformation för företag stängs nu ute av R3, eftersom den riktar sig till företagare.
- **Med i kalendern:**
  - mässor av alla slag, även studentmässor inför högskola och YH, och branschmässor
  - informationsträffar för arbetssökande, även om omställningsstudiestöd, yrkeshögskola och folkhögskola
  - evenemang för arbetssökande (även bara för inskrivna på Arbetsförmedlingen eller för arbetssökande över 50), unga vuxna, nyanlända och utrikes födda samt personer med funktionsnedsättning.
- **Företagande** gäller bara starta eget. Nätverk, frukostar och kurser för den som redan driver företag stängs ute av R3.
- **Inlägg:** arrangörens egna inlägg på LinkedIn och Facebook räknas som bekräftelse.
  - Året räknas fram enligt regeln under Årtal och tid.
  - Bara inlägg som kan läsas utan inloggning räknas.
- **Digitalt:** nationella digitala jobbmässor och rekryteringsträffar behöver ingen regional koppling.
- **Kvot:** högst 40 % kompetensutveckling (även branschmässor) och företagande, men minst 2 är alltid tillåtna.
- **Kort:**
  - Korten skrivs i klarspråk: förkortningar skrivs ut, och ord som insats och matchning undviks.
  - Beskrivningen nämner branscher och yrken när arrangören anger dem.
  - Taggarna "Ta med cv", "Intervjuer på plats" och "Ingen anmälan" visas bara när arrangören skriver det.
- **Återkommande träffar:** ett kort per serie, med övriga datum i `fler_datum`.
- **Årtal och tid:** saknas året räcker det att sidan eller inlägget är uppdaterat under periodens år eller halvåret före. Står det en veckodag måste den stämma med datumet. Starttid krävs inte; kortet visar då "Tid ej angiven".
- **Skriptet:**
  - `sokfragor` har 28 sökord plus två sökningar utan regionnamn. Sökord för omställning, yrkesbyte och branschmässor är tillagda, och "företagarmässa" och "sommarjobbsmässa" är borttagna.
  - Mässlistor och mässhallar (`massor`), inlägg (`sociala`), yrkeshögskolor och folkhögskolor (`yh`) samt omställningsorganisationer och CSN (`omstallning`) är källtyper som täckningskontrollen kräver.
  - Det nya fältet `praktiskt` tar `Ta med cv` och `Intervjuer på plats`. `anmalan: "ingen"` ger anmälningstaggen "Ingen anmälan".
  - Varningar, så att reglerna prövas:
    - målgrupp helt utanför 20–65 år eller pensionärer
    - Företagande som inte gäller starta eget
    - källor som säger att bara yrkesverksamma släpps in
    - branschmässor med kategorin Arbetsmarknad
    - gymnasiemässor och sommarjobbsmässor.
  - Digitala mässor och rekryteringsträffar godkänns utan `regional_koppling`.
  - Fältet `uppdaterad` krävs när året inte står i `belagg`. Skriptet stoppar för gamla sidor och fel veckodagar.
  - Saknad `tid_start` ger bara en varning.
  - `fler_datum` ger taggen "Även 17, 24 november". Samma titel på flera kort ger en varning om att det kan vara en serie.
  - Kvotens tak är max(2, 2 per 3 arbetsmarknadskort).
  - Självtestets exempel följer reglerna: starta eget, en lunchträff för arbetssökande över 50, en branschmässa med entréavgift och en informationsträff om omställningsstudiestöd.
