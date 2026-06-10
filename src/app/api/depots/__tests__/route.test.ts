import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    depot: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "../route";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const mockSession = { user: { id: "user1", email: "admin@test.com", role: "ADMIN" } };

describe("GET /api/depots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns depots sorted by name with province", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    const mockDepots = [
      { id: "1", name: "Bangchak Depot", province: { nameEn: "Bangkok" } },
      { id: "2", name: "Sriracha Depot", province: { nameEn: "Chonburi" } },
    ];
    vi.mocked(prisma.depot.findMany).mockResolvedValue(mockDepots as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockDepots);
    expect(prisma.depot.findMany).toHaveBeenCalledWith({
      include: { province: true },
      orderBy: { name: "asc" },
    });
  });

  it("returns 500 when the database fails", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.depot.findMany).mockRejectedValue(new Error("db down"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
