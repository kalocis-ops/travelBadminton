# Supervisor Architecture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single monolithic agent with a Supervisor (Haiku) + Specialists (Sonnet) pattern, reducing token usage ~40% and improving response quality per domain.

**Architecture:** A lightweight Haiku supervisor classifies each query and extracts parameters (no web_search). The matched specialist (Sonnet) then runs with a focused prompt. `agent.ts` keeps the same `runTravelAgent()` interface — no changes to API route or React components.

**Tech Stack:** TypeScript, Next.js 15, Anthropic SDK (`@anthropic-ai/sdk`), Vitest

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/agents/supervisor.ts` | Create | Haiku model, classifies intent, returns `SupervisorResult` JSON |
| `src/agents/flights.ts` | Create | Sonnet, web_search, focused flights prompt |
| `src/agents/hotels.ts` | Create | Sonnet, web_search, focused hotels prompt |
| `src/agents/badminton.ts` | Create | Sonnet, web_search, focused BWF prompt |
| `src/agents/planner.ts` | Create | Sonnet, no web_search, synthesizes from history |
| `src/agent.ts` | Modify | Wire supervisor + specialists into `runTravelAgent()` |
| `src/agents/supervisor.test.ts` | Create | Unit tests for supervisor routing |

---

## Task 1: Create SupervisorResult type and supervisor agent

**Files:**
- Create: `src/agents/supervisor.ts`

The supervisor uses `claude-haiku-4-5-20251001`, no `web_search`. It returns a JSON object with `mode` and extracted `params`. It never streams — just one short completion.

- [ ] **Step 1: Write failing test**

Create `src/agents/supervisor.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseSupervisorResponse } from "./supervisor";

