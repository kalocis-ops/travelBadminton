import { NextRequest, NextResponse } from "next/server";
import { runTravelAgent, detectMode, AgentMode } from "../agent";

// POST /api/travel
// Body: { message: string, history?: [...], mode?: AgentMode }
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

    // === OPCJA A: Zwykła odpowiedź (nie-streaming) ===
    const response = await runTravelAgent({ message, history, mode: resolvedMode });

    return NextResponse.json({
      text: response.text,
      mode: response.mode,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    console.error("[Travel Agent API Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// === OPCJA B: Streaming (odkomentuj i zamień POST powyżej) ===
//
// export async function POST(req: NextRequest) {
//   const { message, history = [], mode } = await req.json();
//   const resolvedMode = mode || detectMode(message);
//
//   const encoder = new TextEncoder();
//   const stream = new ReadableStream({
//     async start(controller) {
//       try {
//         await runTravelAgent(
//           { message, history, mode: resolvedMode },
//           (chunk) => controller.enqueue(encoder.encode(chunk))
//         );
//       } finally {
//         controller.close();
//       }
//     },
//   });
//
//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/plain; charset=utf-8",
//       "Transfer-Encoding": "chunked",
//     },
//   });
// }

// GET /api/travel — health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    agent: "Travel Agent",
    modes: ["auto", "flights", "hotels", "full-plan"],
    version: "1.0.0",
  });
}
