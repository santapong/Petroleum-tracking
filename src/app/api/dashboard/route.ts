import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { LOW_STOCK_THRESHOLD } from "@/lib/validations";

export async function GET() {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalStations, activeDeliveries, pricesToday, inventory, recentDeliveries, latestPrice] =
      await Promise.all([
        prisma.station.count(),
        prisma.delivery.count({ where: { status: { in: ["SCHEDULED", "IN_TRANSIT"] } } }),
        prisma.fuelPrice.count({ where: { effectiveDate: { gte: startOfToday } } }),
        prisma.inventory.findMany({
          select: {
            quantity: true,
            capacity: true,
            fuelType: true,
            lastUpdated: true,
            station: { select: { name: true } },
          },
        }),
        prisma.delivery.findMany({
          include: { station: { select: { name: true } } },
          orderBy: { updatedAt: "desc" },
          take: 3,
        }),
        prisma.fuelPrice.findFirst({ orderBy: { createdAt: "desc" } }),
      ]);

    const lowStock = inventory.filter(
      (i) => i.capacity > 0 && i.quantity / i.capacity < LOW_STOCK_THRESHOLD
    );

    const recentActivity = [
      ...recentDeliveries.map((d) => ({
        type: "delivery" as const,
        status: d.status,
        stationName: d.station.name,
        fuelType: d.fuelType,
        quantity: d.quantity,
        timestamp: d.updatedAt.toISOString(),
      })),
      ...(latestPrice
        ? [
            {
              type: "price" as const,
              fuelType: latestPrice.fuelType,
              price: latestPrice.price,
              timestamp: latestPrice.createdAt.toISOString(),
            },
          ]
        : []),
      ...lowStock
        .sort((a, b) => a.quantity / a.capacity - b.quantity / b.capacity)
        .slice(0, 2)
        .map((i) => ({
          type: "lowStock" as const,
          stationName: i.station.name,
          fuelType: i.fuelType,
          percent: Math.round((i.quantity / i.capacity) * 100),
          timestamp: i.lastUpdated.toISOString(),
        })),
    ]
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .slice(0, 6);

    return NextResponse.json({
      totalStations,
      activeDeliveries,
      pricesToday,
      lowInventory: lowStock.length,
      recentActivity,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