describe("parseSupervisorResponse", () => {
  it("parses valid JSON response", () => {
    const raw = '{"mode":"flights","params":{"from":"Warszawa","to":"Dublin"},"reasoning":"user asked about flights"}';
    const result = parseSupervisorResponse(raw);
    expect(result.mode).toBe("flights");
    expect(result.params.from).toBe("Warszawa");
  });

  it("falls back to auto on invalid JSON", () => {
    const result = parseSupervisorResponse("invalid json");
    expect(result.mode).toBe("auto");
    expect(result.params).toEqual({});
  });

  it("detects badminton mode", () => {
    const raw = '{"mode":"badminton","params":{"badmintonRegion":"Azja","badmintonPeriod":"maj 2026"},"reasoning":"BWF tournament query"}';
    const result = parseSupervisorResponse(raw);
    expect(result.mode).toBe("badminton");
    expect(result.params.badmintonRegion).toBe("Azja");
  });

  it("detects full-plan mode", () => {
    const raw = '{"mode":"full-plan","params":{"from":"Warszawa","to":"Singapur","date":"2026-05-26"},"reasoning":"full trip requested"}';
    const result = parseSupervisorResponse(raw);
    expect(result.mode).toBe("full-plan");
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm test src/agents/supervisor.test.ts 2>&1
```

Expected: FAIL — `Cannot find module './supervisor'`

- [ ] **Step 3: Create `src/agents/supervisor.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { AgentMode } from "../agent";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export interface SupervisorResult {
  mode: AgentMode;
  params: {
    from?: string;
    to?: string;
    date?: string;
    dateTo?: string;
    city?: string;
    badmintonRegion?: string;
    badmintonPeriod?: string;
    badmintonCategory?: string;
  };
  reasoning: string;
}

const SUPERVISOR_PROMPT = `Jesteś routerem zapytań dla agenta podróży. Analizujesz zapytanie i zwracasz JSON.

Dostępne tryby:
- "flights" — użytkownik pyta tylko o loty
- "hotels" — użytkownik pyta tylko o hotele/noclegi
- "badminton" — użytkownik pyta o turnieje BWF/badmintona
- "full-plan" — użytkownik chce pełny plan podróży (loty + hotel + itinerary)
- "auto" — nie można określić trybu

Zwróć TYLKO JSON, bez żadnego dodatkowego tekstu:
{
  "mode": "<tryb>",
  "params": {
    "from": "<miasto wylotu lub null>",
    "to": "<miasto docelowe lub null>",
    "date": "<data w formacie YYYY-MM-DD lub null>",
    "dateTo": "<data powrotu YYYY-MM-DD lub null>",
    "city": "<miasto dla hotelu lub null>",
    "badmintonRegion": "<region turniejów lub null>",
    "badmintonPeriod": "<okres np. 'maj 2026' lub null>",
    "badmintonCategory": "<kategoria BWF lub null>"
  },
  "reasoning": "<jedno zdanie dlaczego ten tryb>"
}

Pomijaj pola null — nie wstawiaj ich do JSON.`;

export function parseSupervisorResponse(raw: string): SupervisorResult {
  try {
    // Extract JSON if wrapped in markdown code block
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || raw.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : raw;
    const parsed = JSON.parse(jsonStr.trim());
    return {
      mode: parsed.mode || "auto",
      params: parsed.params || {},
      reasoning: parsed.reasoning || "",
    };
  } catch {
    return { mode: "auto", params: {}, reasoning: "parse error" };
  }
}

export async function runSupervisor(message: string): Promise<SupervisorResult> {
  try {
    const response = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SUPERVISOR_PROMPT,
      messages: [{ role: "user", content: message }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    return parseSupervisorResponse(raw);
  } catch {
    return { mode: "auto", params: {}, reasoning: "supervisor error" };
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm test src/agents/supervisor.test.ts 2>&1
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/agents/supervisor.ts src/agents/supervisor.test.ts
git commit -m "feat: add Haiku supervisor agent with routing and param extraction"
```

---

## Task 2: Create specialist agents

**Files:**
- Create: `src/agents/flights.ts`
- Create: `src/agents/hotels.ts`
- Create: `src/agents/badminton.ts`
- Create: `src/agents/planner.ts`

All specialists share the same streaming pattern from `agent.ts`. Extract it into a shared helper inside each file.

- [ ] **Step 1: Create `src/agents/flights.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { TravelQuery, TravelResponse } from "../agent";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const RESULTS_JSON_INSTRUCTION = `
Na samym końcu odpowiedzi ZAWSZE dodaj blok JSON z maksymalnie 4 najlepszymi wynikami:
<!-- RESULTS_JSON
[{"name":"Nazwa linii lotniczej","price":"cena w PLN","details":"trasa i czas lotu","bookingUrl":"https://link-do-rezerwacji","venue":""}]
-->`;

const FLIGHTS_PROMPT = `Jesteś ekspertem od wyszukiwania lotów. Używasz web_search.

Sprawdzasz w kolejności: Google Flights, Skyscanner, Kayak, linie bezpośrednie.
Pokazujesz minimum 3 opcje w tabeli: Linia | Trasa | Godziny | Czas lotu | Cena.
Podpowiadasz alternatywne daty jeśli mogą być tańsze o >20%.
Odpowiadasz po polsku z cenami w PLN. Ceny oznaczasz jako orientacyjne (~).
${RESULTS_JSON_INSTRUCTION}`;

export async function runFlightsAgent(
  query: TravelQuery,
  onChunk?: (chunk: string) => void
): Promise<TravelResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...(query.history || []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: query.message },
  ];

  let fullText = "";

  const stream = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: FLIGHTS_PROMPT,
    tools: [{ type: "web_search_20250305" as const, name: "web_search" }] as unknown as Anthropic.Tool[],
    messages,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onChunk?.(event.delta.text);
    }
  }

  return { text: fullText, mode: "flights" };
}
```

- [ ] **Step 2: Create `src/agents/hotels.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { TravelQuery, TravelResponse } from "../agent";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const RESULTS_JSON_INSTRUCTION = `
Na samym końcu odpowiedzi ZAWSZE dodaj blok JSON z maksymalnie 4 najlepszymi wynikami:
<!-- RESULTS_JSON
[{"name":"Nazwa hotelu","price":"cena za noc w PLN","details":"lokalizacja i ocena","bookingUrl":"https://link-do-rezerwacji","venue":""}]
-->`;

const HOTELS_PROMPT = `Jesteś ekspertem od noclegów. Używasz web_search.

Szukasz hoteli, apartamentów i hosteli na Booking.com, Hotels.com, Airbnb.
Dla każdego opisujesz: lokalizacja (dzielnica, odległość od centrum/areny), ocena, cena/noc.
Sortujesz od najlepszego stosunku ceny do jakości.
Odpowiadasz po polsku z cenami w PLN.
${RESULTS_JSON_INSTRUCTION}`;

export async function runHotelsAgent(
  query: TravelQuery,
  onChunk?: (chunk: string) => void
): Promise<TravelResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...(query.history || []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: query.message },
  ];

  let fullText = "";

  const stream = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: HOTELS_PROMPT,
    tools: [{ type: "web_search_20250305" as const, name: "web_search" }] as unknown as Anthropic.Tool[],
    messages,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onChunk?.(event.delta.text);
    }
  }

  return { text: fullText, mode: "hotels" };
}
```

- [ ] **Step 3: Create `src/agents/badminton.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { TravelQuery, TravelResponse } from "../agent";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const RESULTS_JSON_INSTRUCTION = `
Na samym końcu odpowiedzi ZAWSZE dodaj blok JSON z maksymalnie 4 najlepszymi wynikami:
<!-- RESULTS_JSON
[{"name":"Nazwa turnieju","price":"cena biletów w PLN","details":"kraj, daty, kategoria BWF","bookingUrl":"https://bwfbadminton.com/...","venue":"Nazwa areny, Miasto"}]
-->`;

