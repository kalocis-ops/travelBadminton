# Apple-Style Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Polish Badminton Travel Agency app with an Apple.com-inspired look: Inter font, dark text on white, glassmorphism search form, pill buttons, soft-shadow cards, and a full-screen hero section.

**Architecture:** All visual changes are isolated to CSS variables (`globals.css`), layout (`layout.tsx`), page hero (`page.tsx`), and component styles (`SearchForm.tsx`, `ResultCards.tsx`). No logic changes. No new dependencies beyond the Inter font loaded via Google Fonts `<link>` tag.

**Tech Stack:** Next.js 15, TypeScript, plain CSS (CSS variables), Google Fonts (Inter)

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/app/layout.tsx` | Modify | Add Inter font via `<link>`, update metadata title/description |
| `src/app/globals.css` | Modify | New Apple-style CSS variables, body font, hero CSS |
| `src/app/page.tsx` | Modify | Add full-screen hero section above SearchForm |
| `src/app/components/SearchForm.tsx` | Modify | Glassmorphism style on form container, pill submit button |
| `src/app/components/ResultCards.tsx` | Modify | Apple-style cards (soft shadow, no border), section headings |

---

## Task 1: Font + metadata

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

Replace the entire file with:

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polish Badminton Travel Agency",
  description: "Znajdź turnieje BWF i zaplanuj podróż z AI — loty, hotele, pełny plan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/app/layout.tsx
git commit -m "feat: add Inter font and rename to Polish Badminton Travel Agency"
```

---

## Task 2: CSS variables — Apple palette

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css entirely**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --accent: #0071e3;
  --accent-hover: #0077ed;
  --text: #1d1d1f;
  --text-muted: #6e6e73;
  --text-light: #86868b;
  --border: rgba(0, 0, 0, 0.08);
  --bg: #f5f5f7;
  --white: #ffffff;
  --shadow: 0 2px 20px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 8px 40px rgba(0, 0, 0, 0.10);
  --radius: 18px;

  /* Hero */
  --hero-bg: #000000;
  --hero-text: #f5f5f7;
}

