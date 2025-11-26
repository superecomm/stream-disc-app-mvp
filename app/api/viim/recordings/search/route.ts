import { NextRequest, NextResponse } from "next/server";
import { searchRecordings } from "@/lib/mlServiceClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { embedding, recordingId, threshold, limit } = body;

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json(
        { error: "Missing or invalid embedding array" },
        { status: 400 }
      );
    }

    // Call ML service search endpoint
    const results = await searchRecordings(
      embedding,
      threshold || 0.5,
      limit || 3,
      recordingId
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching recordings:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

