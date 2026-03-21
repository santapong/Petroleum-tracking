import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
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
    const body = await req.json();
    const station = await prisma.station.create({
      data: {
        name: body.name,
        address: body.address,
        provinceId: body.provinceId,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
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
