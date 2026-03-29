import Anthropic from "@anthropic-ai/sdk";
import { AgentMode } from "../agent";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export interface SupervisorResult {
  mode: AgentMode;
  params: {
    from?: string;
    to?: string;
    date?: string;
    dateTo?: string;
    city?: string;
    badmintonRegion?: string;
    badmintonPeriod?: string;
    badmintonCategory?: string;
  };
  reasoning: string;
}

const SUPERVISOR_PROMPT = `Jesteś routerem zapytań dla agenta podróży. Analizujesz zapytanie i zwracasz JSON.

Dostępne tryby:
- "flights" — użytkownik pyta tylko o loty
- "hotels" — użytkownik pyta tylko o hotele/noclegi
- "badminton" — użytkownik pyta o turnieje BWF/badmintona
- "full-plan" — użytkownik chce pełny plan podróży (loty + hotel + itinerary)
- "auto" — nie można określić trybu

Zwróć TYLKO JSON, bez żadnego dodatkowego tekstu:
{
  "mode": "<tryb>",
  "params": {
    "from": "<miasto wylotu lub null>",
    "to": "<miasto docelowe lub null>",
    "date": "<data w formacie YYYY-MM-DD lub null>",
    "dateTo": "<data powrotu YYYY-MM-DD lub null>",
    "city": "<miasto dla hotelu lub null>",
    "badmintonRegion": "<region turniejów lub null>",
    "badmintonPeriod": "<okres np. 'maj 2026' lub null>",
    "badmintonCategory": "<kategoria BWF lub null>"
  },
  "reasoning": "<jedno zdanie dlaczego ten tryb>"
}

Pomijaj pola null — nie wstawiaj ich do JSON.`;

export function parseSupervisorResponse(raw: string): SupervisorResult {
  try {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || raw.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : raw;
    const parsed = JSON.parse(jsonStr.trim());
    return {
      mode: parsed.mode || "auto",
      params: parsed.params || {},
      reasoning: parsed.reasoning || "",
    };
  } catch {
    return { mode: "auto", params: {}, reasoning: "parse error" };
  }
}

export async function runSupervisor(message: string): Promise<SupervisorResult> {
  try {
    const response = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SUPERVISOR_PROMPT,
      messages: [{ role: "user", content: message }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    return parseSupervisorResponse(raw);
  } catch {
    return { mode: "auto", params: {}, reasoning: "supervisor error" };
  }
}
