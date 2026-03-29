import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { DELIVERY_STATUSES, DEFAULT_TANK_CAPACITY } from "@/lib/validations";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();

    if (body.status && !DELIVERY_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid delivery status" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.deliveredDate) data.deliveredDate = new Date(body.deliveredDate);
    if (body.driverName) data.driverName = body.driverName;
    if (body.truckPlate) data.truckPlate = body.truckPlate;
    if (body.notes !== undefined) data.notes = body.notes;

    // Use transaction to ensure delivery update and inventory update are atomic
    const delivery = await prisma.$transaction(async (tx) => {
      const updated = await tx.delivery.update({
        where: { id },
        data,
        include: { depot: true, station: true },
      });

      // If delivered, update inventory
      if (body.status === "DELIVERED") {
        await tx.inventory.upsert({
          where: {
            stationId_fuelType: {
              stationId: updated.stationId,
              fuelType: updated.fuelType,
            },
          },
          update: {
            quantity: { increment: updated.quantity },
            lastUpdated: new Date(),
          },
          create: {
            stationId: updated.stationId,
            fuelType: updated.fuelType,
            quantity: updated.quantity,
            capacity: DEFAULT_TANK_CAPACITY,
          },
        });
      }

      return updated;
    });

    return NextResponse.json(delivery);
  } catch {
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
