# Tournament Selection & Hotel Search — Design Spec

**Date:** 2026-03-29

## Goal

After finding BWF tournaments, the user selects one and gets either a full trip plan (flights + hotels + itinerary) or hotels near the venue — using the venue address extracted from the tournament result.

## Architecture

### Data model change — `TravelResult`

Add `venue?: string` to `TravelResult` in `src/agent.ts`:

```typescript
export interface TravelResult {
  name: string;
  price: string;
  details: string;
  bookingUrl: string;
  venue?: string; // arena name + city, used for hotel/plan search
}
```

Update `RESULTS_JSON_INSTRUCTION` in the badminton system prompt to always include `venue` (e.g. `"Singapore Indoor Stadium, Singapore"`).

### State change — `page.tsx`

- Default mode changes from `"flights"` to `"badminton"`
- New state: `selectedTournament: TravelResult | null`
- When `selectedTournament` is set, render an action panel below results
- Each action button calls `handleSearch` with a pre-built query

### Query building

**Full plan query:**
```
Zaplanuj podróż z Warszawy do {venue} na turniej badmintona {name}. Daty: {details}. Znajdź loty i hotel w pobliżu areny.
```
Mode: `"full-plan"`

**Hotels query:**
```
Hotele w pobliżu {venue}. Turniej {name}, daty: {details}.
```
Mode: `"hotels"`, `bookingParams.city = venue`

### Component changes

**`SearchForm.tsx`** — Badminton tab first, default mode `"badminton"`:
```typescript
const TABS = [
  { key: "badminton", label: "🏸 Badminton" },
  { key: "flights",   label: "✈ Loty" },
  { key: "hotels",    label: "🏨 Hotele" },
  { key: "full-plan", label: "🗺 Pełny plan" },
];
// initial state: mode: "badminton"
```

**`ResultCards.tsx`** — In badminton mode, each card gets "Wybierz turniej →" button. Calls `onSelectTournament(result)` prop (optional, only passed in badminton mode).

**`page.tsx`** — Action panel rendered when `selectedTournament !== null`:
```
┌──────────────────────────────────────────────────────┐
│ Wybrany: {name}                                       │
│ {venue} · {details}                                   │
│  [✈ Zaplanuj całą podróż]   [🏨 Hotele w pobliżu]   │
└──────────────────────────────────────────────────────┘
```

## UI Flow

```
1. App opens → Badminton tab active
2. User searches for tournaments
3. Result cards appear, each with "Wybierz turniej →"
4. User clicks a card → action panel slides in below results
5a. "Zaplanuj całą podróż" → full-plan search, results replace tournament cards
5b. "Hotele w pobliżu"     → hotels search, results replace tournament cards
6. User can re-run tournament search by clicking Badminton tab
```

## Files Changed

| File | Change |
|------|--------|
| `src/agent.ts` | Add `venue?` to `TravelResult`, update badminton RESULTS_JSON instruction |
| `src/app/page.tsx` | Default mode `"badminton"`, add `selectedTournament` state + action panel |
| `src/app/components/SearchForm.tsx` | Reorder tabs, default mode `"badminton"` |
| `src/app/components/ResultCards.tsx` | Add `onSelectTournament` prop + "Wybierz" button for badminton mode |

## Out of Scope

- Saving selected tournament between sessions
- Multiple tournament comparison
- Automatic parallel search (hotels + plan at the same time)
