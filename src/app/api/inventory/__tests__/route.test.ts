import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    inventory: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { GET, PUT } from "../route";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const mockSession = { user: { id: "user1", email: "admin@test.com", role: "ADMIN" } };

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options);
}

describe("GET /api/inventory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    const res = await GET(makeRequest("http://localhost/api/inventory"));
    expect(res.status).toBe(401);
  });

  it("returns inventory when authenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.inventory.findMany).mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/inventory"));
    expect(res.status).toBe(200);
  });
});

describe("PUT /api/inventory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    const res = await PUT(
      makeRequest("http://localhost/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid inventory data", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    const res = await PUT(
      makeRequest("http://localhost/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: "", fuelType: "INVALID", quantity: -1 }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.details).toBeDefined();
  });

  it("updates inventory with valid data", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    const mockInventory = { id: "inv1", stationId: "s1", fuelType: "DIESEL", quantity: 10000 };
    vi.mocked(prisma.inventory.upsert).mockResolvedValue(mockInventory as never);

    const res = await PUT(
      makeRequest("http://localhost/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: "s1", fuelType: "DIESEL", quantity: 10000 }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.quantity).toBe(10000);
  });
});
