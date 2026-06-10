import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const depots = await prisma.depot.findMany({
      include: { province: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(depots);
  } catch {
    return NextResponse.json({ error: "Failed to fetch depots" }, { status: 500 });
  }
}