body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 2: TypeScript check + build**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/app/globals.css
git commit -m "feat: Apple-style CSS variables and Inter font"
```

---

## Task 3: Hero section in page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the header div and add hero**

In `src/app/page.tsx`, replace the entire `<main>` return block with:

```typescript
  return (
    <>
      {/* Hero */}
      <div style={{
        background: "var(--hero-bg)",
        color: "var(--hero-text)",
        textAlign: "center",
        padding: "120px 20px 80px",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 980,
            padding: "6px 16px",
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            marginBottom: 32,
            letterSpacing: "0.01em",
          }}>
            🏸 BWF World Tour · Turnieje · Podróże
          </div>

          <h1 style={{
            fontSize: "clamp(48px, 8vw, 88px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 20,
            background: "linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Polish Badminton<br />Travel Agency
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2vw, 21px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.6,
            maxWidth: 560,
            margin: "0 auto",
            letterSpacing: "0.01em",
          }}>
            Znajdź turnieje BWF i zaplanuj podróż z pomocą AI.<br />
            Loty, hotele i pełny plan w kilka sekund.
          </p>
        </div>
      </div>

      {/* Main content */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 80px" }}>
        <SearchForm onSearch={handleSearch} loading={loading} />

        {loading && (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Agent szuka najlepszych opcji...</div>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 24,
            background: "#fff2f2",
            border: "1px solid rgba(220,38,38,0.15)",
            borderRadius: 14,
            padding: "16px 20px",
            color: "#dc2626",
            fontSize: 14,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Coś poszło nie tak</div>
              <div style={{ color: "#b91c1c" }}>{error}</div>
            </div>
          </div>
        )}

        {!loading && (results.length > 0 || bookingLinks.length > 0) && (
          <ResultCards
            results={results}
            bookingLinks={bookingLinks}
            mode={currentMode}
            onSelectTournament={currentMode === "badminton" ? setSelectedTournament : undefined}
          />
        )}

        {selectedTournament && (
          <div style={{
            marginTop: 24,
            background: "var(--white)",
            border: "2px solid var(--accent)",
            borderRadius: "var(--radius)",
            padding: "20px 24px",
            boxShadow: "var(--shadow-lg)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Wybrany turniej
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 4, letterSpacing: "-0.01em" }}>
              {selectedTournament.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
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
                  background: "var(--text)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 980,
                  padding: "12px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "-0.01em",
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
                  color: "var(--text)",
                  border: "1.5px solid rgba(0,0,0,0.2)",
                  borderRadius: 980,
                  padding: "12px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                🏨 Hotele w pobliżu
              </button>
            </div>
          </div>
        )}

        {!loading && agentText && (
          <div style={{
            marginTop: 32,
            background: "var(--white)",
            borderRadius: "var(--radius)",
            padding: "28px 32px",
            boxShadow: "var(--shadow)",
            fontSize: 15,
            lineHeight: 1.75,
            color: "var(--text)",
            whiteSpace: "pre-wrap",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Analiza agenta
            </div>
            {agentText}
          </div>
        )}
      </main>
    </>
  );
```

- [ ] **Step 2: TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/app/page.tsx
git commit -m "feat: add hero section with Apple-style design"
```

---

## Task 4: Glassmorphism SearchForm

**Files:**
- Modify: `src/app/components/SearchForm.tsx`

- [ ] **Step 1: Update form container style**

In `src/app/components/SearchForm.tsx`, replace the `<form>` opening tag styles:

```typescript
    <form onSubmit={handleSubmit} style={{
      background: "rgba(255, 255, 255, 0.82)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.6)",
      borderRadius: 20,
      boxShadow: "0 8px 40px rgba(0, 0, 0, 0.10), 0 1px 0 rgba(255,255,255,0.8) inset",
      overflow: "hidden",
    }}>
```

- [ ] **Step 2: Update tab styles**

Replace the tab `<button>` style block (the one inside `.map(tab =>`):

```typescript
            style={{
              padding: "14px 22px",
              fontSize: 13,
              fontWeight: state.mode === tab.key ? 600 : 400,
              color: state.mode === tab.key ? "var(--text)" : "var(--text-muted)",
              background: "none",
              border: "none",
              borderBottom: state.mode === tab.key ? "2px solid var(--text)" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
              letterSpacing: "-0.01em",
            }}
```

- [ ] **Step 3: Update inputStyle**

Replace the `inputStyle` constant:

```typescript
  const inputStyle: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 15,
    color: "var(--text)",
    background: "rgba(255,255,255,0.7)",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
    letterSpacing: "-0.01em",
  };
```

- [ ] **Step 4: Update labelStyle**

Replace the `labelStyle` constant:

```typescript
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 6,
    display: "block",
  };
```

- [ ] **Step 5: Update submit button style**

Replace the submit `<button>` style:

```typescript
          style={{
            marginTop: 16,
            background: loading ? "rgba(0,0,0,0.3)" : "var(--text)",
            color: "#fff",
            border: "none",
            borderRadius: 980,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%",
            letterSpacing: "-0.01em",
            fontFamily: "inherit",
          }}
```

- [ ] **Step 6: TypeScript check**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/app/components/SearchForm.tsx
git commit -m "feat: glassmorphism search form with Apple-style inputs"
```

---

## Task 5: Apple-style ResultCards

**Files:**
- Modify: `src/app/components/ResultCards.tsx`

- [ ] **Step 1: Update card container style**

In `src/app/components/ResultCards.tsx`, replace the card `<div>` style (the one with `flexDirection: "column"`):

```typescript
              <div key={i} style={{
                background: "var(--white)",
                border: "none",
                borderRadius: 20,
                padding: "24px",
                boxShadow: "var(--shadow-lg)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}>
```

- [ ] **Step 2: Update card name style**

Replace `<div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>`:

```typescript
                <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
```

- [ ] **Step 3: Update price style**

Replace `<div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>`:

```typescript
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
```

- [ ] **Step 4: Update "Rezerwuj" button style**

Replace the `<a>` booking link style block:

```typescript
                  style={{
                    marginTop: "auto",
                    background: "var(--text)",
                    color: "#fff",
                    borderRadius: 980,
                    padding: "11px 0",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    display: "block",
                    cursor: "pointer",
                    letterSpacing: "-0.01em",
                  }}
```

Also replace the `onMouseOver`/`onMouseOut` handlers on that `<a>`:

```typescript
                  onMouseOver={(e) => (e.currentTarget.style.background = "#3a3a3c")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "var(--text)")}
```

- [ ] **Step 5: Update heading style**

Replace the `<h2>` style:

```typescript
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 20, letterSpacing: "-0.02em" }}>
```

- [ ] **Step 6: Update booking links section**

Replace the `<h3>` style:

```typescript
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, letterSpacing: "0.02em", textTransform: "uppercase" }}>
```

Replace booking link `<a>` style:

```typescript
                style={{
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 980,
                  padding: "8px 18px",
                  background: "var(--white)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text)",
                  boxShadow: "var(--shadow)",
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}
```

- [ ] **Step 7: TypeScript check + tests**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npx tsc --noEmit 2>&1 && npm test 2>&1
```

Expected: no TypeScript errors, 7 tests passing.

- [ ] **Step 8: Commit**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel"
git add src/app/components/ResultCards.tsx
git commit -m "feat: Apple-style result cards"
```

---

## Task 6: Build + push

- [ ] **Step 1: Production build**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`.

- [ ] **Step 2: Push**

```bash
cd "/Users/klaudiarogalska/Desktop/agent travel" && git push
```

Expected: pushed to `origin/main`.
