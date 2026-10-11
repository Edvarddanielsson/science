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
max_threads = 6                    # tre underagenter per region, två regioner
```

I CLI:n gör `codex --search` samma sak för en enstaka körning.

## Körning

1. Öppna repot i Codex (app eller CLI).
2. Klistra in startprompten med dina värden och skicka.
3. Codex arbetar självständigt och levererar en PDF per region i `evenemangskalender/codex/leverans/`.

## Varför den här versionen är starkare än Copilot-versionen

- **Underagenter parallellt:** tre per region, som tar regionala aktörer, kommunerna respektive sökningar och aggregatorer. Codex startar dem bara om den blir uttryckligen ombedd, vilket instruktionen gör.
- **Live-sökning och direkt hämtning:** sidor hämtas med curl och Playwright, även kalendrar som renderas med JavaScript. Året läses ur JSON-LD och ICS när det saknas i texten.
- **Skriptet garanterar formatet:** v2-mallen, sidindelning som mäts i webbläsaren, klickbara kort och 40 %-kvoten. Kvoten räknas automatiskt, och skriptet anger vilka poster som ska strykas.
- **Klart-kriterier enligt Codex best practices:** mål, kontext, begränsningar och "klart när". Planen förs i plan-verktyget, och resonemangsnivån är Extra High.

Testat: självtestet passerar med kategorier, och ett fall med överskriden kvot stoppas med rätt poster att stryka.
