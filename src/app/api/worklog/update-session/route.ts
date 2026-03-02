import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { logId, newPunchIn, newPunchOut, totalHours } = await req.json();

    if (!logId || !newPunchIn) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingLog = await prisma.workLog.findUnique({
      where: { id: logId },
    });

    if (!existingLog || existingLog.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Log not found or access denied" },
        { status: 404 },
      );
    }

    const log = await prisma.workLog.update({
      where: { id: logId },
      data: {
        punchIn: new Date(newPunchIn),
        punchOut: newPunchOut ? new Date(newPunchOut) : null,
        totalHours: typeof totalHours === "number" ? totalHours : null,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Failed to update session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
