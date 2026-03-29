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
  const [selectedTournament, setSelectedTournament] = useState<TravelResult | null>(null);

  async function handleSearch(query: string, mode: AgentMode, bookingParams: BookingParams) {
    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedTournament(null);
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
}
