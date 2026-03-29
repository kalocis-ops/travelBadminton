# Tournament Selection & Hotel Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After finding BWF tournaments, the user selects one and can trigger a full trip plan or hotel search using the venue address.

**Architecture:** Add `venue?` to `TravelResult`, update badminton system prompt to return venue, reorder tabs so Badminton is first, add selection button to tournament cards, add action panel to page.tsx that builds hotel/full-plan queries from the selected tournament.

**Tech Stack:** TypeScript, Next.js 15 App Router, React, Vitest

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/agent.ts` | Modify | Add `venue?` to `TravelResult`, update badminton RESULTS_JSON instruction |
| `src/app/components/SearchForm.tsx` | Modify | Reorder TABS (badminton first), change initial `mode` to `"badminton"` |
| `src/app/components/ResultCards.tsx` | Modify | Add `onSelectTournament?` prop, render "Wybierz turniej" button in badminton mode |
| `src/app/page.tsx` | Modify | Add `selectedTournament` state, pass `onSelectTournament` to ResultCards, render action panel |

---

## Task 1: Add `venue` field to TravelResult

**Files:**
- Modify: `src/agent.ts`

- [ ] **Step 1: Add `venue` to TravelResult interface**

In `src/agent.ts`, replace:

```typescript
export interface TravelResult {
  name: string;
  price: string;
  details: string;
  bookingUrl: string;
}
```

With:

```typescript
export interface TravelResult {
  name: string;
  price: string;
  details: string;
  bookingUrl: string;
  venue?: string;
}
```

- [ ] **Step 2: Update RESULTS_JSON_INSTRUCTION for venue**

In `src/agent.ts`, replace the `RESULTS_JSON_INSTRUCTION` constant:

```typescript
const RESULTS_JSON_INSTRUCTION = `
Na samym końcu odpowiedzi ZAWSZE dodaj blok JSON z maksymalnie 4 najlepszymi wynikami:
<!-- RESULTS_JSON
[{"name":"Nazwa linii/hotelu","price":"cena w PLN","details":"kluczowe szczegóły w 1 linii","bookingUrl":"https://bezposredni-link-do-rezerwacji","venue":"nazwa areny i miasto (tylko dla turniejów badmintona, puste dla lotów/hoteli)"}]
-->
Blok RESULTS_JSON musi być na samym końcu, po całym tekście. bookingUrl to link bezpośrednio do wyszukiwania na stronie linii/hotelu. Dla turniejów badmintona pole venue to nazwa areny + miasto, np. "Singapore Indoor Stadium, Singapore" lub "Axiata Arena, Kuala Lumpur".`;
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/agent.ts
git commit -m "feat: add venue field to TravelResult for tournament selection"
```

---

## Task 2: Reorder tabs — Badminton first

**Files:**
- Modify: `src/app/components/SearchForm.tsx`

- [ ] **Step 1: Reorder TABS and change default mode**

In `src/app/components/SearchForm.tsx`, replace the `TABS` constant:

```typescript
const TABS: { key: AgentMode; label: string }[] = [
  { key: "badminton", label: "🏸 Badminton" },
  { key: "flights", label: "✈ Loty" },
  { key: "hotels", label: "🏨 Hotele" },
  { key: "full-plan", label: "🗺 Pełny plan" },
];
```

And replace the `useState<SearchState>` initial value — change `mode: "flights"` to `mode: "badminton"`:

```typescript
const [state, setState] = useState<SearchState>({
  mode: "badminton",
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

- [ ] **Step 2: TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/app/components/SearchForm.tsx
git commit -m "feat: set badminton as default first tab"
```

---

## Task 3: Add "Wybierz turniej" button to ResultCards

**Files:**
- Modify: `src/app/components/ResultCards.tsx`

- [ ] **Step 1: Add `onSelectTournament` prop**

In `src/app/components/ResultCards.tsx`, replace the `Props` interface:

```typescript
import { TravelResult } from "../../agent";
import { BookingLink } from "../../deeplinks";

interface Props {
  results: TravelResult[];
  bookingLinks: BookingLink[];
  mode: "flights" | "hotels" | "full-plan" | "auto" | "badminton";
  onSelectTournament?: (result: TravelResult) => void;
}
```

And replace the function signature:

```typescript
export default function ResultCards({ results, bookingLinks, mode, onSelectTournament }: Props) {
```

- [ ] **Step 2: Add "Wybierz turniej" button inside the card map**

In the card `<div>` (the one with `flexDirection: "column"`), after the existing `<a>` booking button, add the select button conditionally for badminton mode:

```typescript
              {mode === "badminton" && onSelectTournament && (
                <button
                  type="button"
                  onClick={() => onSelectTournament(result)}
                  style={{
                    marginTop: 4,
                    background: "transparent",
                    color: "var(--accent)",
                    border: "2px solid var(--accent)",
                    borderRadius: 6,
                    padding: "10px 0",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    width: "100%",
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "var(--accent)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                >
                  Wybierz turniej →
                </button>
              )}
```

Place it after the closing `</a>` tag of the "Rezerwuj →" link, still inside the card `<div>`.

- [ ] **Step 3: TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/app/components/ResultCards.tsx
git commit -m "feat: add Wybierz turniej button to badminton result cards"
```

---

## Task 4: Add selection state and action panel to page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add `selectedTournament` state**

In `src/app/page.tsx`, add after the existing `useState` declarations:

```typescript
  const [selectedTournament, setSelectedTournament] = useState<import("../agent").TravelResult | null>(null);
```

- [ ] **Step 2: Clear selectedTournament on new search**

In `handleSearch`, add `setSelectedTournament(null);` after `setResults([]);`:

```typescript
  async function handleSearch(query: string, mode: AgentMode, bookingParams: BookingParams) {
    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedTournament(null);
    setAgentText("");
    setCurrentMode(mode);
    setBookingLinks(generateBookingLinks(bookingParams));
    // ... rest unchanged
```

- [ ] **Step 3: Pass `onSelectTournament` to ResultCards**

Replace the `<ResultCards ... />` line:

```typescript
        <ResultCards
          results={results}
          bookingLinks={bookingLinks}
          mode={currentMode}
          onSelectTournament={currentMode === "badminton" ? setSelectedTournament : undefined}
        />
```

- [ ] **Step 4: Add action panel JSX**

After the `{!loading && (results.length > 0 || bookingLinks.length > 0) && (...)}` block and before the `agentText` block, add:

```typescript
      {selectedTournament && (
        <div style={{
          marginTop: 24,
          background: "var(--white)",
          border: "2px solid var(--accent)",
          borderRadius: 12,
          padding: "20px 24px",
          boxShadow: "var(--shadow-lg)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Wybrany turniej
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>
            {selectedTournament.name}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            {selectedTournament.venue || selectedTournament.details}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                const venue = selectedTournament.venue || selectedTournament.details;
                handleSearch(
                  `Zaplanuj podróż z Warszawy do ${venue} na turniej badmintona ${selectedTournament.name}. Daty: ${selectedTournament.details}. Znajdź loty i hotel w pobliżu areny.`,
                  "full-plan",
                  { mode: "flights", from: "Warszawa", to: venue }
                );
              }}
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              ✈ Zaplanuj całą podróż
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                const venue = selectedTournament.venue || selectedTournament.details;
                handleSearch(
                  `Hotele w pobliżu ${venue}. Turniej ${selectedTournament.name}, daty: ${selectedTournament.details}.`,
                  "hotels",
                  { mode: "hotels", city: venue }
                );
              }}
              style={{
                background: "transparent",
                color: "var(--accent)",
                border: "2px solid var(--accent)",
                borderRadius: 6,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              🏨 Hotele w pobliżu
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 5: TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 6: Run tests**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm test
```

Expected: 7 tests passing.

- [ ] **Step 7: Commit and push**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/app/page.tsx
git commit -m "feat: add tournament selection state and action panel"
git push
```

---

## Task 5: Verify — TypeScript + tests + build

- [ ] **Step 1: Full TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 2: Run all tests**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm test
```

Expected: 7 tests passing.

- [ ] **Step 3: Production build**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Final push if anything changed**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add -A
git commit -m "feat: tournament selection complete" 2>/dev/null || echo "nothing to commit"
git push
```
