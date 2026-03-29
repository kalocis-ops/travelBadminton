# 🌍 Travel Agent

AI asystent podróży zbudowany na Claude — wyszukuje loty, hotele i tworzy kompletne plany podróży.

## Szybki start

### 1. Instalacja
```bash
git clone <repo>
cd travel-agent
npm install
cp .env.example .env
# Uzupełnij ANTHROPIC_API_KEY w pliku .env
```

### 2. Uruchomienie lokalne (Antigravity / terminal)
```bash
npm run agent
```

### 3. API endpoint (do strony www)
```bash
npm run dev
# Endpoint: http://localhost:3000/api/travel
```

---

## Użycie lokalnie

Po uruchomieniu `npm run agent` wpisujesz zapytania:

```
Ty: Znajdź loty z Warszawy do Barcelony na 15 lipca
Ty: Hotele w centrum Barcelony, budżet 250 PLN/noc
Ty: Zaplanuj mi tydzień na Majorce dla 2 osób, budżet 5000 PLN
```

### Tryby pracy
| Komenda | Opis |
|---------|------|
| `/loty` | Tylko wyszukiwanie lotów |
| `/hotele` | Tylko wyszukiwanie hoteli |
| `/plan` | Pełny plan podróży |
| `/auto` | Agent sam wykrywa co szukasz |
| `/clear` | Wyczyść historię |

---

## Użycie jako API

### Zapytanie o loty
```bash
curl -X POST http://localhost:3000/api/travel \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Loty z Warszawy do Lizbony w sierpniu, 2 osoby",
    "mode": "flights"
  }'
```

### Zapytanie o hotele
```bash
curl -X POST http://localhost:3000/api/travel \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hotele w Lizbonie blisko Alfamy, 7 nocy",
    "mode": "hotels"
  }'
```

### Pełny plan podróży
```bash
curl -X POST http://localhost:3000/api/travel \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Zaplanuj tydzień w Lizbonie dla 2 osób",
    "mode": "full-plan"
  }'
```

### Z historią rozmowy (multi-turn)
```json
{
  "message": "A czy są tańsze opcje hoteli?",
  "mode": "hotels",
  "history": [
    { "role": "user", "content": "Hotele w Lizbonie, centrum" },
    { "role": "assistant", "content": "..." }
  ]
}
```

---

## Struktura projektu

```
travel-agent/
├── .claude/
│   ├── agents/
│   │   ├── flight-searcher.md    ← subagent: loty
│   │   ├── hotel-searcher.md     ← subagent: hotele
│   │   └── travel-planner.md    ← subagent: pełny plan
│   └── skills/
│       └── travel-context/
│           └── SKILL.md          ← wspólna wiedza
├── src/
│   ├── agent.ts                  ← główna logika
│   ├── run-local.ts              ← CLI
│   └── api/route.ts             ← Next.js API
└── CLAUDE.md                     ← kontekst projektu
```

---

## Rozbudowa — Faza 2 (prawdziwe API)

Aby przejść na prawdziwe API cenowe:

1. **Amadeus API** (loty) — https://developers.amadeus.com/
   - Darmowy tier: 2000 req/miesiąc
   - `npm install amadeus`

2. **Booking.com Affiliate API** — https://developers.booking.com/
   - Wymaga rejestracji jako affiliate

3. **Skyscanner API** — tylko przez RapidAPI

Plik `src/agent.ts` ma miejsce na podpięcie — szukaj komentarzy `// TODO: API`

---

## Dla klienta — wdrożenie na produkcję

```bash
# Vercel (najprostsze)
npm i -g vercel
vercel deploy

# Ustaw zmienną środowiskową w Vercel:
# ANTHROPIC_API_KEY = sk-ant-...
```
