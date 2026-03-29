import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { validatePrice } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const fuelType = searchParams.get("fuelType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    if (fuelType) where.fuelType = fuelType;
    if (startDate || endDate) {
      where.effectiveDate = {};
      if (startDate) (where.effectiveDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.effectiveDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const prices = await prisma.fuelPrice.findMany({
      where,
      orderBy: { effectiveDate: "desc" },
      take: 100,
    });

    return NextResponse.json(prices);
  } catch {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validation = validatePrice(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
    }

    const fuelPrice = await prisma.fuelPrice.create({
      data: {
        fuelType: body.fuelType,
        price: parseFloat(body.price),
        effectiveDate: new Date(body.effectiveDate),
        source: body.source || "EPPO",
      },
    });

    return NextResponse.json(fuelPrice);
  } catch {
    return NextResponse.json({ error: "Failed to create price" }, { status: 500 });
  }
}
