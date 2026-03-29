# Travel Agent Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Next.js web frontend to the existing Travel Agent CLI — search form with tabs (Flights/Hotels/Plan), results as booking cards in a 3-column grid with deep links to reservation sites.

**Architecture:** Extend `agent.ts` to embed structured JSON in its responses, add `deeplinks.ts` for pre-built booking URLs, build two React components (SearchForm + ResultCards) wired to the existing `/api/travel` endpoint. Move API route to `src/app/api/travel/route.ts` (required by Next.js App Router).

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, inline CSS styles (no Tailwind), Vitest for unit tests

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/deeplinks.ts` | Create | Generate booking deep links from search params |
| `src/deeplinks.test.ts` | Create | Unit tests for deeplinks |
| `src/agent.ts` | Modify | Add `TravelResult` type + `results?` to `TravelResponse` + update system prompts to emit `RESULTS_JSON` |
| `src/app/api/travel/route.ts` | Create | Next.js App Router API route (replaces `src/api/route.ts`) |
| `src/app/layout.tsx` | Create | HTML shell, metadata, font |
| `src/app/globals.css` | Create | Base styles, CSS variables |
| `src/app/components/ResultCards.tsx` | Create | Grid of result cards with booking buttons |
| `src/app/components/SearchForm.tsx` | Create | Tabbed search form (Flights / Hotels / Plan) |
| `src/app/page.tsx` | Create | Main page — wires SearchForm + ResultCards + API call |
| `vitest.config.ts` | Create | Vitest config |
| `package.json` | Modify | Add vitest dev dependency + test script |

---

## Task 1: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install vitest**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
npm install --save-dev vitest
```

Expected: vitest added to `node_modules`.

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add `"test": "vitest run"` to `scripts`:

```json
{
  "name": "travel-agent",
  "version": "1.0.0",
  "description": "AI Travel Agent — wyszukiwanie lotów, hoteli i planowanie podróży",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "agent": "npx tsx src/run-local.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "feat: add vitest test runner"
```

---

## Task 2: Create deeplinks.ts with tests

**Files:**
- Create: `src/deeplinks.ts`
- Create: `src/deeplinks.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/deeplinks.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generateBookingLinks } from "./deeplinks";

describe("generateBookingLinks — flights", () => {
  it("returns 3 flight links with correct structure", () => {
    const links = generateBookingLinks({
      mode: "flights",
      from: "WAW",
      to: "DUB",
      date: "2026-04-03",
      passengers: 1,
    });
    expect(links).toHaveLength(3);
    expect(links[0]).toMatchObject({ name: expect.any(String), url: expect.any(String), icon: expect.any(String) });
  });

  it("Google Flights URL contains from, to and date", () => {
    const links = generateBookingLinks({ mode: "flights", from: "WAW", to: "DUB", date: "2026-04-03", passengers: 1 });
    const gf = links.find((l) => l.name === "Google Flights")!;
    expect(gf.url).toContain("WAW");
    expect(gf.url).toContain("DUB");
    expect(gf.url).toContain("2026-04-03");
  });

  it("Skyscanner URL uses lowercase IATA codes and YYMMDD date", () => {
    const links = generateBookingLinks({ mode: "flights", from: "WAW", to: "DUB", date: "2026-04-03", passengers: 1 });
    const sc = links.find((l) => l.name === "Skyscanner")!;
    expect(sc.url).toContain("waw");
    expect(sc.url).toContain("dub");
    expect(sc.url).toContain("260403");
  });
});

describe("generateBookingLinks — hotels", () => {
  it("returns 3 hotel links", () => {
    const links = generateBookingLinks({
      mode: "hotels",
      city: "Dublin",
      date: "2026-04-03",
      dateTo: "2026-04-10",
      passengers: 2,
    });
    expect(links).toHaveLength(3);
  });

  it("Booking.com URL contains city and dates", () => {
    const links = generateBookingLinks({ mode: "hotels", city: "Dublin", date: "2026-04-03", dateTo: "2026-04-10", passengers: 1 });
    const bk = links.find((l) => l.name === "Booking.com")!;
    expect(bk.url).toContain("Dublin");
    expect(bk.url).toContain("2026-04-03");
    expect(bk.url).toContain("2026-04-10");
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — "Cannot find module './deeplinks'"

- [ ] **Step 3: Implement deeplinks.ts**

Create `src/deeplinks.ts`:

```typescript
export interface BookingParams {
  mode: "flights" | "hotels";
  from?: string;       // IATA kod wylotu np. "WAW"
  to?: string;         // IATA kod przylotu np. "DUB"
  city?: string;       // miasto docelowe dla hoteli
  date?: string;       // YYYY-MM-DD
  dateTo?: string;     // YYYY-MM-DD (checkout dla hoteli)
  passengers?: number;
}

