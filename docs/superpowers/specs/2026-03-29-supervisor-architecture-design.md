# Supervisor Architecture — Design Spec

**Date:** 2026-03-29

## Goal

Replace the single monolithic `runTravelAgent()` with a Supervisor + Specialists pattern. A cheap Haiku model routes each query to the right specialist. Each specialist has a focused prompt and uses the optimal model. Token usage drops ~40% per query.

## Architecture

```
User query
    ↓
[Supervisor] — claude-haiku-4-5-20251001
  No web_search. Classifies intent, extracts parameters.
  ~300 tokens input, ~100 output.
    ↓
[Specialist] — claude-sonnet-4-6
  flights / hotels / badminton / planner
  Each has a focused prompt + web_search (except planner)
  ~3-4k tokens per call
```

## Model Assignments

| Agent | Model | web_search | Reason |
|-------|-------|-----------|--------|
| Supervisor | `claude-haiku-4-5-20251001` | No | Just classification, no search needed |
| FlightsAgent | `claude-sonnet-4-6` | Yes | Complex reasoning about routes/prices |
| HotelsAgent | `claude-sonnet-4-6` | Yes | Location + value reasoning |
| BadmintonAgent | `claude-sonnet-4-6` | Yes | Domain knowledge + BWF calendar |
| PlannerAgent | `claude-sonnet-4-6` | No | Synthesizes existing data, no new search |

## Token Optimization

- Supervisor uses Haiku (~10x cheaper than Sonnet) on every query
- Each specialist prompt is ~40% shorter — focused only on its domain
- `RESULTS_JSON_INSTRUCTION` only included in agents that return structured results (not Supervisor or Planner in synthesis mode)
- Planner has no `web_search` — uses conversation history to build plan

## Interfaces

### SupervisorResult

```typescript
interface SupervisorResult {
  mode: AgentMode;  // "flights" | "hotels" | "badminton" | "full-plan" | "auto"
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
  reasoning: string;  // short log for debugging
}
```

### File Structure

```
src/agents/
  supervisor.ts    — Haiku, returns SupervisorResult JSON
  flights.ts       — Sonnet, web_search, returns TravelResponse
  hotels.ts        — Sonnet, web_search, returns TravelResponse
  badminton.ts     — Sonnet, web_search, returns TravelResponse
  planner.ts       — Sonnet, no web_search, returns TravelResponse
src/agent.ts       — facade: same runTravelAgent() interface, now routes via supervisor
```

## Data Flow

1. `runTravelAgent(query)` called from API route (unchanged)
2. `agent.ts` calls `supervisor.ts` → gets `SupervisorResult`
3. `agent.ts` calls the matching specialist with extracted params injected into the message
4. Specialist returns `TravelResponse` (same shape as before)
5. `agent.ts` returns result to API route (unchanged)

**Fallback:** If Supervisor returns `mode: "auto"` or fails → call existing monolithic agent logic as before.

**Planner flow:** When `mode === "full-plan"`, Planner receives the conversation history (which already contains results from previous badminton/flight/hotel queries) and synthesizes a complete plan without new web_search calls.

## What Does NOT Change

- `/api/travel` route — no changes
- `TravelResult`, `TravelResponse`, `TravelQuery` types — no changes
- All React components — no changes
- `detectMode()` — kept as fallback, still used if Supervisor fails
- `deeplinks.ts` — no changes
- All existing tests — must still pass

## Out of Scope

- Parallel fan-out (running multiple specialists simultaneously)
- Streaming from specialists individually
- Caching supervisor results
- User-facing model selector
