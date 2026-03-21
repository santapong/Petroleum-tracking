import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const station = await prisma.station.findUnique({
      where: { id },
      include: { province: true, inventory: true, deliveries: { include: { depot: true }, orderBy: { scheduledDate: "desc" }, take: 10 } },
    });

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    return NextResponse.json(station);
  } catch {
    return NextResponse.json({ error: "Failed to fetch station" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const station = await prisma.station.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        provinceId: body.provinceId,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        owner: body.owner,
        phone: body.phone,
        status: body.status,
      },
      include: { province: true },
    });

    return NextResponse.json(station);
  } catch {
    return NextResponse.json({ error: "Failed to update station" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.station.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete station" }, { status: 500 });
  }
}
