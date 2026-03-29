import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    delivery: {
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

describe("GET /api/deliveries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    const res = await GET(makeRequest("http://localhost/api/deliveries"));
    expect(res.status).toBe(401);
  });

  it("returns deliveries when authenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/deliveries"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("applies status filter", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([]);
    await GET(makeRequest("http://localhost/api/deliveries?status=DELIVERED"));
    expect(prisma.delivery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "DELIVERED" }),
      })
    );
  });
});

describe("POST /api/deliveries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    const res = await POST(
      makeRequest("http://localhost/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid delivery data", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    const res = await POST(
      makeRequest("http://localhost/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depotId: "", stationId: "", fuelType: "INVALID", quantity: -1 }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.details).toBeDefined();
  });

  it("creates delivery with valid data", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    const mockDelivery = {
      id: "del1",
      depotId: "depot1",
      stationId: "station1",
      fuelType: "DIESEL",
      quantity: 5000,
    };
    vi.mocked(prisma.delivery.create).mockResolvedValue(mockDelivery as never);

    const res = await POST(
      makeRequest("http://localhost/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depotId: "depot1",
          stationId: "station1",
          fuelType: "DIESEL",
          quantity: 5000,
          scheduledDate: "2024-06-15",
        }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fuelType).toBe("DIESEL");
  });
});