const BADMINTON_PROMPT = `Jesteś ekspertem od kalendarza turniejów BWF. Używasz web_search.

Szukasz w tej kolejności:
1. site:bwfbadminton.com calendar
2. "BWF World Tour" schedule {ROK}
3. badminton tournament {REGION} {ROK}

Zwracasz tabelę: Turniej | Kraj | Daty | Kategoria | Pula nagród | Arena.
Zawsze linkujesz do bwfbadminton.com. Zaznaczasz że daty mogą ulec zmianie.
Kategorie BWF: Super 1000, Super 750, Super 500, Super 300, Grand Prix, International Series.
Odpowiadasz po polsku.
${RESULTS_JSON_INSTRUCTION}`;

export async function runBadmintonAgent(
  query: TravelQuery,
  onChunk?: (chunk: string) => void
): Promise<TravelResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...(query.history || []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: query.message },
  ];

  let fullText = "";

  const stream = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: BADMINTON_PROMPT,
    tools: [{ type: "web_search_20250305" as const, name: "web_search" }] as unknown as Anthropic.Tool[],
    messages,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onChunk?.(event.delta.text);
    }
  }

  return { text: fullText, mode: "badminton" };
}
```

- [ ] **Step 4: Create `src/agents/planner.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { TravelQuery, TravelResponse } from "../agent";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const RESULTS_JSON_INSTRUCTION = `
Na samym końcu odpowiedzi ZAWSZE dodaj blok JSON z maksymalnie 4 elementami planu:
<!-- RESULTS_JSON
[{"name":"Element planu","price":"szacowany koszt PLN","details":"szczegóły","bookingUrl":"https://link","venue":""}]
-->`;

const PLANNER_PROMPT = `Jesteś travel planerem. NIE używasz web_search — pracujesz na danych z rozmowy.

Tworzysz kompletny plan podróży na podstawie wcześniej znalezionych lotów, hoteli i turniejów.
Plan zawiera: dzień po dniu, szacowany budżet całkowity, tips praktyczne.
Jeśli brakuje danych — zaznaczasz co należy jeszcze zweryfikować.
Odpowiadasz po polsku. Budżet podajesz w PLN.
${RESULTS_JSON_INSTRUCTION}`;

export async function runPlannerAgent(
  query: TravelQuery,
  onChunk?: (chunk: string) => void
): Promise<TravelResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...(query.history || []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: query.message },
  ];

  let fullText = "";

  // Planner deliberately has NO web_search tool
  const stream = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: PLANNER_PROMPT,
    messages,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onChunk?.(event.delta.text);
    }
  }

  return { text: fullText, mode: "full-plan" };
}
```

- [ ] **Step 5: TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 6: Run all tests**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm test 2>&1
```

Expected: all tests passing (supervisor tests + existing 7 deeplinks tests).

