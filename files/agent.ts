import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type AgentMode = "flights" | "hotels" | "full-plan" | "auto";

export interface TravelQuery {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  mode?: AgentMode;
}

export interface TravelResponse {
  text: string;
  mode: AgentMode;
}

// System prompty dla każdego trybu
const SYSTEM_PROMPTS: Record<AgentMode, string> = {
  auto: `Jesteś inteligentnym asystentem podróży. Analizujesz zapytanie użytkownika i:
- Jeśli pyta tylko o loty → skupiasz się na lotach
- Jeśli pyta tylko o hotele → skupiasz się na hotelach  
- Jeśli pyta o całą podróż lub trip → tworzysz kompletny plan

Używasz web_search do znajdowania aktualnych cen i dostępności.
Odpowiadasz po polsku, z tabelami porównawczymi i konkretnymi rekomendacjami.
Zawsze podajesz ceny jako orientacyjne (~) i sugerujesz sprawdzenie aktualności.`,

  flights: `Jesteś ekspertem od wyszukiwania lotów.
Szukasz najlepszych połączeń lotniczych używając web_search.
Sprawdzasz: Google Flights, Skyscanner, Kayak i bezpośrednie linie lotnicze.
Zawsze pokazujesz minimum 3 opcje w tabeli porównawczej.
Podpowiadasz alternatywne daty jeśli mogą być tańsze.
Odpowiadasz po polsku z cenami w PLN.`,

  hotels: `Jesteś ekspertem od noclegów i zakwaterowania.
Szukasz hoteli, apartamentów i innych noclegów używając web_search.
Skupiasz się na lokalizacji (dzielnica, odległość od atrakcji) i stosunku ceny do jakości.
Zawsze opisujesz każdy hotel: dla kogo jest idealny, zalety, lokalizacja.
Odpowiadasz po polsku z cenami w PLN.`,

  "full-plan": `Jesteś kompleksowym travel planerem.
Tworzysz pełny plan podróży: loty + hotel + plan dnia + budżet + tips.
Używasz web_search do zbierania aktualnych informacji.
Plan jest szczegółowy, praktyczny i uwzględnia różne budżety.
Zawsze szacujesz całkowity koszt podróży.
Odpowiadasz po polsku.`,
};

export async function runTravelAgent(
  query: TravelQuery,
  onChunk?: (chunk: string) => void
): Promise<TravelResponse> {
  const mode = query.mode || "auto";
  const systemPrompt = SYSTEM_PROMPTS[mode];

  const messages: Anthropic.MessageParam[] = [
    ...(query.history || []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: query.message },
  ];

  let fullText = "";

  // Streaming z web_search tool
  const stream = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    tools: [
      {
        type: "web_search_20250305" as const,
        name: "web_search",
      },
    ],
    messages,
    stream: true,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      const chunk = event.delta.text;
      fullText += chunk;
      onChunk?.(chunk);
    }
  }

  return { text: fullText, mode };
}

// Pomocnicza funkcja do wykrywania trybu z treści wiadomości
export function detectMode(message: string): AgentMode {
  const lower = message.toLowerCase();

  const flightKeywords = ["lot", "bilet", "wylot", "przylot", "lotnisko", "linia lotnicza", "samolot"];
  const hotelKeywords = ["hotel", "nocleg", "zakwaterowanie", "apartament", "gdzie spać", "hostel"];
  const planKeywords = ["zaplanuj", "plan podróży", "trip", "wyjazd", "zorganizuj", "całą podróż"];

  const hasFlights = flightKeywords.some((k) => lower.includes(k));
  const hasHotels = hotelKeywords.some((k) => lower.includes(k));
  const hasPlan = planKeywords.some((k) => lower.includes(k));

  if (hasPlan || (hasFlights && hasHotels)) return "full-plan";
  if (hasFlights) return "flights";
  if (hasHotels) return "hotels";
  return "auto";
}
