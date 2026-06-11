import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { readCsvFromRequest } from "@/lib/csv-import";
import {
  validateInventoryUpdate,
  safeParseFloat,
  DEFAULT_TANK_CAPACITY,
} from "@/lib/validations";
import type { FuelType } from "@prisma/client";

interface InventoryRow {
  stationName: string;
  fuelType: string;
  quantity: string;
  capacity?: string;
}

// Row-by-row upserts on large CSVs can exceed Vercel's 10s default
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { rows, errors } = await readCsvFromRequest<InventoryRow>(req);
    if (rows.length === 0) {
      return NextResponse.json(
        { inserted: 0, updated: 0, skipped: 0, errors: errors.length ? errors : ["CSV had no rows"] },
        { status: 400 }
      );
    }

    const stations = await prisma.station.findMany({
      select: { id: true, name: true },
    });
    const stationByName = new Map(stations.map((s) => [s.name.toLowerCase(), s.id]));

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const rowErrors: string[] = [];

    for (const row of rows) {
      const stationId = stationByName.get((row.stationName || "").toLowerCase());
      if (!stationId) {
        skipped++;
        rowErrors.push(`Unknown station: ${row.stationName}`);
        continue;
      }

      const data = {
        stationId,
        fuelType: row.fuelType,
        quantity: safeParseFloat(row.quantity) ?? 0,
      };

      const validation = validateInventoryUpdate(data);
      if (!validation.valid) {
        skipped++;
        rowErrors.push(
          `${row.stationName}/${row.fuelType}: ${Object.values(validation.errors).join(", ")}`
        );
        continue;
      }

      const capacity = safeParseFloat(row.capacity) ?? DEFAULT_TANK_CAPACITY;

      const existing = await prisma.inventory.findUnique({
        where: {
          stationId_fuelType: {
            stationId,
            fuelType: row.fuelType as FuelType,
          },
        },
        select: { id: true },
      });

      await prisma.inventory.upsert({
        where: {
          stationId_fuelType: {
            stationId,
            fuelType: row.fuelType as FuelType,
          },
        },
        update: {
          quantity: data.quantity,
          capacity,
          lastUpdated: new Date(),
        },
        create: {
          stationId,
          fuelType: row.fuelType as FuelType,
          quantity: data.quantity,
          capacity,
        },
      });

      if (existing) updated++;
      else inserted++;
    }

    return NextResponse.json({ inserted, updated, skipped, errors: rowErrors });
  } catch (err) {
    return NextResponse.json(
      { error: "Inventory import failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
