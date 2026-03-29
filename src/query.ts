import * as fs from "fs";
import * as path from "path";
import { runTravelAgent, detectMode } from "./agent";

// Wczytaj .env przed pierwszym wywołaniem agenta
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const query = process.argv[2] || "";
const mode = detectMode(query);

runTravelAgent({ message: query, mode }, (chunk) => process.stdout.write(chunk))
  .then(() => console.log("\n"))
  .catch(console.error);
