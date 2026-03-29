import { describe, it, expect } from "vitest";
import { parseSupervisorResponse } from "./supervisor";

describe("parseSupervisorResponse", () => {
  it("parses valid JSON response", () => {
    const raw = '{"mode":"flights","params":{"from":"Warszawa","to":"Dublin"},"reasoning":"user asked about flights"}';
    const result = parseSupervisorResponse(raw);
    expect(result.mode).toBe("flights");
    expect(result.params.from).toBe("Warszawa");
  });

  it("falls back to auto on invalid JSON", () => {
    const result = parseSupervisorResponse("invalid json");
    expect(result.mode).toBe("auto");
    expect(result.params).toEqual({});
  });

  it("detects badminton mode", () => {
    const raw = '{"mode":"badminton","params":{"badmintonRegion":"Azja","badmintonPeriod":"maj 2026"},"reasoning":"BWF tournament query"}';
    const result = parseSupervisorResponse(raw);
    expect(result.mode).toBe("badminton");
    expect(result.params.badmintonRegion).toBe("Azja");
  });

  it("detects full-plan mode", () => {
    const raw = '{"mode":"full-plan","params":{"from":"Warszawa","to":"Singapur","date":"2026-05-26"},"reasoning":"full trip requested"}';
    const result = parseSupervisorResponse(raw);
    expect(result.mode).toBe("full-plan");
  });
});
