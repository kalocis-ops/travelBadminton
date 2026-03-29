import Anthropic from "@anthropic-ai/sdk";
import { TravelQuery, TravelResponse } from "../agent";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const RESULTS_JSON_INSTRUCTION = `
Na samym końcu odpowiedzi ZAWSZE dodaj blok JSON z maksymalnie 4 najlepszymi wynikami:
<!-- RESULTS_JSON
[{"name":"Nazwa hotelu","price":"cena za noc w PLN","details":"lokalizacja i ocena","bookingUrl":"https://link-do-rezerwacji","venue":""}]
-->`;

const HOTELS_PROMPT = `Jesteś ekspertem od noclegów. Używasz web_search.

Szukasz hoteli, apartamentów i hosteli na Booking.com, Hotels.com, Airbnb.
Dla każdego opisujesz: lokalizacja (dzielnica, odległość od centrum/areny), ocena, cena/noc.
Sortujesz od najlepszego stosunku ceny do jakości.
Odpowiadasz po polsku z cenami w PLN.
${RESULTS_JSON_INSTRUCTION}`;

export async function runHotelsAgent(
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
    max_tokens: 4096,
    system: HOTELS_PROMPT,
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

  return { text: fullText, mode: "hotels" };
}
