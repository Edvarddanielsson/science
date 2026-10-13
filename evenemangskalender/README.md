# Evenemangskalender v3 – Microsoft Copilot

`INSTRUKTION_v3_copilot.txt` är hela instruktionen (7 794 tecken, under gränsen på 7 800). `STARTPROMPT.txt` är det enda du fyller i inför varje körning. Instruktionen gör ingenting förrän den får en startprompt som börjar med `KÖR EVENEMANGSKALENDER v3`.

## Användning

Instruktionen är nästan 7 800 tecken, så startprompten skickas alltid för sig. Två sätt:

- **Som agent (smidigast om du kör ofta):** skapa en agent i Microsoft 365 Copilot och klistra in instruktionen i fältet Instructions, som rymmer 8 000 tecken. Slå på Search all websites under Knowledge och Create documents, charts, and code under Capabilities; det är kodtolken som skapar PDF:en. Välj Think deeper under Model. Lägg gärna startprompten som starter prompt. Sedan skickar du bara startprompten.
- **I chatten:** klistra in instruktionen som ett eget meddelande. Copilot svarar "Instruktionen är inläst. Skicka startprompten." Skicka sedan startprompten.

Startprompten:

```
KÖR EVENEMANGSKALENDER v3
REGIONER: Skåne län (S)
PERIOD: månad november
ÅR: 2026
TIDIGARE KÄLLOR:
```

- PERIOD kan vara `vecka 47`, `månad november` eller `2026-11-02–2026-11-15`.
- Flera regioner skrivs med komma emellan, till exempel `Skåne län (S), Kalmar län (K)`.
- ÅR och TIDIGARE KÄLLOR kan lämnas tomma.

Copilot börjar med en rad "Inställningar: …" så att du kan se att den har läst rätt. Skriv sedan FORTSÄTT när den ber om det. Välj Think deeper, eller den högsta resonemangsnivån som finns.

## Det som styr resultatet

- **Jobbmässor först:** fyra av sex sökgrupper gäller jobbmässor och rekryteringsträffar. Minst 10 av de minst 20 sökningarna per region ska göras där, och arbetslistan redovisar antalet. Mässlistorna allamassor.se och syvarna.com/jobbmassor används för att hitta mässor, men aldrig som verifiering.
- **Bred och noggrann research:** två varv (först brett, sedan verifiering hos arrangören), sökningar på vecka och datum, på kommunnamn och med `site:` (till exempel `site:[kommun].se jobbmässa`, anmälningssajten simplesignup.se och `site:linkedin.com`), samt de 10 största kommunerna.
- **Verifiering:** datum, ort och år hos arrangören, med ett ordagrant citat (belägg) i arbetslistan. Att missa ett evenemang räknas som värre än att visa ett med ofullständig tid, men allt på kortet ska komma från arrangören, eftersom arbetssökande läser kalendern direkt.
  - Saknas året räcker det att sidan eller inlägget är publicerat eller uppdaterat under periodens år eller halvåret före. Står det en veckodag måste den stämma med datumet.
  - Starttid krävs inte. Saknas den visar kortet "Tid ej angiven".
  - Arrangörens egna inlägg på LinkedIn eller Facebook räknas också, eftersom många mindre rekryteringsträffar bara annonseras där.
- **Regler R1–R8** prövas i fast ordning. R3 stänger ute evenemang som bara är för inbjudna, elever, pensionärer, ett lärosätes studenter, deltagare i en insats eller ett företags anställda, och evenemang som uttalat är för yrkesverksamma, till exempel HR, chefer eller en viss yrkesgrupp. R3 stänger också ute gymnasiemässor, även dagar då de är öppna för alla, och sommarjobbsmässor för skolungdom. Kalibreringsexempel avgör vanliga gränsfall:
  - mässor som är både gymnasiemässa och jobbmässa och uttryckligen bjuder in arbetssökande (med)
  - yrkesmässor för högstadiet (R3)
  - jobbmässor för en viss yrkesgrupp, till exempel vård (med, eftersom de riktar sig till jobbsökande)
  - HR-konferenser och fackmässor (R3)
  - mässor med blandad publik (kortet får allmänhetens tid)
  - datum utan år
  - fjolårets sidor (då söker Copilot efter årets upplaga).
