# Badminton Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "🏸 Badminton" tab to the travel agent website that searches BWF tournaments and returns results with links to bwfbadminton.com.

**Architecture:** Add `"badminton"` to `AgentMode`, add its system prompt to `SYSTEM_PROMPTS`, extend `SearchForm` with a new tab (fields: period, region, category), extend `ResultCards` to render tournament cards, add BWF deep link to `deeplinks.ts`.

**Tech Stack:** TypeScript, Next.js 15 App Router, Vitest

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/agent.ts` | Modify | Add `"badminton"` to `AgentMode`, add system prompt, update `detectMode` |
| `src/deeplinks.ts` | Modify | Add `"badminton"` mode + `generateBadmintonLinks()` |
| `src/deeplinks.test.ts` | Modify | Add tests for badminton links |
| `src/app/components/SearchForm.tsx` | Modify | Add badminton tab + fields (period, region, category) |
| `src/app/components/ResultCards.tsx` | Modify | Add tournament card rendering for badminton mode |

---

## Task 1: Extend agent.ts — add badminton mode

**Files:**
- Modify: `src/agent.ts`

- [ ] **Step 1: Update AgentMode type**

In `src/agent.ts` line 9, replace:
```typescript
export type AgentMode = "flights" | "hotels" | "full-plan" | "auto";
```
With:
```typescript
export type AgentMode = "flights" | "hotels" | "full-plan" | "auto" | "badminton";
```

- [ ] **Step 2: Add badminton system prompt to SYSTEM_PROMPTS**

In `src/agent.ts`, inside `const SYSTEM_PROMPTS: Record<AgentMode, string> = { ... }`, add after the `"full-plan"` entry (before the closing `};`):

```typescript
  badminton: `Jesteś ekspertem od światowego badmintona i kalendarza turniejów BWF. Wyszukujesz turnieje używając web_search i filtrujesz je według kryteriów użytkownika.

Workflow:
1. Przeszukaj te źródła w kolejności:
   - site:bwfbadminton.com calendar — oficjalny kalendarz BWF
   - "BWF World Tour" schedule — przegląd sezonu
   - badminton tournament {REGION} {ROK} — filtrowanie regionalne
2. Zwróć wyniki w tabeli: Turniej | Kraj | Daty | Kategoria | Pula nagród
3. Dodaj szczegóły: arena, bilety, link BWF
4. Jeśli użytkownik chce plan podróży — dodaj loty i hotele

Odpowiadasz po polsku. Zawsze linkuj do bwfbadminton.com. Zaznaczaj że daty mogą ulec zmianie.
Kategorie BWF: Super 1000, Super 750, Super 500, Super 300, Grand Prix, International Series.
${RESULTS_JSON_INSTRUCTION}`,
```

- [ ] **Step 3: Update detectMode to detect badminton queries**

In `src/agent.ts`, replace the entire `detectMode` function with:

```typescript
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

