import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const holidays = await prisma.holiday.findMany({
      orderBy: { date: "desc" },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Fetch admin holidays error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, date, durationMinutes } = body;

    if (!name || !date) {
      return NextResponse.json({ error: "Name and date are required" }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: new Date(date),
        durationMinutes: durationMinutes ?? null,
        adminId: session.user.id,
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    console.error("Create holiday error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