- **Mässor av alla slag** är med om de klarar reglerna: jobb-, utbildnings-, student-, komvux-, framtids- och företagarmässor. Studentmässor inför högskola och YH, som Saco Studentmässa, är med. Sökningarna omfattar också utbildnings-, student-, komvux- och företagarmässor.
- **Informationsträffar för arbetssökande** är med, till exempel om arbetsmarknadsutbildning eller a-kassa. R5 stoppar bara ren regelinformation för företag.
- **Målgrupper som är med:** evenemang för arbetssökande (även när de bara är för inskrivna på Arbetsförmedlingen), unga 16–29 år, nyanlända och utrikes födda samt personer med funktionsnedsättning. De får en tagg som "För [målgrupp]".
- **Digitalt:** nationella digitala jobbmässor och rekryteringsträffar är med och söks även utan regionnamn. Andra digitala evenemang kräver koppling till regionen.
- **Prioritering:** arbetsmarknad går först, och utbildningsmässor räknas dit. Kostnadsfri kompetensutveckling och företagande får tillsammans vara högst 40 % av korten, men minst 2 är alltid tillåtna. Då blir kalendern aldrig tom bara på grund av kvoten.
- **Återkommande träffar,** till exempel ett jobbcafé varje tisdag, blir ett kort per serie. Kortet hamnar på första tillfället och får en tagg som "Även 17, 24 november".
- **Design:** samma utseende som i v2:s mall, beskrivet i mm, pt och färgkoder, med fasta regler för sidindelning. PDF:en skapas med kod, med riktig text och en klickbar länk per kort.

## Ord för jobbmässor

Sökorden i grupp 1–4 bygger på en webbsökning i oktober 2026 om vilka ord arrangörerna faktiskt använder.

| Sökord | Använt av (2026) |
|---|---|
| jobbmässa | Nacka (Fisksätra), Ale, Båstad (Jobbåstad26), Arbetsförmedlingen i Malmö |
| jobb- och utbildningsmässa | Osby, Klippan, Kävlinge, Burlöv, Växjö, Ronneby och Västervik. Ordet är vanligast hos kommunerna |
| rekryteringsmässa | Enköping, Arena Varberg, Jobbmatchen i Helsingborg |
| rekryteringsträff | Arbetsförmedlingen, CareerConnect i Botkyrka, Eductus i Hammarkullen |
| rekryteringsdag | Göteborg Landvetter Airport, Filipstad, Stockholms stad (vård och omsorg) |
| rekryteringsevent | Connecting Jobs i Malmö. Ofta bara för inbjudna, vilket betyder R3 |
| framtidsmässa | Laholm, Kristianstad, Grästorp |
| kompetensmässa | Rättvik |
| jobbdag | Sollefteå (Jobbdagen) |
| "träffa arbetsgivare", "ta med ditt CV", snabbintervjuer | Fraserna står på sidorna för mässor med egna namn, till exempel Jobbchansen (Örebro, Luleå), Opportunity Day och CareerConnect |

Bortvalda ord:
- **arbetsgivarträff:** används mest om träffar för deltagare i en insats, eller mellan arbetsgivare.
- **jobbspår:** är ett program, inget evenemang.
- **karriärmässa och arbetsmarknadsdag:** gäller oftast lärosätenas karriärmässor för de egna studenterna, som R3 stänger ute.
- **sommarjobbsmässa:** används av till exempel Uppsala, Västervik, Sollentuna och Hällefors (januari–mars). Den togs bort som sökord i oktober 2026, eftersom sommarjobbsmässor för skolungdom ska sorteras bort.

Test på Skåne i november 2026:
- De nya sökorden hittade samma öppna jobbmässa som exempelkörningen, i Osby den 3 november. Syvarnas lista för Skåne har ingen annan.
- Bland de övriga träffarna fanns:
  - lärosätenas karriärmässor för de egna studenterna, som R3 stänger ute
  - gamla sidor utan år som reglerna fångar
  - ett spelevent som R2 stänger ute.

Tidigare versioner med HTML-mall och byggskript finns i git-historiken (commit `5fd0087` och `854d9b7`).

## Codex-versionen

`codex/` innehåller en version för Codex (GPT-6.1 Sol) med underagenter, live-sökning och byggskript. Se `codex/README.md`.
