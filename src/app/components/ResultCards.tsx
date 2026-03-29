"use client";

import { TravelResult } from "../../agent";
import { BookingLink } from "../../deeplinks";

interface Props {
  results: TravelResult[];
  bookingLinks: BookingLink[];
  mode: "flights" | "hotels" | "full-plan" | "auto" | "badminton";
  onSelectTournament?: (result: TravelResult) => void;
}

export default function ResultCards({ results, bookingLinks, mode, onSelectTournament }: Props) {
  if (results.length === 0 && bookingLinks.length === 0) return null;

  return (
    <div style={{ marginTop: 32 }}>
      {results.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
            {mode === "hotels" ? "🏨 Znalezione noclegi" : mode === "badminton" ? "🏸 Turnieje BWF" : "✈ Znalezione loty"}
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
