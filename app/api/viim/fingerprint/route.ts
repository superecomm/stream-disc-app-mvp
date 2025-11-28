import { NextRequest, NextResponse } from "next/server";
import { extractEmbedding, checkMLServiceHealth } from "@/lib/mlServiceClient";
import { resolveMlBaseUrl } from "@/lib/mlBaseUrl";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let modelConnected = false;
  let mlModel = "speechbrain/spkrec-ecapa-voxceleb";
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 }
      );
    }

    // Check if ML service is available
    const mlBaseUrl = resolveMlBaseUrl();

    if (process.env.NODE_ENV !== "production") {
      console.log("[VIIM fingerprint] Using ML base URL:", mlBaseUrl);
    }

    modelConnected = await checkMLServiceHealth({ baseUrl: mlBaseUrl });
    
    if (!modelConnected) {
      // Fallback to stub if ML service unavailable
      return NextResponse.json(
        {
          error: "ML service unavailable",
          modelConnected: false,
          mlModel: null,
          fingerprint: `sd_fallback_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          processingTime: Date.now() - startTime,
        },
        { status: 503 }
      );
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

    // Generate unique fingerprint string from embedding hash
    // Use first 16 values of embedding to create a unique ID
    const embeddingHash = embedding
      .slice(0, 16)
      .map((v) => Math.abs(v).toString(36).substring(2, 4))
      .join("");
    const fingerprint = `sd_${embeddingHash}_${Date.now().toString(36).substring(2, 9)}`;

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      fingerprint,
      confidence: 0.95, // Could compute from embedding quality metrics
      timestamp: new Date().toISOString(),
      embeddings: embedding,
      mlModel: mlModel,
      modelConnected: true,
      mlOutput: {
        embeddings: embedding,
        embeddingDimensions: embedding.length,
        audioDuration: embeddingResponse.audio_duration,
      },
      processingTime,
    });
  } catch (error) {
    console.error("Error generating voice fingerprint:", error);
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        modelConnected: false,
        mlModel: null,
        processingTime,
      },
      { status: 500 }
    );
  }
}

