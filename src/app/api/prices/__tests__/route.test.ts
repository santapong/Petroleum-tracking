import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    fuelPrice: {
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

describe("GET /api/prices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    const res = await GET(makeRequest("http://localhost/api/prices"));
    expect(res.status).toBe(401);
  });

  it("returns prices when authenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.fuelPrice.findMany).mockResolvedValue([]);
    const res = await GET(makeRequest("http://localhost/api/prices"));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/prices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    const res = await POST(
      makeRequest("http://localhost/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid price data", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    const res = await POST(
      makeRequest("http://localhost/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fuelType: "INVALID", price: -10, effectiveDate: "" }),
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.details).toBeDefined();
  });

  it("creates price with valid data", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    const mockPrice = { id: "p1", fuelType: "DIESEL", price: 29.94, effectiveDate: new Date() };
    vi.mocked(prisma.fuelPrice.create).mockResolvedValue(mockPrice as never);

    const res = await POST(
      makeRequest("http://localhost/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fuelType: "DIESEL", price: 29.94, effectiveDate: "2024-06-15" }),
      })
    );
    expect(res.status).toBe(200);
  });
});
