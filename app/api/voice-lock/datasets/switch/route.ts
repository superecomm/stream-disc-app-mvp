import { NextRequest, NextResponse } from "next/server";
import { switchActiveDataset } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, datasetId } = body;

    if (!userId || !datasetId) {
      return NextResponse.json(
        { error: "Missing userId or datasetId" },
        { status: 400 }
      );
    }

    const dataset = await switchActiveDataset(userId, datasetId);

    return NextResponse.json({
      ...dataset,
      createdAt: dataset.createdAt.toDate().toISOString(),
      updatedAt: dataset.updatedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error switching dataset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