- [ ] **Step 4: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/agent.ts
git commit -m "feat: add badminton agent mode"
```

---

## Task 2: Extend deeplinks.ts — add badminton links

**Files:**
- Modify: `src/deeplinks.ts`
- Modify: `src/deeplinks.test.ts`

- [ ] **Step 1: Write failing test**

In `src/deeplinks.test.ts`, add at the end:

```typescript
describe("generateBookingLinks — badminton", () => {
  it("returns 2 badminton links", () => {
    const links = generateBookingLinks({
      mode: "badminton",
      badmintonRegion: "Europa",
      badmintonPeriod: "2026",
    });
    expect(links).toHaveLength(2);
  });

  it("BWF link contains bwfbadminton.com", () => {
    const links = generateBookingLinks({ mode: "badminton", badmintonRegion: "Azja", badmintonPeriod: "2026" });
    const bwf = links.find((l) => l.name === "BWF Calendar")!;
    expect(bwf.url).toContain("bwfbadminton.com");
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm test
```

Expected: FAIL — `"badminton"` not assignable to `BookingParams["mode"]`

- [ ] **Step 3: Add badminton support to deeplinks.ts**

In `src/deeplinks.ts`, replace the `BookingParams` interface with:

```typescript
export interface BookingParams {
  mode: "flights" | "hotels" | "badminton";
  from?: string;
  to?: string;
  city?: string;
  date?: string;
  dateTo?: string;
  passengers?: number;
  badmintonRegion?: string;
  badmintonPeriod?: string;
  badmintonCategory?: string;
}
```

In `generateBookingLinks`, add badminton branch:

```typescript
export function generateBookingLinks(params: BookingParams): BookingLink[] {
  if (params.mode === "flights") return generateFlightLinks(params);
  if (params.mode === "badminton") return generateBadmintonLinks(params);
  return generateHotelLinks(params);
}
```

Add new function at the end of the file:

```typescript
function generateBadmintonLinks(params: BookingParams): BookingLink[] {
  const { badmintonRegion = "", badmintonPeriod = "" } = params;
  const query = encodeURIComponent(`BWF World Tour ${badmintonPeriod} ${badmintonRegion}`);

  return [
    {
      name: "BWF Calendar",
      icon: "🏸",
      url: "https://bwfbadminton.com/calendar/",
    },
    {
      name: "BWF World Tour",
      icon: "🌍",
      url: `https://bwfbadminton.com/tournament/?search=${query}`,
    },
  ];
}
```

- [ ] **Step 4: Run tests — verify 7 pass**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm test
```

Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/deeplinks.ts src/deeplinks.test.ts
git commit -m "feat: add badminton booking links"
```

---

## Task 3: Add badminton tab to SearchForm

**Files:**
- Modify: `src/app/components/SearchForm.tsx`

- [ ] **Step 1: Add badminton fields to SearchState**

In `src/app/components/SearchForm.tsx`, replace the `SearchState` interface with:

```typescript
interface SearchState {
  mode: AgentMode;
  from: string;
  to: string;
  city: string;
  date: string;
  dateTo: string;
  passengers: number;
  budget: string;
  badmintonPeriod: string;
  badmintonRegion: string;
  badmintonCategory: string;
}
```

Replace `useState<SearchState>` initial value with:

```typescript
const [state, setState] = useState<SearchState>({
  mode: "flights",
  from: "",
  to: "",
  city: "",
  date: "",
  dateTo: "",
  passengers: 1,
  budget: "",
  badmintonPeriod: "",
  badmintonRegion: "",
  badmintonCategory: "wszystkie",
});
```

- [ ] **Step 2: Add badminton to TABS array**

Replace the `TABS` constant with:

```typescript
const TABS: { key: AgentMode; label: string }[] = [
  { key: "flights", label: "✈ Loty" },
  { key: "hotels", label: "🏨 Hotele" },
  { key: "full-plan", label: "🗺 Pełny plan" },
  { key: "badminton", label: "🏸 Badminton" },
];
```

- [ ] **Step 3: Add badminton to buildQuery**

In `buildQuery()`, add badminton case before the final `return` statement:

```typescript
    if (state.mode === "badminton") {
      const cat = state.badmintonCategory !== "wszystkie" ? `, kategoria: ${state.badmintonCategory}` : "";
      return {
        query: `Turnieje badmintona BWF: okres ${state.badmintonPeriod || "najbliższe miesiące"}, region ${state.badmintonRegion || "cały świat"}${cat}`,
        bookingParams: {
          mode: "badminton",
          badmintonPeriod: state.badmintonPeriod,
          badmintonRegion: state.badmintonRegion,
          badmintonCategory: state.badmintonCategory,
        },
      };
    }
```

- [ ] **Step 4: Add badminton fields JSX**

In the JSX `<div style={{ padding: 20 }}>` section, add after the `full-plan` block:

```typescript
        {state.mode === "badminton" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Okres</label>
              <input style={inputStyle} placeholder="np. kwiecień 2026" value={state.badmintonPeriod} onChange={(e) => set("badmintonPeriod", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Region</label>
              <input style={inputStyle} placeholder="np. Europa, Azja, cały świat" value={state.badmintonRegion} onChange={(e) => set("badmintonRegion", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Kategoria BWF</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={state.badmintonCategory}
                onChange={(e) => set("badmintonCategory", e.target.value)}
              >
                <option value="wszystkie">Wszystkie</option>
                <option value="Super 1000">Super 1000</option>
                <option value="Super 750">Super 750</option>
                <option value="Super 500">Super 500</option>
                <option value="Super 300">Super 300</option>
                <option value="Grand Prix">Grand Prix</option>
              </select>
            </div>
          </div>
        )}
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/app/components/SearchForm.tsx
git commit -m "feat: add badminton tab to search form"
```

---

## Task 4: Update ResultCards for tournament display

**Files:**
- Modify: `src/app/components/ResultCards.tsx`

- [ ] **Step 1: Update the heading logic**

In `src/app/components/ResultCards.tsx`, replace the heading line:

```typescript
            {mode === "hotels" ? "🏨 Znalezione noclegi" : "✈ Znalezione loty"}
```

With:

```typescript
            {mode === "hotels" ? "🏨 Znalezione noclegi" : mode === "badminton" ? "🏸 Turnieje BWF" : "✈ Znalezione loty"}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/app/components/ResultCards.tsx
git commit -m "feat: update result cards heading for badminton mode"
```

---

## Task 5: Verify — run tests and check TypeScript

- [ ] **Step 1: Run all tests**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm test
```

Expected: PASS — 7 tests passing.

- [ ] **Step 2: TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors. If errors appear, fix them and re-run.

- [ ] **Step 3: Final commit if needed**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add -A
git commit -m "feat: badminton integration complete" 2>/dev/null || echo "nothing to commit"
```
