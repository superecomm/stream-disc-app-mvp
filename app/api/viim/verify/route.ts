import { NextRequest, NextResponse } from "next/server";
import { runViim } from "@/lib/viimEngine";
import { createViimVerification, getViimProfile } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, assetId } = body;

    if (!userId || !assetId) {
      return NextResponse.json(
        { error: "Missing userId or assetId" },
        { status: 400 }
      );
    }

    // Optional: Check if user has a VIIM profile
    const profile = await getViimProfile(userId);
    if (!profile) {
      return NextResponse.json(
        { error: "VIIM profile not found. Please set up your profile first." },
        { status: 404 }
      );
    }

    const result = runViim(userId, assetId);
    const verificationId = await createViimVerification(
      userId,
      assetId,
      result
    );

    return NextResponse.json({
      verificationId,
      userId,
      assetId,
      similarityScore: result.similarityScore,
      grade: result.grade,
      serial: result.serial,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error running VIIM verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

