import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { vibeServerClient } from "@/lib/vibe-server-client";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Send push notification using the vibe-message Server SDK
    try {
      if (vibeServerClient) {
        // We need the user's email since that's what the frontend uses to register
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, notificationsEnabled: true },
        });

        if (targetUser?.email && targetUser?.notificationsEnabled) {
          await vibeServerClient.notification({
            notificationData: {
              title: "New Announcement",
              body: message,
            },
            externalUsers: [targetUser.email],
          });
        }
      }
    } catch (pushErr) {
      console.error("Failed to dispatch push notification:", pushErr);
      // We log the error but swallow it so the API request doesn't fail
      // if the push service is temporarily unreachable or times out
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to process notification:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

