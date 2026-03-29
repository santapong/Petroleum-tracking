import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    station: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { GET, POST } from "../route";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const mockSession = { user: { id: "user1", email: "admin@test.com", role: "ADMIN" } };

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options);
}

describe("GET /api/stations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await GET(makeRequest("http://localhost/api/stations"));
    expect(res.status).toBe(401);
  });

  it("returns stations when authenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    const mockStations = [
      { id: "1", name: "PTT Bangkok", address: "123 Road", province: { nameEn: "Bangkok" } },
    ];
    vi.mocked(prisma.station.findMany).mockResolvedValue(mockStations as never);

    const res = await GET(makeRequest("http://localhost/api/stations"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockStations);
  });

  it("passes search filter to query", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.station.findMany).mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/stations?search=PTT"));
    expect(prisma.station.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: { contains: "PTT", mode: "insensitive" } }),
          ]),
        }),
      })
    );
  });
});

describe("POST /api/stations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await POST(
      makeRequest("http://localhost/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid station data", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });

    const res = await POST(
      makeRequest("http://localhost/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", address: "", provinceId: "" }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
    expect(data.details).toBeDefined();
  });

  it("creates station with valid data", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    const mockStation = { id: "new", name: "Shell Station", address: "456 Road", provinceId: "prov1" };
    vi.mocked(prisma.station.create).mockResolvedValue(mockStation as never);

    const res = await POST(
      makeRequest("http://localhost/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Shell Station", address: "456 Road", provinceId: "prov1" }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Shell Station");
  });

  it("handles NaN latitude gracefully", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });

    const res = await POST(
      makeRequest("http://localhost/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Station",
          address: "123 Road",
          provinceId: "prov1",
          latitude: "not-a-number",
        }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.details.latitude).toBeDefined();
  });
});
