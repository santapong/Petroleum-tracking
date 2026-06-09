import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const provinces = await prisma.province.findMany({
      orderBy: { nameEn: "asc" },
    });

    return NextResponse.json(provinces);
  } catch {
    return NextResponse.json({ error: "Failed to fetch provinces" }, { status: 500 });
  }
}
