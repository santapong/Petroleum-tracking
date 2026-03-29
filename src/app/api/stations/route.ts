import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { validateStation, safeParseFloat } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const provinceId = searchParams.get("provinceId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (provinceId) where.provinceId = provinceId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const stations = await prisma.station.findMany({
      where,
      include: { province: true, inventory: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(stations);
  } catch {
    return NextResponse.json({ error: "Failed to fetch stations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validation = validateStation(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
    }

    const station = await prisma.station.create({
      data: {
        name: body.name,
        address: body.address,
        provinceId: body.provinceId,
        latitude: safeParseFloat(body.latitude),
        longitude: safeParseFloat(body.longitude),
        owner: body.owner,
        phone: body.phone,
        status: body.status || "ACTIVE",
      },
      include: { province: true },
    });

    return NextResponse.json(station);
  } catch {
    return NextResponse.json({ error: "Failed to create station" }, { status: 500 });
  }
}
