import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { validateInventoryUpdate, DEFAULT_TANK_CAPACITY } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

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
    const { error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validation = validateInventoryUpdate(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
    }

    const inventory = await prisma.inventory.upsert({
      where: {
        stationId_fuelType: { stationId: body.stationId, fuelType: body.fuelType },
      },
      update: {
        quantity: parseFloat(body.quantity),
        ...(body.capacity ? { capacity: parseFloat(body.capacity) } : {}),
        lastUpdated: new Date(),
      },
      create: {
        stationId: body.stationId,
        fuelType: body.fuelType,
        quantity: parseFloat(body.quantity),
        capacity: body.capacity ? parseFloat(body.capacity) : DEFAULT_TANK_CAPACITY,
      },
      include: { station: true },
    });

    return NextResponse.json(inventory);
  } catch {
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
