import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type { VoiceLockSession } from "@/types/voiceLock";

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

    const adminFirestore = getAdminFirestore();
    
    // Fetch all sessions for the user, ordered by creation date (newest first)
    const sessionsSnapshot = await adminFirestore
      .collection("voiceLockSessions")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50) // Limit to 50 most recent sessions
      .get();

    const sessions: VoiceLockSession[] = sessionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt,
      } as VoiceLockSession;
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

