import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateVoiceLockProfile, getVoiceLockProfile } from "@/lib/firestore";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const profile = await getVoiceLockProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...profile,
      createdAt: profile.createdAt.toDate().toISOString(),
      updatedAt: profile.updatedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching VoiceLock profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, samplesCount } = body;

    if (!userId || typeof samplesCount !== "number") {
      return NextResponse.json(
        { error: "Missing userId or samplesCount" },
        { status: 400 }
      );
    }

    const profile = await createOrUpdateVoiceLockProfile(userId, samplesCount);

    return NextResponse.json({
      voiceLockId: profile.voiceLockId,
      hasVoiceLock: profile.hasVoiceLock,
      samplesCount: profile.samplesCount,
      calibrationLevel: profile.calibrationLevel,
      createdAt: profile.createdAt.toDate().toISOString(),
      updatedAt: profile.updatedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error creating/updating VoiceLock profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

