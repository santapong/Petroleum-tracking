import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    fuelPrice: {
      delete: vi.fn(),
    },
  },
}));

import { DELETE } from "../route";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const mockSession = { user: { id: "user1", email: "admin@test.com", role: "ADMIN" } };

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/prices/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await DELETE(new Request("http://localhost/api/prices/p1", { method: "DELETE" }), makeContext("p1"));
    expect(res.status).toBe(401);
    expect(prisma.fuelPrice.delete).not.toHaveBeenCalled();
  });

  it("deletes the price record", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.fuelPrice.delete).mockResolvedValue({ id: "p1" } as never);

    const res = await DELETE(new Request("http://localhost/api/prices/p1", { method: "DELETE" }), makeContext("p1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(prisma.fuelPrice.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
  });

  it("returns 500 when the record does not exist", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.fuelPrice.delete).mockRejectedValue(new Error("not found"));

    const res = await DELETE(new Request("http://localhost/api/prices/missing", { method: "DELETE" }), makeContext("missing"));
    expect(res.status).toBe(500);
  });
});
