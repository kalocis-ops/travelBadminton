#!/usr/bin/env npx tsx
import * as fs from "fs";
import * as path from "path";

// Ładuj .env ręcznie (bez potrzeby instalowania dotenv)
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

import * as readline from "readline";
import { runTravelAgent, detectMode, AgentMode } from "./agent";

// Kolory terminalowe
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const history: Array<{ role: "user" | "assistant"; content: string }> = [];
let currentMode: AgentMode = "auto";

function printBanner() {
  console.clear();
  console.log(`
${c.cyan}${c.bold}╔══════════════════════════════════════════════════════╗
║          🌍  TRAVEL AGENT  —  Asystent Podróży       ║
╚══════════════════════════════════════════════════════╝${c.reset}

${c.dim}Komendy:${c.reset}
  ${c.yellow}/loty${c.reset}    — tryb wyszukiwania lotów
  ${c.yellow}/hotele${c.reset}  — tryb wyszukiwania hoteli
  ${c.yellow}/plan${c.reset}    — tryb pełnego planu podróży
  ${c.yellow}/auto${c.reset}    — tryb automatyczny (domyślny)
  ${c.yellow}/clear${c.reset}   — wyczyść historię rozmowy
  ${c.yellow}/exit${c.reset}    — wyjście

${c.dim}Przykłady zapytań:${c.reset}
  "Znajdź loty z Warszawy do Barcelony w lipcu"
  "Hotele w centrum Paryża, budżet 300 PLN/noc"
  "Zaplanuj mi tydzień na Majorce dla 2 osób"
`);
}

function printMode() {
  const modeLabels: Record<AgentMode, string> = {
    auto: "🤖 Auto",
    flights: "✈️  Loty",
    hotels: "🏨 Hotele",
    "full-plan": "🗺️  Pełny plan",
    badminton: "🏸 Badminton",
  };
  console.log(`${c.dim}Tryb: ${c.yellow}${modeLabels[currentMode]}${c.reset}\n`);
}

async function ask(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(`${c.red}❌ Brak ANTHROPIC_API_KEY w zmiennych środowiskowych!${c.reset}`);
    console.log(`Utwórz plik .env z: ANTHROPIC_API_KEY=sk-ant-...`);
    process.exit(1);
  }

  printBanner();

  while (true) {
    printMode();
    const input = await ask(`${c.green}${c.bold}Ty: ${c.reset}`);
    const trimmed = input.trim();

    if (!trimmed) continue;

    // Komendy
    if (trimmed === "/exit" || trimmed === "/quit") {
      console.log(`\n${c.cyan}Do zobaczenia! ✈️${c.reset}\n`);
      rl.close();
      break;
    }
    if (trimmed === "/clear") {
      history.length = 0;
      printBanner();
      console.log(`${c.green}✓ Historia wyczyszczona${c.reset}\n`);
      continue;
    }
    if (trimmed === "/loty") { currentMode = "flights"; continue; }
    if (trimmed === "/hotele") { currentMode = "hotels"; continue; }
    if (trimmed === "/plan") { currentMode = "full-plan"; continue; }
    if (trimmed === "/auto") { currentMode = "auto"; continue; }

    // Wykryj tryb automatycznie jeśli auto
    const mode = currentMode === "auto" ? detectMode(trimmed) : currentMode;

    console.log(`\n${c.blue}${c.bold}Agent: ${c.reset}`);

    try {
      const response = await runTravelAgent(
        { message: trimmed, history, mode },
        (chunk) => process.stdout.write(chunk)
      );

      // Dodaj do historii
      history.push({ role: "user", content: trimmed });
      history.push({ role: "assistant", content: response.text });

      // Ogranicz historię do ostatnich 10 wiadomości
      if (history.length > 20) history.splice(0, 2);

      console.log(`\n\n${c.dim}─────────────────────────────────────────${c.reset}\n`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\n${c.red}❌ Błąd: ${message}${c.reset}\n`);
    }
  }
}

main();
