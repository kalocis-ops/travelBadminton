import Anthropic from "@anthropic-ai/sdk";
import { TravelQuery, TravelResponse } from "../agent";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const RESULTS_JSON_INSTRUCTION = `
Na samym końcu odpowiedzi ZAWSZE dodaj blok JSON z maksymalnie 4 elementami planu:
<!-- RESULTS_JSON
[{"name":"Element planu","price":"szacowany koszt PLN","details":"szczegóły","bookingUrl":"https://link","venue":""}]
-->`;

const PLANNER_PROMPT = `Jesteś travel planerem. NIE używasz web_search — pracujesz na danych z rozmowy.

Tworzysz kompletny plan podróży na podstawie wcześniej znalezionych lotów, hoteli i turniejów.
Plan zawiera: dzień po dniu, szacowany budżet całkowity, tips praktyczne.
Jeśli brakuje danych — zaznaczasz co należy jeszcze zweryfikować.
Odpowiadasz po polsku. Budżet podajesz w PLN.
${RESULTS_JSON_INSTRUCTION}`;

export async function runPlannerAgent(
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

  // Planner deliberately has NO web_search tool
  const stream = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: PLANNER_PROMPT,
    messages,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onChunk?.(event.delta.text);
    }
  }

  return { text: fullText, mode: "full-plan" };
}
