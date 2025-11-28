import { NextRequest, NextResponse } from "next/server";
import { extractEmbedding } from "@/lib/mlServiceClient";
import { resolveMlBaseUrl } from "@/lib/mlBaseUrl";
import { createVoiceprint, updateVoiceprint, getVoiceprint } from "@/lib/firestore";
import type { VoiceprintSample } from "@/types/viim";
import { Timestamp } from "firebase-admin/firestore";

const MIN_SAMPLES = 3;
const MAX_SAMPLES = 5;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    let userId = formData.get("userId") as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 }
      );
    }

    // Make userId optional - generate temp ID for testing
    if (!userId) {
      userId = `temp_user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`Generated temporary userId for testing: ${userId}`);
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    const mlBaseUrl = resolveMlBaseUrl();

    if (process.env.NODE_ENV !== "production") {
      console.log("[VIIM enroll] Using ML base URL:", mlBaseUrl);
    }

    // Extract embedding from ML service
    const embeddingResponse = await extractEmbedding(audioBlob, {
      baseUrl: mlBaseUrl,
    });
    const embedding = embeddingResponse.embedding;

    // Create sample record
    const sampleId = `sample_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sample: VoiceprintSample = {
      sampleId,
      audioUrl: "", // Optional: store in Firebase Storage if needed
      embedding,
      duration: embeddingResponse.audio_duration,
      createdAt: Timestamp.now(),
    };

    // Check if user has existing voiceprint
    const existingVoiceprint = await getVoiceprint(userId);

    if (!existingVoiceprint) {
      // Create new voiceprint
      const voiceprint = await createVoiceprint(userId, embedding, sample);

      return NextResponse.json({
        voiceprintId: voiceprint.voiceprintId,
        sampleCount: 1,
        status: "enrolled",
        message: `Sample 1/${MAX_SAMPLES} recorded. Continue recording to improve accuracy.`,
        embedding: embedding, // Optional, for debugging
      });
    } else {
      // Check if enrollment is complete
      if (existingVoiceprint.sampleCount >= MAX_SAMPLES) {
        return NextResponse.json({
          voiceprintId: existingVoiceprint.voiceprintId,
          sampleCount: existingVoiceprint.sampleCount,
          status: "complete",
          message: "Enrollment complete. You have reached the maximum number of samples.",
        });
      }

      // Add sample and update voiceprint
      const updatedVoiceprint = await updateVoiceprint(
        userId,
        embedding,
        sample
      );

      const isComplete = updatedVoiceprint.sampleCount >= MIN_SAMPLES;

      return NextResponse.json({
        voiceprintId: updatedVoiceprint.voiceprintId,
        sampleCount: updatedVoiceprint.sampleCount,
        status: isComplete ? "complete" : "sample_added",
        message: isComplete
          ? `Enrollment complete! ${updatedVoiceprint.sampleCount} samples recorded.`
          : `Sample ${updatedVoiceprint.sampleCount}/${MAX_SAMPLES} recorded. Continue recording to improve accuracy.`,
        embedding: updatedVoiceprint.embedding, // Optional, for debugging
      });
    }
  } catch (error) {
    console.error("Error in enrollment:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

