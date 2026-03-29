"use client";

import { useState, useRef, useEffect } from "react";
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

const CITIES = [
  "Warszawa", "Kraków", "Gdańsk", "Wrocław", "Poznań", "Katowice", "Łódź", "Szczecin", "Lublin", "Rzeszów",
  "Londyn", "Paryż", "Amsterdam", "Barcelona", "Rzym", "Berlin", "Wiedeń", "Praga", "Budapeszt", "Madryt",
  "Dubaj", "Bangkok", "Kuala Lumpur", "Singapur", "Tokio", "Seul", "Jakarta", "Mumbaj", "Guangzhou",
  "Nowy Jork", "Los Angeles", "Toronto",
];

const REGIONS = [
  "Europa", "Azja", "Azja Wschodnia", "Azja Południowo-Wschodnia", "Indie", "Cały świat",
  "Ameryka", "Oceania", "Afryka", "Bliski Wschód",
];

const MONTHS = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

function Autocomplete({
  value, onChange, suggestions, placeholder, required, inputStyle,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  inputStyle: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value.length === 0
    ? suggestions.slice(0, 8)
    : suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHovered(-1); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        style={inputStyle}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          zIndex: 200,
          overflow: "hidden",
        }}>
          {filtered.map((s, i) => (
            <div
              key={s}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(-1)}
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setOpen(false); }}
              style={{
                padding: "10px 14px",
                fontSize: 14,
                cursor: "pointer",
                background: hovered === i ? "rgba(0,113,227,0.06)" : "transparent",
                color: "var(--text)",
                letterSpacing: "-0.01em",
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DateInput({ value, onChange, required, inputStyle }: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputStyle: React.CSSProperties;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ ...inputStyle, paddingRight: 36, cursor: "pointer" }}
        onClick={() => {
          try { inputRef.current?.showPicker(); } catch { /* fallback — browser opened natively */ }
        }}
      />
      <span
        onClick={() => {
          try { inputRef.current?.showPicker(); } catch { /* */ }
          inputRef.current?.focus();
        }}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 15,
          cursor: "pointer",
          pointerEvents: "none",
          opacity: 0.45,
        }}
      >
        📅
      </span>
    </div>
  );
}

function MonthPicker({ value, onChange, inputStyle }: {
  value: string;
  onChange: (v: string) => void;
  inputStyle: React.CSSProperties;
}) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  const [month, setMonth] = useState("");
  const [year, setYear] = useState(String(currentYear));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync from external value
    if (!value) { setMonth(""); return; }
    const parts = value.split(" ");
    if (parts.length === 2) { setMonth(parts[0]); setYear(parts[1]); }
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(m: string) {
    setMonth(m);
    onChange(`${m} ${year}`);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            readOnly
            value={month}
            onClick={() => setOpen((o) => !o)}
            placeholder="Miesiąc"
            style={{ ...inputStyle, cursor: "pointer", paddingRight: 28 }}
          />
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4, fontSize: 11, pointerEvents: "none" }}>▼</span>
        </div>
        <select
          value={year}
          onChange={(e) => { setYear(e.target.value); if (month) onChange(`${month} ${e.target.value}`); }}
          style={{ ...inputStyle, width: 90, cursor: "pointer" }}
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          zIndex: 200,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          padding: 8,
          gap: 4,
        }}>
          {MONTHS.map((m) => (
            <div
              key={m}
              onMouseDown={(e) => { e.preventDefault(); select(m); }}
              style={{
                padding: "8px 4px",
                textAlign: "center",
                cursor: "pointer",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: month === m ? 600 : 400,
                background: month === m ? "rgba(0,113,227,0.1)" : "transparent",
                color: month === m ? "var(--accent)" : "var(--text)",
              }}
            >
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
    boxSizing: "border-box",
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
      overflow: "visible",
    }}>
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
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
              <Autocomplete value={state.from} onChange={(v) => set("from", v)} suggestions={CITIES} placeholder="np. Warszawa" required inputStyle={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Dokąd</label>
              <Autocomplete value={state.to} onChange={(v) => set("to", v)} suggestions={CITIES} placeholder="np. Dublin" required inputStyle={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data wylotu</label>
              <DateInput value={state.date} onChange={(v) => set("date", v)} required inputStyle={inputStyle} />
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
              <Autocomplete value={state.city} onChange={(v) => set("city", v)} suggestions={CITIES} placeholder="np. Dublin" required inputStyle={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Przyjazd</label>
              <DateInput value={state.date} onChange={(v) => set("date", v)} required inputStyle={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Wyjazd</label>
              <DateInput value={state.dateTo} onChange={(v) => set("dateTo", v)} required inputStyle={inputStyle} />
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
              <Autocomplete value={state.from} onChange={(v) => set("from", v)} suggestions={CITIES} placeholder="np. Warszawa" required inputStyle={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Dokąd</label>
              <Autocomplete value={state.to} onChange={(v) => set("to", v)} suggestions={CITIES} placeholder="np. Dublin" required inputStyle={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Wylot</label>
              <DateInput value={state.date} onChange={(v) => set("date", v)} required inputStyle={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Powrót</label>
              <DateInput value={state.dateTo} onChange={(v) => set("dateTo", v)} inputStyle={inputStyle} />
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
              <MonthPicker value={state.badmintonPeriod} onChange={(v) => set("badmintonPeriod", v)} inputStyle={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Region</label>
              <Autocomplete value={state.badmintonRegion} onChange={(v) => set("badmintonRegion", v)} suggestions={REGIONS} placeholder="np. Europa, Azja" inputStyle={inputStyle} />
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
