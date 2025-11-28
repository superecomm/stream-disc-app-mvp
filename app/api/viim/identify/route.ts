import { NextRequest, NextResponse } from "next/server";
import { extractEmbedding } from "@/lib/mlServiceClient";
import { resolveMlBaseUrl } from "@/lib/mlBaseUrl";
import { findMatchingVoiceprints } from "@/lib/firestore";

const DEFAULT_THRESHOLD = 0.7;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const thresholdParam = formData.get("threshold") as string;
    const threshold = thresholdParam
      ? parseFloat(thresholdParam)
      : DEFAULT_THRESHOLD;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 }
      );
    }

    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: "Invalid threshold (must be between 0 and 1)" },
        { status: 400 }
      );
    }

    const mlBaseUrl = resolveMlBaseUrl();

    if (process.env.NODE_ENV !== "production") {
      console.log("[VIIM identify] Using ML base URL:", mlBaseUrl);
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    // Extract embedding from ML service
    const embeddingResponse = await extractEmbedding(audioBlob, {
      baseUrl: mlBaseUrl,
    });
    const embedding = embeddingResponse.embedding;

    // Find matching voiceprints
    const matches = await findMatchingVoiceprints(embedding, threshold);

    // Format matches
    const formattedMatches = matches.map((match) => ({
      userId: match.userId,
      voiceprintId: match.voiceprintId,
      similarity: match.similarity,
      match: match.similarity >= threshold,
    }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      matches: formattedMatches,
      topMatch:
        formattedMatches.length > 0
          ? {
              userId: formattedMatches[0].userId,
              voiceprintId: formattedMatches[0].voiceprintId,
              similarity: formattedMatches[0].similarity,
            }
          : null,
      threshold,
      processingTime,
      embeddingDimensions: embedding.length,
    });
  } catch (error) {
    console.error("Error in identification:", error);
    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        processingTime,
      },
      { status: 500 }
    );
  }
}

