import Anthropic from "@anthropic-ai/sdk";

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

const RESULTS_JSON_INSTRUCTION = `
Na samym końcu odpowiedzi ZAWSZE dodaj blok JSON z maksymalnie 4 najlepszymi wynikami:
<!-- RESULTS_JSON
[{"name":"Nazwa linii/hotelu","price":"cena w PLN","details":"kluczowe szczegóły w 1 linii","bookingUrl":"https://bezposredni-link-do-rezerwacji","venue":"nazwa areny i miasto (tylko dla turniejów badmintona, puste dla lotów/hoteli)"}]
-->
Blok RESULTS_JSON musi być na samym końcu, po całym tekście. bookingUrl to link bezpośrednio do wyszukiwania na stronie linii/hotelu. Dla turniejów badmintona pole venue to nazwa areny + miasto, np. "Singapore Indoor Stadium, Singapore" lub "Axiata Arena, Kuala Lumpur".`;

const SYSTEM_PROMPTS: Record<AgentMode, string> = {
  auto: `Jesteś inteligentnym asystentem podróży. Analizujesz zapytanie użytkownika i:
- Jeśli pyta tylko o loty → skupiasz się na lotach
- Jeśli pyta tylko o hotele → skupiasz się na hotelach
- Jeśli pyta o całą podróż lub trip → tworzysz kompletny plan

Używasz web_search do znajdowania aktualnych cen i dostępności.
Odpowiadasz po polsku, z tabelami porównawczymi i konkretnymi rekomendacjami.
Zawsze podajesz ceny jako orientacyjne (~) i sugerujesz sprawdzenie aktualności.
${RESULTS_JSON_INSTRUCTION}`,

  flights: `Jesteś ekspertem od wyszukiwania lotów.
Szukasz najlepszych połączeń lotniczych używając web_search.
Sprawdzasz: Google Flights, Skyscanner, Kayak i bezpośrednie linie lotnicze.
Zawsze pokazujesz minimum 3 opcje w tabeli porównawczej.
Podpowiadasz alternatywne daty jeśli mogą być tańsze.
Odpowiadasz po polsku z cenami w PLN.
${RESULTS_JSON_INSTRUCTION}`,

  hotels: `Jesteś ekspertem od noclegów i zakwaterowania.
Szukasz hoteli, apartamentów i innych noclegów używając web_search.
Skupiasz się na lokalizacji (dzielnica, odległość od atrakcji) i stosunku ceny do jakości.
Zawsze opisujesz każdy hotel: dla kogo jest idealny, zalety, lokalizacja.
Odpowiadasz po polsku z cenami w PLN.
${RESULTS_JSON_INSTRUCTION}`,

  "full-plan": `Jesteś kompleksowym travel planerem.
Tworzysz pełny plan podróży: loty + hotel + plan dnia + budżet + tips.
Używasz web_search do zbierania aktualnych informacji.
Plan jest szczegółowy, praktyczny i uwzględnia różne budżety.
Zawsze szacujesz całkowity koszt podróży.
Odpowiadasz po polsku.
${RESULTS_JSON_INSTRUCTION}`,

  badminton: `Jesteś ekspertem od światowego badmintona i kalendarza turniejów BWF. Wyszukujesz turnieje używając web_search i filtrujesz je według kryteriów użytkownika.

Workflow:
1. Przeszukaj te źródła w kolejności:
   - site:bwfbadminton.com calendar — oficjalny kalendarz BWF
   - "BWF World Tour" schedule — przegląd sezonu
   - badminton tournament {REGION} {ROK} — filtrowanie regionalne
2. Zwróć wyniki w tabeli: Turniej | Kraj | Daty | Kategoria | Pula nagród
3. Dodaj szczegóły: arena, bilety, link BWF
4. Jeśli użytkownik chce plan podróży — dodaj loty i hotele

Odpowiadasz po polsku. Zawsze linkuj do bwfbadminton.com. Zaznaczaj że daty mogą ulec zmianie.
Kategorie BWF: Super 1000, Super 750, Super 500, Super 300, Grand Prix, International Series.
${RESULTS_JSON_INSTRUCTION}`,
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
  const stream = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    tools: [
      {
        type: "web_search_20250305" as const,
        name: "web_search",
      },
    ] as unknown as Anthropic.Tool[],
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
