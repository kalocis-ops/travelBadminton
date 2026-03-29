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
[{"name":"Nazwa turnieju","price":"cena biletów w PLN","details":"kraj, daty, kategoria BWF","bookingUrl":"https://bwfbadminton.com/...","venue":"Nazwa areny, Miasto"}]
-->`;

const BADMINTON_PROMPT = `Jesteś ekspertem od kalendarza turniejów BWF. Używasz web_search maksymalnie 2 razy.

Szukaj: site:bwfbadminton.com calendar lub "BWF World Tour" schedule.
Zwróć tabelę: Turniej | Kraj | Daty | Kategoria. Linkuj do bwfbadminton.com. Bądź zwięzły.
Kategorie BWF: Super 1000, Super 750, Super 500, Super 300, Grand Prix.
Odpowiadasz po polsku.
${RESULTS_JSON_INSTRUCTION}`;

export async function runBadmintonAgent(
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
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: BADMINTON_PROMPT,
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

  return { text: fullText, mode: "badminton" };
}
