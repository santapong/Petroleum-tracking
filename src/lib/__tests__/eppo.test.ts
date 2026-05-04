import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapFuelLabel,
  fetchEppoCurrentPrices,
  fetchEppoCkanRetailPrices,
} from "../eppo";

describe("mapFuelLabel", () => {
  it("maps English labels to enum values", () => {
    expect(mapFuelLabel("Diesel")).toBe("DIESEL");
    expect(mapFuelLabel("DIESEL B7")).toBe("DIESEL_B7");
    expect(mapFuelLabel("Gasohol 91")).toBe("GASOHOL_91");
    expect(mapFuelLabel("Gasohol 95")).toBe("GASOHOL_95");
    expect(mapFuelLabel("E20")).toBe("GASOHOL_E20");
    expect(mapFuelLabel("E85")).toBe("GASOHOL_E85");
    expect(mapFuelLabel("LPG")).toBe("LPG");
    expect(mapFuelLabel("NGV")).toBe("NGV");
  });

  it("maps Thai labels to enum values", () => {
    expect(mapFuelLabel("ดีเซล")).toBe("DIESEL");
    expect(mapFuelLabel("ดีเซล B7")).toBe("DIESEL_B7");
    expect(mapFuelLabel("แก๊สโซฮอล์ 91")).toBe("GASOHOL_91");
    expect(mapFuelLabel("แก๊สโซฮอล์ 95")).toBe("GASOHOL_95");
    expect(mapFuelLabel("เอ็นจีวี")).toBe("NGV");
  });

  it("normalizes whitespace and case", () => {
    expect(mapFuelLabel("  diesel  ")).toBe("DIESEL");
    expect(mapFuelLabel("Gasohol  91")).toBe("GASOHOL_91");
  });

  it("returns null for unknown labels", () => {
    expect(mapFuelLabel("")).toBeNull();
    expect(mapFuelLabel("Unleaded 87")).toBeNull();
    expect(mapFuelLabel("xyz")).toBeNull();
  });
});

describe("fetchEppoCurrentPrices", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("normalizes a successful response and maps fuel labels", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { product: "Diesel", price: 29.94, effective_date: "2026-05-04" },
          { product: "Gasohol 95", price: "36.55", effective_date: "2026-05-04" },
          { product: "Unknown Fuel", price: 99, effective_date: "2026-05-04" },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchEppoCurrentPrices(new Date("2026-05-04"));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ fuelType: "DIESEL", price: 29.94 });
    expect(result[1]).toMatchObject({ fuelType: "GASOHOL_95", price: 36.55 });
    expect(result[0].effectiveDate.toISOString().slice(0, 10)).toBe("2026-05-04");
  });

  it("skips rows with non-positive or invalid prices", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { product: "Diesel", price: 0, effective_date: "2026-05-04" },
            { product: "Diesel B7", price: -1, effective_date: "2026-05-04" },
            { product: "LPG", price: "abc", effective_date: "2026-05-04" },
          ],
        }),
      })
    );

    const result = await fetchEppoCurrentPrices(new Date("2026-05-04"));
    expect(result).toEqual([]);
  });

  it("returns empty array when EPPO responds non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })
    );

    const result = await fetchEppoCurrentPrices(new Date("2026-05-04"));
    expect(result).toEqual([]);
  });

  it("dedupes identical (fuelType, date) tuples by keeping the last", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { product: "Diesel", price: 29.0, effective_date: "2026-05-04" },
            { product: "Diesel", price: 29.5, effective_date: "2026-05-04" },
          ],
        }),
      })
    );

    const result = await fetchEppoCurrentPrices(new Date("2026-05-04"));
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(29.5);
  });
});

describe("fetchEppoCkanRetailPrices", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("follows CKAN package_show -> JSON resource -> rows", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        if (url.includes("package_show")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              result: {
                resources: [
                  { url: "https://catalog.example/data.csv", format: "CSV" },
                  { url: "https://catalog.example/data.json", format: "JSON" },
                ],
              },
            }),
          };
        }
        return {
          ok: true,
          json: async () => [
            { product: "Diesel", price: 29.94, date: "2026-05-04" },
          ],
        };
      })
    );

    const result = await fetchEppoCkanRetailPrices("petroleum-retail-price");

    expect(calls[0]).toContain("package_show");
    expect(calls[1]).toBe("https://catalog.example/data.json");
    expect(result).toHaveLength(1);
    expect(result[0].fuelType).toBe("DIESEL");
  });

  it("returns empty when no JSON resource is available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            resources: [{ url: "https://catalog.example/data.csv", format: "CSV" }],
          },
        }),
      })
    );

    const result = await fetchEppoCkanRetailPrices();
    expect(result).toEqual([]);
  });
});
