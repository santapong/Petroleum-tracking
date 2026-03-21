import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.deliveredDate) data.deliveredDate = new Date(body.deliveredDate);
    if (body.driverName) data.driverName = body.driverName;
    if (body.truckPlate) data.truckPlate = body.truckPlate;
    if (body.notes !== undefined) data.notes = body.notes;

    const delivery = await prisma.delivery.update({
      where: { id },
      data,
      include: { depot: true, station: true },
    });

    // If delivered, update inventory
    if (body.status === "DELIVERED") {
      await prisma.inventory.upsert({
        where: {
          stationId_fuelType: {
            stationId: delivery.stationId,
            fuelType: delivery.fuelType,
          },
        },
        update: {
          quantity: { increment: delivery.quantity },
          lastUpdated: new Date(),
        },
        create: {
          stationId: delivery.stationId,
          fuelType: delivery.fuelType,
          quantity: delivery.quantity,
          capacity: 50000,
        },
      });
    }

    return NextResponse.json(delivery);
  } catch {
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
