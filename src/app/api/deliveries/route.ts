import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { validateDelivery } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const stationId = searchParams.get("stationId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (stationId) where.stationId = stationId;

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        depot: true,
        station: { include: { province: true } },
      },
      orderBy: { scheduledDate: "desc" },
      take: 100,
    });

    return NextResponse.json(deliveries);
  } catch {
    return NextResponse.json({ error: "Failed to fetch deliveries" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validation = validateDelivery(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
    }

    const delivery = await prisma.delivery.create({
      data: {
        depotId: body.depotId,
        stationId: body.stationId,
        fuelType: body.fuelType,
        quantity: parseFloat(body.quantity),
        scheduledDate: new Date(body.scheduledDate),
        driverName: body.driverName,
        truckPlate: body.truckPlate,
        notes: body.notes,
      },
      include: { depot: true, station: true },
    });

    return NextResponse.json(delivery);
  } catch {
    return NextResponse.json({ error: "Failed to create delivery" }, { status: 500 });
  }
}
