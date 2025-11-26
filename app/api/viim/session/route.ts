import { NextRequest, NextResponse } from "next/server";
import { addViimSession, addViimSessionToDataset, getActiveDataset } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const phrasesCount = parseInt(formData.get("phrasesCount") as string) || 0;
    const source = (formData.get("source") as "mobile" | "studio") || "mobile";
    const audioFile = formData.get("audio") as File | null;
    const videoFile = formData.get("video") as File | null;
    const hasVideo = formData.get("hasVideo") === "true";
    const studioId = formData.get("studioId") as string | null;
    const studioName = formData.get("studioName") as string | null;
    const vocalType = (formData.get("vocalType") as "speech" | "singing" | "rapping" | "other") || "speech";
    const transcript = formData.get("transcript") as string | null;
    const chatMessages = formData.get("chatMessages") as string | null; // JSON string of chat messages

    if (!userId || !phrasesCount) {
      return NextResponse.json(
        { error: "Missing userId or phrasesCount" },
        { status: 400 }
      );
    }

    // For MVP, we'll save the session metadata
    // Audio/Video file upload to Firebase Storage can be added later
    // Note: When video is provided, we can extract audio from it server-side
    // For now, we send both audio and video separately
    // if (audioFile) {
    //   // Upload to Firebase Storage
    //   // const audioUrl = await uploadAudioToStorage(userId, audioFile);
    // }
    // if (videoFile) {
    //   // Upload video to Firebase Storage
    //   // const videoUrl = await uploadVideoToStorage(userId, videoFile);
    //   // Extract audio from video using FFmpeg or similar
    //   // const extractedAudio = await extractAudioFromVideo(videoFile);
    // }

    // Check if user has an active dataset
    const activeDataset = await getActiveDataset(userId);

    if (activeDataset) {
      // Parse chat messages if provided
      let parsedChatMessages = undefined;
      if (chatMessages) {
        try {
          parsedChatMessages = JSON.parse(chatMessages);
        } catch (e) {
          console.error("Error parsing chatMessages:", e);
        }
      }

      // Use dataset-based session
      const { session, dataset } = await addViimSessionToDataset(
        userId,
        activeDataset.datasetId,
        phrasesCount,
        source,
        {
          studioId: studioId || undefined,
          studioName: studioName || undefined,
          vocalType: vocalType,
          verified: source === "studio" ? false : undefined, // Studio sessions need verification
          transcript: transcript || undefined,
          chatMessages: parsedChatMessages || undefined,
        }
      );

      return NextResponse.json({
        sessionId: session.sessionId,
        dataset: {
          ...dataset,
          createdAt: dataset.createdAt.toDate().toISOString(),
          updatedAt: dataset.updatedAt.toDate().toISOString(),
        },
      });
    } else {
      // Fallback to legacy profile-based session
      const { session, profile } = await addViimSession(userId, phrasesCount, source);

      return NextResponse.json({
        sessionId: session.sessionId,
        profile: {
          ...profile,
          createdAt: profile.createdAt.toDate().toISOString(),
          updatedAt: profile.updatedAt.toDate().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("Error creating VIIM session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Full error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