export interface BookingLink {
  name: string;
  url: string;
  icon: string;
}

export function generateBookingLinks(params: BookingParams): BookingLink[] {
  if (params.mode === "flights") return generateFlightLinks(params);
  return generateHotelLinks(params);
}

function generateFlightLinks(params: BookingParams): BookingLink[] {
  const { from = "", to = "", date = "", passengers = 1 } = params;
  const dateShort = date.slice(2).replace(/-/g, ""); // YYMMDD np. "260403"

  return [
    {
      name: "Google Flights",
      icon: "🔍",
      url: `https://www.google.com/travel/flights?q=loty+${from}+${to}+${date}`,
    },
    {
      name: "Skyscanner",
      icon: "✈",
      url: `https://www.skyscanner.pl/transport/loty/${from.toLowerCase()}/${to.toLowerCase()}/${dateShort}/`,
    },
    {
      name: "Kayak",
      icon: "🎯",
      url: `https://www.pl.kayak.com/flights/${from}-${to}/${date}/${passengers}adults`,
    },
  ];
}

function generateHotelLinks(params: BookingParams): BookingLink[] {
  const { city = "", date = "", dateTo = "", passengers = 1 } = params;

  return [
    {
      name: "Booking.com",
      icon: "🏨",
      url: `https://www.booking.com/searchresults.pl.html?ss=${encodeURIComponent(city)}&checkin=${date}&checkout=${dateTo}&group_adults=${passengers}`,
    },
    {
      name: "Hotels.com",
      icon: "🏢",
      url: `https://pl.hotels.com/search.do?q-destination=${encodeURIComponent(city)}&q-check-in=${date}&q-check-out=${dateTo}&q-rooms=1&q-room-0-adults=${passengers}`,
    },
    {
      name: "Airbnb",
      icon: "🏠",
      url: `https://www.airbnb.pl/s/${encodeURIComponent(city)}/homes?checkin=${date}&checkout=${dateTo}&adults=${passengers}`,
    },
  ];
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/deeplinks.ts src/deeplinks.test.ts
git commit -m "feat: add deeplinks utility with tests"
```

---

## Task 3: Extend agent.ts — add TravelResult type + RESULTS_JSON in prompts

**Files:**
- Modify: `src/agent.ts`

- [ ] **Step 1: Add TravelResult type and extend TravelResponse**

In `src/agent.ts`, after line 20 (after `export interface TravelResponse`), replace the `TravelResponse` interface and add `TravelResult`:

```typescript
export interface TravelResult {
  name: string;
  price: string;
  details: string;
  bookingUrl: string;
}

export interface TravelResponse {
  text: string;
  mode: AgentMode;
  results?: TravelResult[];
}
```

- [ ] **Step 2: Add RESULTS_JSON instruction to each system prompt**

Replace `const SYSTEM_PROMPTS: Record<AgentMode, string> = { ... }` with:

```typescript
const RESULTS_JSON_INSTRUCTION = `
Na samym końcu odpowiedzi ZAWSZE dodaj blok JSON z maksymalnie 4 najlepszymi wynikami:
<!-- RESULTS_JSON
[{"name":"Nazwa linii/hotelu","price":"cena w PLN","details":"kluczowe szczegóły w 1 linii","bookingUrl":"https://bezposredni-link-do-rezerwacji"}]
-->
Blok RESULTS_JSON musi być na samym końcu, po całym tekście. bookingUrl to link bezpośrednio do wyszukiwania na stronie linii/hotelu.`;

const SYSTEM_PROMPTS: Record<AgentMode, string> = {
  auto: `Jesteś inteligentnym asystentem podróży. Analizujesz zapytanie użytkownika i:
- Jeśli pyta tylko o loty → skupiasz się na lotach
- Jeśli pyta tylko o hotele → skupiasz się na hotelach
- Jeśli pyta o całą podróż lub trip → tworzysz kompletny plan

Używasz web_search do znajdowania aktualnych cen i dostępności.
Odpowiadasz po polsku, z tabelami porównawczymi i konkretnymi rekomendacjami.
Zawsze podajesz ceny jako orientacyjne (~) i sugerujesz sprawdzenie aktualności.
${RESULTS_JSON_INSTRUCTION}`,

  flights: `Jesteś ekspertem od wyszukiwania lotów.
Szukasz najlepszych połączeń lotniczych używając web_search.
Sprawdzasz: Google Flights, Skyscanner, Kayak i bezpośrednie linie lotnicze.
Zawsze pokazujesz minimum 3 opcje w tabeli porównawczej.
Podpowiadasz alternatywne daty jeśli mogą być tańsze.
Odpowiadasz po polsku z cenami w PLN.
${RESULTS_JSON_INSTRUCTION}`,

  hotels: `Jesteś ekspertem od noclegów i zakwaterowania.
Szukasz hoteli, apartamentów i innych noclegów używając web_search.
Skupiasz się na lokalizacji (dzielnica, odległość od atrakcji) i stosunku ceny do jakości.
Zawsze opisujesz każdy hotel: dla kogo jest idealny, zalety, lokalizacja.
Odpowiadasz po polsku z cenami w PLN.
${RESULTS_JSON_INSTRUCTION}`,

  "full-plan": `Jesteś kompleksowym travel planerem.
Tworzysz pełny plan podróży: loty + hotel + plan dnia + budżet + tips.
Używasz web_search do zbierania aktualnych informacji.
Plan jest szczegółowy, praktyczny i uwzględnia różne budżety.
Zawsze szacujesz całkowity koszt podróży.
Odpowiadasz po polsku.
${RESULTS_JSON_INSTRUCTION}`,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/agent.ts
git commit -m "feat: add TravelResult type and RESULTS_JSON output to agent prompts"
```

---

## Task 4: Create App Router API route — parse RESULTS_JSON

**Files:**
- Create: `src/app/api/travel/route.ts`

- [ ] **Step 1: Create directory and file**

```bash
mkdir -p "/Users/klaudiarogalska/Desktop/agent travel/src/app/api/travel"
```

Create `src/app/api/travel/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { runTravelAgent, detectMode, AgentMode, TravelResult } from "../../../../agent";

function parseResultsJson(text: string): TravelResult[] {
  const match = text.match(/<!--\s*RESULTS_JSON\s*([\s\S]*?)\s*-->/);
  if (!match) return [];
  try {
    return JSON.parse(match[1].trim()) as TravelResult[];
  } catch {
    return [];
  }
}

function stripResultsJson(text: string): string {
  return text.replace(/<!--\s*RESULTS_JSON[\s\S]*?-->/g, "").trim();
}

// POST /api/travel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], mode } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Pole 'message' jest wymagane" },
        { status: 400 }
      );
    }

    const resolvedMode: AgentMode = mode || detectMode(message);
    const response = await runTravelAgent({ message, history, mode: resolvedMode });

    const results = parseResultsJson(response.text);
    const text = stripResultsJson(response.text);

    return NextResponse.json({ text, mode: response.mode, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    console.error("[Travel Agent API Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/travel — health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    agent: "Travel Agent",
    modes: ["auto", "flights", "hotels", "full-plan"],
    version: "1.0.0",
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/travel/route.ts
git commit -m "feat: add App Router API route with RESULTS_JSON parsing"
```

---

## Task 5: Create layout.tsx and globals.css

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create globals.css**

Create `src/app/globals.css`:

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --text: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --bg: #f8fafc;
  --white: #ffffff;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  --radius: 8px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 2: Create layout.tsx**

Create `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Agent — Asystent Podróży",
  description: "AI asystent do planowania podróży: loty, hotele, pełne plany.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: add Next.js layout and global styles"
```

---

## Task 6: Create ResultCards component

**Files:**
- Create: `src/app/components/ResultCards.tsx`

- [ ] **Step 1: Create component**

Create `src/app/components/ResultCards.tsx`:

```typescript
"use client";

import { TravelResult } from "../../agent";
import { BookingLink } from "../../deeplinks";

interface Props {
  results: TravelResult[];
  bookingLinks: BookingLink[];
  mode: "flights" | "hotels" | "full-plan" | "auto";
}

export default function ResultCards({ results, bookingLinks, mode }: Props) {
  if (results.length === 0 && bookingLinks.length === 0) return null;

  return (
    <div style={{ marginTop: 32 }}>
      {results.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
            {mode === "hotels" ? "🏨 Znalezione noclegi" : "✈ Znalezione loty"}
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}>
            {results.map((result, i) => (
              <div key={i} style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 20,
                boxShadow: "var(--shadow)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                  {result.name}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>
                  {result.price}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {result.details}
                </div>
                <a
                  href={result.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: 8,
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "10px 0",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    display: "block",
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "var(--accent)")}
                >
                  Rezerwuj →
                </a>
              </div>
            ))}
          </div>
        </>
      )}

      {bookingLinks.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12 }}>
            Porównaj też na:
          </h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {bookingLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 14px",
                  background: "var(--white)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text)",
                  boxShadow: "var(--shadow)",
                  cursor: "pointer",
                }}
              >
                {link.icon} {link.name}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/ResultCards.tsx
