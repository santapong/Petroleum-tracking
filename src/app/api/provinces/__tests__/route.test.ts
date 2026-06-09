import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    province: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "../route";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const mockSession = { user: { id: "user1", email: "admin@test.com", role: "ADMIN" } };

describe("GET /api/provinces", () => {
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

  it("returns provinces sorted by English name", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    const mockProvinces = [
      { id: "1", nameEn: "Bangkok", nameTh: "กรุงเทพมหานคร", region: "CENTRAL" },
      { id: "2", nameEn: "Chiang Mai", nameTh: "เชียงใหม่", region: "NORTHERN" },
    ];
    vi.mocked(prisma.province.findMany).mockResolvedValue(mockProvinces as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockProvinces);
    expect(prisma.province.findMany).toHaveBeenCalledWith({ orderBy: { nameEn: "asc" } });
  });

  it("returns 500 when the database fails", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.province.findMany).mockRejectedValue(new Error("db down"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
