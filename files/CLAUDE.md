# 🌍 Travel Agent — Asystent Podróży

## Cel projektu
AI agent do planowania podróży: wyszukiwanie lotów, hoteli i tworzenie kompletnych planów podróży.

## Stack
- Runtime: Node.js 18+ / Python 3.11+
- SDK: `@anthropic-ai/sdk` (Anthropic API)
- Web search: wbudowany tool `web_search` w Anthropic API
- API endpoint: Next.js 14 App Router (folder `src/api/`)
- Lokalnie: skrypt `src/run-local.ts`

## Struktura projektu
```
travel-agent/
├── CLAUDE.md                          ← jesteś tutaj
├── .claude/
│   ├── agents/
│   │   ├── flight-searcher.md         ← subagent: loty
│   │   ├── hotel-searcher.md          ← subagent: hotele
│   │   └── travel-planner.md          ← subagent: pełny plan
│   └── skills/
│       └── travel-context/
│           └── SKILL.md               ← wspólna wiedza
├── src/
│   ├── agent.ts                       ← główna logika agenta
│   ├── run-local.ts                   ← uruchamianie lokalnie
│   └── api/
│       └── route.ts                   ← Next.js API endpoint
├── package.json
└── .env.example
```

## Komendy
```bash
# Instalacja
npm install

# Uruchomienie lokalnie (tryb interaktywny)
npx tsx src/run-local.ts

# Dev server (API endpoint)
npx next dev
```

## Zmienne środowiskowe
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Zasady kodowania
- Zawsze używaj TypeScript
- Strumieniuj odpowiedzi (streaming: true)
- Każdy subagent ma własny system prompt
- Wyniki formatuj w Markdown z tabelami
- Obsługuj błędy gracefully — zawsze zwracaj coś użytecznego
