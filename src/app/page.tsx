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
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
          ✈ Travel Agent
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16 }}>
          Znajdź loty i hotele z pomocą AI
        </p>
      </div>

      <SearchForm onSearch={handleSearch} loading={loading} />

      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15 }}>Agent szuka najlepszych opcji...</div>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 24,
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 8,
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
