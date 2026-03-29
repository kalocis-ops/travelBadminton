import { NextRequest, NextResponse } from "next/server";
import { runTravelAgent, detectMode, AgentMode, TravelResult } from "../../../agent";

function parseResultsJson(text: string): TravelResult[] {
  const match = text.match(/<!--\s*RESULTS_JSON\s*([\s\S]*?)\s*-->/);
  if (!match) return [];
  try {
    return JSON.parse(match[1].trim()) as TravelResult[];
  } catch {
    return [];
  }
}

function stripResultsJson(text: string): string {
  return text.replace(/<!--\s*RESULTS_JSON[\s\S]*?-->/g, "").trim();
}

// POST /api/travel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], mode } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Pole 'message' jest wymagane" },
        { status: 400 }
      );
    }

    const resolvedMode: AgentMode = mode || detectMode(message);
    const response = await runTravelAgent({ message, history, mode: resolvedMode });

    const results = parseResultsJson(response.text);
    const text = stripResultsJson(response.text);

    return NextResponse.json({ text, mode: response.mode, results });
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : String(err);
    console.error("[Travel Agent API Error]", raw);

    // Rate limit
    if (raw.includes("rate_limit") || raw.includes("429")) {
      return NextResponse.json(
        { error: "Przekroczono limit zapytań API. Poczekaj chwilę i spróbuj ponownie." },
        { status: 429 }
      );
    }

    // Auth error
    if (raw.includes("401") || raw.includes("authentication")) {
      return NextResponse.json(
        { error: "Błąd autoryzacji API. Sprawdź klucz ANTHROPIC_API_KEY w pliku .env." },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: "Błąd agenta. Spróbuj ponownie." }, { status: 500 });
  }
}

// GET /api/travel — health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    agent: "Travel Agent",
    modes: ["auto", "flights", "hotels", "full-plan"],
    version: "1.0.0",
  });
}
