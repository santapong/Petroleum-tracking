import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { readCsvFromRequest } from "@/lib/csv-import";
import {
  validateDelivery,
  safeParseFloat,
  isValidDate,
  DELIVERY_STATUSES,
} from "@/lib/validations";
import type { DeliveryStatus, FuelType } from "@prisma/client";

interface DeliveryRow {
  depotName: string;
  stationName: string;
  fuelType: string;
  quantity: string;
  status?: string;
  scheduledDate: string;
  deliveredDate?: string;
  driverName?: string;
  truckPlate?: string;
  notes?: string;
}

// Row-by-row inserts on large CSVs can exceed Vercel's 10s default
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { rows, errors } = await readCsvFromRequest<DeliveryRow>(req);
    if (rows.length === 0) {
      return NextResponse.json(
        { inserted: 0, updated: 0, skipped: 0, errors: errors.length ? errors : ["CSV had no rows"] },
        { status: 400 }
      );
    }

    const [depots, stations] = await Promise.all([
      prisma.depot.findMany({ select: { id: true, name: true } }),
      prisma.station.findMany({ select: { id: true, name: true } }),
    ]);
    const depotByName = new Map(depots.map((d) => [d.name.toLowerCase(), d.id]));
    const stationByName = new Map(stations.map((s) => [s.name.toLowerCase(), s.id]));

    let inserted = 0;
    const skipped = { count: 0 };
    const rowErrors: string[] = [];

    for (const row of rows) {
      const depotId = depotByName.get((row.depotName || "").toLowerCase());
      const stationId = stationByName.get((row.stationName || "").toLowerCase());

      if (!depotId) {
        skipped.count++;
        rowErrors.push(`Unknown depot: ${row.depotName}`);
        continue;
      }
      if (!stationId) {
        skipped.count++;
        rowErrors.push(`Unknown station: ${row.stationName}`);
        continue;
      }

      const status =
        row.status && DELIVERY_STATUSES.includes(row.status as never)
          ? (row.status as DeliveryStatus)
          : ("SCHEDULED" as DeliveryStatus);

      const candidate = {
        depotId,
        stationId,
        fuelType: row.fuelType,
        quantity: safeParseFloat(row.quantity) ?? 0,
        scheduledDate: row.scheduledDate,
      };

      const validation = validateDelivery(candidate);
      if (!validation.valid) {
        skipped.count++;
        rowErrors.push(
          `${row.depotName}->${row.stationName}: ${Object.values(validation.errors).join(", ")}`
        );
        continue;
      }

      const deliveredDate =
        row.deliveredDate && isValidDate(row.deliveredDate)
          ? new Date(row.deliveredDate)
          : null;

      await prisma.delivery.create({
        data: {
          depotId,
          stationId,
          fuelType: row.fuelType as FuelType,
          quantity: candidate.quantity,
          status,
          scheduledDate: new Date(row.scheduledDate),
          deliveredDate,
          driverName: row.driverName || null,
          truckPlate: row.truckPlate || null,
          notes: row.notes || null,
        },
      });
      inserted++;
    }

    return NextResponse.json({
      inserted,
      updated: 0,
      skipped: skipped.count,
      errors: rowErrors,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Delivery import failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
