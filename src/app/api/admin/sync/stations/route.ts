import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { readCsvFromRequest } from "@/lib/csv-import";
import { validateStation, safeParseFloat, STATION_STATUSES } from "@/lib/validations";

interface StationRow {
  name: string;
  address: string;
  provinceCode: string;
  latitude?: string;
  longitude?: string;
  owner?: string;
  phone?: string;
  status?: string;
}

// Row-by-row upserts on large CSVs can exceed Vercel's 10s default
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { rows, errors } = await readCsvFromRequest<StationRow>(req);
    if (rows.length === 0) {
      return NextResponse.json(
        { inserted: 0, updated: 0, skipped: 0, errors: errors.length ? errors : ["CSV had no rows"] },
        { status: 400 }
      );
    }

    const provinces = await prisma.province.findMany({
      select: { id: true, nameEn: true },
    });
    const provinceByName = new Map(provinces.map((p) => [p.nameEn.toLowerCase(), p.id]));

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const rowErrors: string[] = [];

    for (const row of rows) {
      const provinceId = provinceByName.get((row.provinceCode || "").toLowerCase());
      if (!provinceId) {
        skipped++;
        rowErrors.push(`Unknown province: ${row.provinceCode}`);
        continue;
      }

      const status =
        row.status && STATION_STATUSES.includes(row.status as never)
          ? row.status
          : "ACTIVE";

      const data = {
        name: row.name,
        address: row.address,
        provinceId,
        latitude: safeParseFloat(row.latitude),
        longitude: safeParseFloat(row.longitude),
        owner: row.owner || null,
        phone: row.phone || null,
        status: status as "ACTIVE" | "INACTIVE" | "MAINTENANCE",
      };

      const validation = validateStation(data);
      if (!validation.valid) {
        skipped++;
        rowErrors.push(`${row.name}: ${Object.values(validation.errors).join(", ")}`);
        continue;
      }

      const existing = await prisma.station.findFirst({
        where: { name: row.name, provinceId },
        select: { id: true },
      });

      if (existing) {
        await prisma.station.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.station.create({ data });
        inserted++;
      }
    }

    return NextResponse.json({ inserted, updated, skipped, errors: rowErrors });
  } catch (err) {
    return NextResponse.json(
      { error: "Station import failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
