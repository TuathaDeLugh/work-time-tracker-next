import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET — Retrieve saved timer state
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const timerState = await prisma.timerState.findUnique({
            where: { userId: session.user.id },
        });

        if (!timerState) {
            return NextResponse.json(null);
        }

        // Convert BigInt to number for JSON serialization
        return NextResponse.json({
            ...timerState,
            startTime: timerState.startTime ? Number(timerState.startTime) : null,
            targetWorkMs: Number(timerState.targetWorkMs),
            targetBreakMs: Number(timerState.targetBreakMs),
            accumulatedWorkMs: Number(timerState.accumulatedWorkMs),
            accumulatedBreakMs: Number(timerState.accumulatedBreakMs),
            lastStatusChange: timerState.lastStatusChange
                ? Number(timerState.lastStatusChange)
                : null,
        });
    } catch (error) {
        console.error("Get timer state error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST — Save/sync timer state
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            isActive,
            startTime,
            targetWorkMs,
            targetBreakMs,
            accumulatedWorkMs,
            accumulatedBreakMs,
            lastStatusChange,
            status,
            logs,
        } = body;

        const timerState = await prisma.timerState.upsert({
            where: { userId: session.user.id },
            update: {
                isActive: isActive ?? false,
                startTime: startTime ? BigInt(startTime) : null,
                targetWorkMs: BigInt(targetWorkMs || 0),
                targetBreakMs: BigInt(targetBreakMs || 0),
                accumulatedWorkMs: BigInt(accumulatedWorkMs || 0),
                accumulatedBreakMs: BigInt(accumulatedBreakMs || 0),
                lastStatusChange: lastStatusChange ? BigInt(lastStatusChange) : null,
                status: status || "idle",
                logs: logs || [],
            },
            create: {
                userId: session.user.id,
                isActive: isActive ?? false,
                startTime: startTime ? BigInt(startTime) : null,
                targetWorkMs: BigInt(targetWorkMs || 0),
                targetBreakMs: BigInt(targetBreakMs || 0),
                accumulatedWorkMs: BigInt(accumulatedWorkMs || 0),
                accumulatedBreakMs: BigInt(accumulatedBreakMs || 0),
                lastStatusChange: lastStatusChange ? BigInt(lastStatusChange) : null,
                status: status || "idle",
                logs: logs || [],
            },
        });

        return NextResponse.json({
            success: true,
            updatedAt: timerState.updatedAt,
        });
    } catch (error) {
        console.error("Sync timer state error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE — Clear timer state (on reset)
export async function DELETE() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.timerState.deleteMany({
            where: { userId: session.user.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete timer state error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
