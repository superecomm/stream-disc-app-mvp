import { NextRequest, NextResponse } from "next/server";
import { getUserVerifications, getVerificationStats } from "@/lib/firestore";

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

    const [verifications, stats] = await Promise.all([
      getUserVerifications(userId),
      getVerificationStats(userId),
    ]);

    return NextResponse.json({
      verifications: verifications.map((v) => ({
        ...v,
        createdAt: v.createdAt.toDate().toISOString(),
      })),
      stats,
    });
  } catch (error) {
    console.error("Error fetching verifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

