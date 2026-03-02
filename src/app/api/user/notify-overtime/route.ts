import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { vibeServerClient } from "@/lib/vibe-server-client";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, notificationsEnabled: true },
    });

    if (targetUser?.email && targetUser?.notificationsEnabled) {
      if (vibeServerClient) {
        await vibeServerClient.notification({
          notificationData: {
            title: "Workday Complete!",
            body: "You have completed your target hours and are now entering Overtime.",
          },
          externalUsers: [targetUser.email],
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to process overtime notification:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
