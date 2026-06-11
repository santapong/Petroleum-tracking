import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { fetchEppoPrices } from "@/lib/eppo";

// EPPO API + CKAN fallback can take well over Vercel's 10s default
export const maxDuration = 60;

export async function POST() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const prices = await fetchEppoPrices();

    if (prices.length === 0) {
      return NextResponse.json(
        {
          inserted: 0,
          updated: 0,
          skipped: 0,
          errors: ["EPPO returned no usable rows"],
        },
        { status: 502 }
      );
    }

    let inserted = 0;
    let updated = 0;

    for (const p of prices) {
      const existing = await prisma.fuelPrice.findUnique({
        where: {
          fuelType_effectiveDate: {
            fuelType: p.fuelType,
            effectiveDate: p.effectiveDate,
          },
        },
        select: { id: true },
      });

      await prisma.fuelPrice.upsert({
        where: {
          fuelType_effectiveDate: {
            fuelType: p.fuelType,
            effectiveDate: p.effectiveDate,
          },
        },
        update: { price: p.price, source: "EPPO" },
        create: {
          fuelType: p.fuelType,
          price: p.price,
          effectiveDate: p.effectiveDate,
          source: "EPPO",
        },
      });

      if (existing) updated++;
      else inserted++;
    }

    return NextResponse.json({
      inserted,
      updated,
      skipped: 0,
      errors: [],
      total: prices.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "EPPO sync failed", message: (err as Error).message },
      { status: 500 }
    );
  }
}
