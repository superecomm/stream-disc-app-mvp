import { NextRequest, NextResponse } from "next/server";
import { createDataset, getUserDatasets } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "Missing userId or name" },
        { status: 400 }
      );
    }

    const dataset = await createDataset(userId, name);

    return NextResponse.json({
      ...dataset,
      createdAt: dataset.createdAt.toDate().toISOString(),
      updatedAt: dataset.updatedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error creating dataset:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

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

    const datasets = await getUserDatasets(userId);

    return NextResponse.json({
      datasets: datasets.map((d) => ({
        ...d,
        createdAt: d.createdAt.toDate().toISOString(),
        updatedAt: d.updatedAt.toDate().toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching datasets:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

