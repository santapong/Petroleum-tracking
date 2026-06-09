import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    station: { count: vi.fn() },
    delivery: { count: vi.fn(), findMany: vi.fn() },
    fuelPrice: { count: vi.fn(), findFirst: vi.fn() },
    inventory: { findMany: vi.fn() },
  },
}));

import { GET } from "../route";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const mockSession = { user: { id: "user1", email: "admin@test.com", role: "ADMIN" } };

describe("GET /api/dashboard", () => {
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

  it("returns aggregated stats and recent activity", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.station.count).mockResolvedValue(12);
    vi.mocked(prisma.delivery.count).mockResolvedValue(4);
    vi.mocked(prisma.fuelPrice.count).mockResolvedValue(8);
    vi.mocked(prisma.inventory.findMany).mockResolvedValue([
      // 10% of capacity -> low stock
      { quantity: 1000, capacity: 10000, fuelType: "DIESEL", lastUpdated: new Date("2026-06-01"), station: { name: "Low Station" } },
      // 80% of capacity -> healthy
      { quantity: 8000, capacity: 10000, fuelType: "LPG", lastUpdated: new Date("2026-06-02"), station: { name: "Full Station" } },
      // zero capacity must not divide by zero or count as low
      { quantity: 0, capacity: 0, fuelType: "NGV", lastUpdated: new Date("2026-06-03"), station: { name: "Empty Station" } },
    ] as never);
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([
      {
        status: "DELIVERED",
        fuelType: "DIESEL",
        quantity: 5000,
        updatedAt: new Date("2026-06-08T10:00:00Z"),
        station: { name: "Bangkok Station" },
      },
    ] as never);
    vi.mocked(prisma.fuelPrice.findFirst).mockResolvedValue({
      fuelType: "GASOHOL_95",
      price: 35.5,
      createdAt: new Date("2026-06-09T05:00:00Z"),
    } as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.totalStations).toBe(12);
    expect(data.activeDeliveries).toBe(4);
    expect(data.pricesToday).toBe(8);
    expect(data.lowInventory).toBe(1);

    const types = data.recentActivity.map((a: { type: string }) => a.type);
    expect(types).toContain("delivery");
    expect(types).toContain("price");
    expect(types).toContain("lowStock");

    // sorted most recent first
    const timestamps = data.recentActivity.map((a: { timestamp: string }) => a.timestamp);
    const sorted = [...timestamps].sort().reverse();
    expect(timestamps).toEqual(sorted);

    const lowStock = data.recentActivity.find((a: { type: string }) => a.type === "lowStock");
    expect(lowStock.stationName).toBe("Low Station");
    expect(lowStock.percent).toBe(10);
  });

  it("counts only scheduled and in-transit deliveries as active", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.station.count).mockResolvedValue(0);
    vi.mocked(prisma.delivery.count).mockResolvedValue(0);
    vi.mocked(prisma.fuelPrice.count).mockResolvedValue(0);
    vi.mocked(prisma.inventory.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.fuelPrice.findFirst).mockResolvedValue(null as never);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(prisma.delivery.count).toHaveBeenCalledWith({
      where: { status: { in: ["SCHEDULED", "IN_TRANSIT"] } },
    });
    const data = await res.json();
    expect(data.recentActivity).toEqual([]);
  });

  it("returns 500 when the database fails", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: mockSession, error: null });
    vi.mocked(prisma.station.count).mockRejectedValue(new Error("db down"));
    vi.mocked(prisma.delivery.count).mockResolvedValue(0);
    vi.mocked(prisma.fuelPrice.count).mockResolvedValue(0);
    vi.mocked(prisma.inventory.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.fuelPrice.findFirst).mockResolvedValue(null as never);

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
