import Anthropic from "@anthropic-ai/sdk";
import { runSupervisor } from "./agents/supervisor";
import { runFlightsAgent } from "./agents/flights";
import { runHotelsAgent } from "./agents/hotels";
import { runBadmintonAgent } from "./agents/badminton";
import { runPlannerAgent } from "./agents/planner";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type AgentMode = "flights" | "hotels" | "full-plan" | "auto" | "badminton";

export interface TravelQuery {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  mode?: AgentMode;
}

export interface TravelResult {
  name: string;
  price: string;
  details: string;
  bookingUrl: string;
  venue?: string;
}

export interface TravelResponse {
  text: string;
  mode: AgentMode;
  results?: TravelResult[];
}

// Fallback: used when supervisor is bypassed or mode is "auto"
const FALLBACK_PROMPT = `Jesteś inteligentnym asystentem podróży. Analizujesz zapytanie i:
- Jeśli pyta o loty → skupiasz się na lotach
- Jeśli pyta o hotele → skupiasz się na hotelach
- Jeśli pyta o turnieje badmintona → szukasz turniejów BWF
- Jeśli pyta o całą podróż → tworzysz kompletny plan

Używasz web_search. Odpowiadasz po polsku z cenami w PLN.`;

export async function runTravelAgent(
  query: TravelQuery,
  onChunk?: (chunk: string) => void
): Promise<TravelResponse> {
  // If mode explicitly provided by UI (not "auto"), skip supervisor
  const explicitMode = query.mode && query.mode !== "auto" ? query.mode : null;

  let mode: AgentMode;

  if (explicitMode) {
    mode = explicitMode;
  } else {
    // Use supervisor to classify
    const supervised = await runSupervisor(query.message);
    mode = supervised.mode;
  }

  // Route to specialist
  switch (mode) {
    case "flights":
      return runFlightsAgent(query, onChunk);
    case "hotels":
      return runHotelsAgent(query, onChunk);
    case "badminton":
      return runBadmintonAgent(query, onChunk);
    case "full-plan":
      return runPlannerAgent(query, onChunk);
    default:
      return runFallback(query, onChunk);
  }
}

async function runFallback(
  query: TravelQuery,
  onChunk?: (chunk: string) => void
): Promise<TravelResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...(query.history || []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: query.message },
  ];

  let fullText = "";

  const stream = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: FALLBACK_PROMPT,
    tools: [{ type: "web_search_20250305" as const, name: "web_search" }] as unknown as Anthropic.Tool[],
    messages,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onChunk?.(event.delta.text);
    }
  }

  return { text: fullText, mode: "auto" };
}

// Kept for backward compatibility — still used as fallback by API route
export function detectMode(message: string): AgentMode {
  const lower = message.toLowerCase();

  const badmintonKeywords = ["badminton", "bwf", "turniej", "thomas cup", "uber cup", "sudirman", "world tour", "super series"];
  const flightKeywords = ["lot", "bilet", "wylot", "przylot", "lotnisko", "linia lotnicza", "samolot"];
  const hotelKeywords = ["hotel", "nocleg", "zakwaterowanie", "apartament", "gdzie spać", "hostel"];
  const planKeywords = ["zaplanuj", "plan podróży", "trip", "wyjazd", "zorganizuj", "całą podróż"];

  const hasBadminton = badmintonKeywords.some((k) => lower.includes(k));
  const hasFlights = flightKeywords.some((k) => lower.includes(k));
  const hasHotels = hotelKeywords.some((k) => lower.includes(k));
  const hasPlan = planKeywords.some((k) => lower.includes(k));

  if (hasBadminton) return "badminton";
  if (hasPlan || (hasFlights && hasHotels)) return "full-plan";
  if (hasFlights) return "flights";
  if (hasHotels) return "hotels";
  return "auto";
}
