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
  badmintonPeriod: string;
  badmintonRegion: string;
  badmintonCategory: string;
}

interface Props {
  onSearch: (query: string, mode: AgentMode, bookingParams: BookingParams) => void;
  loading: boolean;
}

const TABS: { key: AgentMode; label: string }[] = [
  { key: "badminton", label: "🏸 Badminton" },
  { key: "flights", label: "✈ Loty" },
  { key: "hotels", label: "🏨 Hotele" },
  { key: "full-plan", label: "🗺 Pełny plan" },
];

export default function SearchForm({ onSearch, loading }: Props) {
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
    if (state.mode === "badminton") {
      const cat = state.badmintonCategory !== "wszystkie" ? `, kategoria: ${state.badmintonCategory}` : "";
      return {
        query: `Turnieje badmintona BWF: okres ${state.badmintonPeriod || "najbliższe miesiące"}, region ${state.badmintonRegion || "cały świat"}${cat}`,
        bookingParams: {
          mode: "badminton" as const,
          badmintonPeriod: state.badmintonPeriod,
          badmintonRegion: state.badmintonRegion,
          badmintonCategory: state.badmintonCategory,
        },
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

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 6,
    display: "block",
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: "rgba(255, 255, 255, 0.82)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.6)",
      borderRadius: 20,
      boxShadow: "0 8px 40px rgba(0, 0, 0, 0.10), 0 1px 0 rgba(255,255,255,0.8) inset",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => set("mode", tab.key)}
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
          >
            {tab.label}
          </button>
        ))}
      </div>

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

        <button
          type="submit"
          disabled={loading}
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
        >
          {loading ? "Szukam..." : "Szukaj"}
        </button>
      </div>
    </form>
  );
}