git commit -m "feat: add ResultCards component"
```

---

## Task 7: Create SearchForm component

**Files:**
- Create: `src/app/components/SearchForm.tsx`

- [ ] **Step 1: Create component**

Create `src/app/components/SearchForm.tsx`:

```typescript
"use client";

import { useState } from "react";
import { AgentMode } from "../../agent";
import { BookingParams } from "../../deeplinks";

interface SearchState {
  mode: AgentMode;
  from: string;
  to: string;
  city: string;
  date: string;
  dateTo: string;
  passengers: number;
  budget: string;
}

interface Props {
  onSearch: (query: string, mode: AgentMode, bookingParams: BookingParams) => void;
  loading: boolean;
}

const TABS: { key: AgentMode; label: string }[] = [
  { key: "flights", label: "✈ Loty" },
  { key: "hotels", label: "🏨 Hotele" },
  { key: "full-plan", label: "🗺 Pełny plan" },
];

export default function SearchForm({ onSearch, loading }: Props) {
  const [state, setState] = useState<SearchState>({
    mode: "flights",
    from: "",
    to: "",
    city: "",
    date: "",
    dateTo: "",
    passengers: 1,
    budget: "",
  });

  const set = (key: keyof SearchState, value: string | number) =>
    setState((s) => ({ ...s, [key]: value }));

  function buildQuery(): { query: string; bookingParams: BookingParams } {
    const p = state.passengers;
    if (state.mode === "flights") {
      return {
        query: `Loty z ${state.from} do ${state.to} na ${state.date}, ${p} ${p === 1 ? "osoba" : "osoby"}`,
        bookingParams: { mode: "flights", from: state.from, to: state.to, date: state.date, passengers: p },
      };
    }
    if (state.mode === "hotels") {
      return {
        query: `Hotele w ${state.city} od ${state.date} do ${state.dateTo}, ${p} ${p === 1 ? "osoba" : "osoby"}`,
        bookingParams: { mode: "hotels", city: state.city, date: state.date, dateTo: state.dateTo, passengers: p },
      };
    }
    return {
      query: `Zaplanuj podróż z ${state.from} do ${state.to} na ${state.date}${state.dateTo ? ` do ${state.dateTo}` : ""}, ${p} ${p === 1 ? "osoba" : "osoby"}${state.budget ? `, budżet ${state.budget} PLN` : ""}`,
      bookingParams: { mode: "flights", from: state.from, to: state.to, date: state.date, passengers: p },
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { query, bookingParams } = buildQuery();
    onSearch(query, state.mode, bookingParams);
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 14,
    color: "var(--text)",
    background: "var(--white)",
    width: "100%",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 4,
    display: "block",
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: "var(--white)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      boxShadow: "var(--shadow-lg)",
      overflow: "hidden",
    }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => set("mode", tab.key)}
            style={{
              padding: "14px 20px",
              fontSize: 14,
              fontWeight: state.mode === tab.key ? 700 : 500,
              color: state.mode === tab.key ? "var(--accent)" : "var(--text-muted)",
              background: "none",
              border: "none",
              borderBottom: state.mode === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div style={{ padding: 20 }}>
        {state.mode === "flights" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Skąd</label>
              <input style={inputStyle} placeholder="np. Warszawa" value={state.from} onChange={(e) => set("from", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Dokąd</label>
              <input style={inputStyle} placeholder="np. Dublin" value={state.to} onChange={(e) => set("to", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Data wylotu</label>
              <input style={inputStyle} type="date" value={state.date} onChange={(e) => set("date", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Osoby</label>
              <input style={{ ...inputStyle, width: 70 }} type="number" min={1} max={9} value={state.passengers} onChange={(e) => set("passengers", Number(e.target.value))} />
            </div>
          </div>
        )}

        {state.mode === "hotels" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Miasto</label>
              <input style={inputStyle} placeholder="np. Dublin" value={state.city} onChange={(e) => set("city", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Przyjazd</label>
              <input style={inputStyle} type="date" value={state.date} onChange={(e) => set("date", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Wyjazd</label>
              <input style={inputStyle} type="date" value={state.dateTo} onChange={(e) => set("dateTo", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Osoby</label>
              <input style={{ ...inputStyle, width: 70 }} type="number" min={1} max={9} value={state.passengers} onChange={(e) => set("passengers", Number(e.target.value))} />
            </div>
          </div>
        )}

        {state.mode === "full-plan" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Skąd</label>
              <input style={inputStyle} placeholder="np. Warszawa" value={state.from} onChange={(e) => set("from", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Dokąd</label>
              <input style={inputStyle} placeholder="np. Dublin" value={state.to} onChange={(e) => set("to", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Wylot</label>
              <input style={inputStyle} type="date" value={state.date} onChange={(e) => set("date", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Powrót</label>
              <input style={inputStyle} type="date" value={state.dateTo} onChange={(e) => set("dateTo", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Osoby</label>
              <input style={{ ...inputStyle, width: 70 }} type="number" min={1} max={9} value={state.passengers} onChange={(e) => set("passengers", Number(e.target.value))} />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 16,
            background: loading ? "var(--text-muted)" : "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "12px 28px",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%",
          }}
        >
          {loading ? "Szukam..." : "Szukaj"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/SearchForm.tsx
git commit -m "feat: add SearchForm component with tabs"
```

---

## Task 8: Create main page.tsx

**Files:**
- Create: `src/app/page.tsx`

- [ ] **Step 1: Create page**

Create `src/app/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import SearchForm from "./components/SearchForm";
import ResultCards from "./components/ResultCards";
import { AgentMode, TravelResult } from "../agent";
import { BookingParams, BookingLink, generateBookingLinks } from "../deeplinks";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TravelResult[]>([]);
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([]);
  const [agentText, setAgentText] = useState<string>("");
  const [currentMode, setCurrentMode] = useState<AgentMode>("flights");

  async function handleSearch(query: string, mode: AgentMode, bookingParams: BookingParams) {
    setLoading(true);
    setError(null);
    setResults([]);
    setAgentText("");
    setCurrentMode(mode);
    setBookingLinks(generateBookingLinks(bookingParams));

    try {
      const res = await fetch("/api/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, mode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setAgentText(data.text || "");
      setResults(data.results || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
          ✈ Travel Agent
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16 }}>
          Znajdź loty i hotele z pomocą AI
        </p>
      </div>

      {/* Search form */}
      <SearchForm onSearch={handleSearch} loading={loading} />

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15 }}>Agent szuka najlepszych opcji...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 24,
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 8,
          padding: 16,
          color: "#dc2626",
          fontSize: 14,
        }}>
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {!loading && (results.length > 0 || bookingLinks.length > 0) && (
        <ResultCards results={results} bookingLinks={bookingLinks} mode={currentMode} />
      )}

      {/* Agent narrative text */}
      {!loading && agentText && (
        <div style={{
          marginTop: 32,
          background: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          boxShadow: "var(--shadow)",
          fontSize: 14,
          lineHeight: 1.7,
          color: "var(--text)",
          whiteSpace: "pre-wrap",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Analiza agenta
          </div>
          {agentText}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add main page with search and results"
```

---

## Task 9: Verify — run dev server and test

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: PASS — 5 tests (all deeplinks tests).

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Expected: Server running on `http://localhost:3000`. No TypeScript errors.

- [ ] **Step 3: Test in browser**

Open `http://localhost:3000`. Verify:
- Tabs Loty / Hotele / Pełny plan are clickable
- Form fields render for each tab
- Submit "Warszawa" → "Dublin" with a date → shows loading state → returns results cards with "Rezerwuj →" links
- Booking links at the bottom (Google Flights, Skyscanner, Kayak)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: travel agent web UI — complete"
```
