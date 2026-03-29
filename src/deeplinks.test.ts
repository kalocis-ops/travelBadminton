import { describe, it, expect } from "vitest";
import { generateBookingLinks } from "./deeplinks";

describe("generateBookingLinks — flights", () => {
  it("returns 3 flight links with correct structure", () => {
    const links = generateBookingLinks({
      mode: "flights",
      from: "WAW",
      to: "DUB",
      date: "2026-04-03",
      passengers: 1,
    });
    expect(links).toHaveLength(3);
    expect(links[0]).toMatchObject({ name: expect.any(String), url: expect.any(String), icon: expect.any(String) });
  });

  it("Google Flights URL contains from, to and date", () => {
    const links = generateBookingLinks({ mode: "flights", from: "WAW", to: "DUB", date: "2026-04-03", passengers: 1 });
    const gf = links.find((l) => l.name === "Google Flights")!;
    expect(gf.url).toContain("WAW");
    expect(gf.url).toContain("DUB");
    expect(gf.url).toContain("2026-04-03");
  });

  it("Skyscanner URL uses lowercase IATA codes and YYMMDD date", () => {
    const links = generateBookingLinks({ mode: "flights", from: "WAW", to: "DUB", date: "2026-04-03", passengers: 1 });
    const sc = links.find((l) => l.name === "Skyscanner")!;
    expect(sc.url).toContain("waw");
    expect(sc.url).toContain("dub");
    expect(sc.url).toContain("260403");
  });
});

describe("generateBookingLinks — hotels", () => {
  it("returns 3 hotel links", () => {
    const links = generateBookingLinks({
      mode: "hotels",
      city: "Dublin",
      date: "2026-04-03",
      dateTo: "2026-04-10",
      passengers: 2,
    });
    expect(links).toHaveLength(3);
  });

  it("Booking.com URL contains city and dates", () => {
    const links = generateBookingLinks({ mode: "hotels", city: "Dublin", date: "2026-04-03", dateTo: "2026-04-10", passengers: 1 });
    const bk = links.find((l) => l.name === "Booking.com")!;
    expect(bk.url).toContain("Dublin");
    expect(bk.url).toContain("2026-04-03");
    expect(bk.url).toContain("2026-04-10");
  });
});

describe("generateBookingLinks — badminton", () => {
  it("returns 2 badminton links", () => {
    const links = generateBookingLinks({
      mode: "badminton",
      badmintonRegion: "Europa",
      badmintonPeriod: "2026",
    });
    expect(links).toHaveLength(2);
  });

  it("BWF link contains bwfbadminton.com", () => {
    const links = generateBookingLinks({ mode: "badminton", badmintonRegion: "Azja", badmintonPeriod: "2026" });
    const bwf = links.find((l) => l.name === "BWF Calendar")!;
    expect(bwf.url).toContain("bwfbadminton.com");
  });
});