- [ ] **Step 7: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/agents/flights.ts src/agents/hotels.ts src/agents/badminton.ts src/agents/planner.ts
git commit -m "feat: add specialist agents (flights, hotels, badminton, planner)"
```

---

## Task 3: Wire supervisor into agent.ts

**Files:**
- Modify: `src/agent.ts`

This is the integration task. `runTravelAgent()` keeps the same signature. Internally it now: (1) calls supervisor to get routing, (2) calls the matching specialist, (3) falls back to old logic if supervisor fails.

- [ ] **Step 1: Update `src/agent.ts`**

Replace the entire file with:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { runSupervisor } from "./agents/supervisor";
import { runFlightsAgent } from "./agents/flights";
import { runHotelsAgent } from "./agents/hotels";
import { runBadmintonAgent } from "./agents/badminton";
import { runPlannerAgent } from "./agents/planner";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type AgentMode = "flights" | "hotels" | "full-plan" | "auto" | "badminton";

export interface TravelQuery {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  mode?: AgentMode;
}

export interface TravelResult {
  name: string;
  price: string;
  details: string;
  bookingUrl: string;
  venue?: string;
}

export interface TravelResponse {
  text: string;
  mode: AgentMode;
  results?: TravelResult[];
}

// Fallback: used when supervisor is bypassed or mode is "auto"
const FALLBACK_PROMPT = `Jesteś inteligentnym asystentem podróży. Analizujesz zapytanie i:
- Jeśli pyta o loty → skupiasz się na lotach
- Jeśli pyta o hotele → skupiasz się na hotelach
- Jeśli pyta o turnieje badmintona → szukasz turniejów BWF
- Jeśli pyta o całą podróż → tworzysz kompletny plan

Używasz web_search. Odpowiadasz po polsku z cenami w PLN.`;

export async function runTravelAgent(
  query: TravelQuery,
  onChunk?: (chunk: string) => void
): Promise<TravelResponse> {
  // If mode explicitly provided by UI (not "auto"), skip supervisor
  const explicitMode = query.mode && query.mode !== "auto" ? query.mode : null;

  let mode: AgentMode;

  if (explicitMode) {
    mode = explicitMode;
  } else {
    // Use supervisor to classify
    const supervised = await runSupervisor(query.message);
    mode = supervised.mode;
  }

  // Route to specialist
  switch (mode) {
    case "flights":
      return runFlightsAgent(query, onChunk);
    case "hotels":
      return runHotelsAgent(query, onChunk);
    case "badminton":
      return runBadmintonAgent(query, onChunk);
    case "full-plan":
      return runPlannerAgent(query, onChunk);
    default:
      return runFallback(query, onChunk);
  }
}

async function runFallback(
  query: TravelQuery,
  onChunk?: (chunk: string) => void
): Promise<TravelResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...(query.history || []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: query.message },
  ];

  let fullText = "";

  const stream = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: FALLBACK_PROMPT,
    tools: [{ type: "web_search_20250305" as const, name: "web_search" }] as unknown as Anthropic.Tool[],
    messages,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onChunk?.(event.delta.text);
    }
  }

  return { text: fullText, mode: "auto" };
}

// Kept for backward compatibility — still used as fallback by API route
export function detectMode(message: string): AgentMode {
  const lower = message.toLowerCase();

  const badmintonKeywords = ["badminton", "bwf", "turniej", "thomas cup", "uber cup", "sudirman", "world tour", "super series"];
  const flightKeywords = ["lot", "bilet", "wylot", "przylot", "lotnisko", "linia lotnicza", "samolot"];
  const hotelKeywords = ["hotel", "nocleg", "zakwaterowanie", "apartament", "gdzie spać", "hostel"];
  const planKeywords = ["zaplanuj", "plan podróży", "trip", "wyjazd", "zorganizuj", "całą podróż"];

  const hasBadminton = badmintonKeywords.some((k) => lower.includes(k));
  const hasFlights = flightKeywords.some((k) => lower.includes(k));
  const hasHotels = hotelKeywords.some((k) => lower.includes(k));
  const hasPlan = planKeywords.some((k) => lower.includes(k));

  if (hasBadminton) return "badminton";
  if (hasPlan || (hasFlights && hasHotels)) return "full-plan";
  if (hasFlights) return "flights";
  if (hasHotels) return "hotels";
  return "auto";
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm test 2>&1
```

Expected: all 11 tests passing (4 supervisor + 7 deeplinks).

- [ ] **Step 4: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/agent.ts
git commit -m "feat: wire supervisor + specialists into runTravelAgent"
```

---

## Task 4: Build + push

- [ ] **Step 1: Production build**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`.

- [ ] **Step 2: Run all tests one final time**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm test 2>&1
```

Expected: 11 tests passing.

- [ ] **Step 3: Push**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && git push
```
