import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const stationId = searchParams.get("stationId");

    const where: Record<string, unknown> = {};
    if (stationId) where.stationId = stationId;

    const inventory = await prisma.inventory.findMany({
      where,
      include: { station: { include: { province: true } } },
      orderBy: { lastUpdated: "desc" },
    });

    return NextResponse.json(inventory);
  } catch {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { stationId, fuelType, quantity } = body;

    const inventory = await prisma.inventory.upsert({
      where: {
        stationId_fuelType: { stationId, fuelType },
      },
      update: {
        quantity: parseFloat(quantity),
        lastUpdated: new Date(),
      },
      create: {
        stationId,
        fuelType,
        quantity: parseFloat(quantity),
        capacity: body.capacity ? parseFloat(body.capacity) : 50000,
      },
      include: { station: true },
    });

    return NextResponse.json(inventory);
  } catch {
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
