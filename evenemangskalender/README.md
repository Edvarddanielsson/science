# Evenemangskalender v3 – Microsoft Copilot

`INSTRUKTION_v3_copilot.txt` är hela instruktionen (7 621 tecken). `STARTPROMPT.txt` är det enda du fyller i inför varje körning. Instruktionen gör ingenting förrän den får en startprompt som börjar med `KÖR EVENEMANGSKALENDER v3`.

## Användning

Två sätt, båda under 7 800 tecken per meddelande:

- **Ett meddelande:** klistra in instruktionen och, längst ned, startprompten.
- **Två meddelanden:** klistra in instruktionen. Copilot svarar "Instruktionen är inläst. Skicka startprompten." Skicka sedan startprompten.

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

Copilot börjar med en rad "Inställningar: …" så att du kan se att den har läst rätt. Skriv sedan FORTSÄTT när den ber om det. Välj den högsta resonemangsnivån om det går.

## Det som styr resultatet

- **Bred och noggrann research:** två varv (först brett, sedan verifiering hos arrangören), minst 20 sökningar per region med räkning, sökningar på vecka och datum, på kommunnamn och med `site:`, samt de 10 största kommunerna.
- **Verifiering:** år, datum, starttid och plats hos arrangören, med ett ordagrant citat (belägg) i arbetslistan.
- **Regler R1–R8** prövas i fast ordning.
- **Prioritering:** arbetsmarknad går först. Kostnadsfri kompetensutveckling och företagande får tillsammans vara högst 40 % av korten.
- **Design:** samma utseende som i v2:s mall, beskrivet i mm, pt och färgkoder, med fasta regler för sidindelning.

Tidigare versioner med HTML-mall och byggskript finns i git-historiken (commit `5fd0087` och `854d9b7`).

## Codex-versionen

`codex/` innehåller en version för Codex (GPT-6.1 Sol) med underagenter, live-sökning och byggskript. Se `codex/README.md`.
