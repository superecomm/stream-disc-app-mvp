"use client";

import { useEffect, useState, useMemo } from "react";
import { getDisplayItems } from "@/lib/phrases";
import { VoiceTranscription } from "./VoiceTranscription";

type ReadingLaneProps = {
  phrases: string[];
  currentIndex: number;
  isRecording: boolean;
  onNextPhrase?: () => void; // Manual advancement callback
  mode?: string; // Current mode: "voice", "video", "solfege", "script1", "script2", "script3"
  testType?: string | null; // Test type: "solfege", "script1", "script2", "script3", or null
  audioStream?: MediaStream | null; // Audio stream for transcription
  onTranscriptComplete?: (transcript: string, audioBlob: Blob) => void; // Callback when transcript is complete
};

export function ReadingLane({ phrases, currentIndex, isRecording, onNextPhrase, mode, testType, audioStream, onTranscriptComplete }: ReadingLaneProps) {
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine if we're in Solfege mode
  const isSolfege = testType === "solfege";
  
  // Check if we're in pure voice mode (voice mode without any test type)
  const isPureVoiceMode = mode === "voice" && !testType;
  
  // If in pure voice mode, show transcription instead of reading prompts
  if (isPureVoiceMode) {
    return <VoiceTranscription audioStream={audioStream || null} isRecording={isRecording} onTranscriptComplete={onTranscriptComplete} />;
  }
  
  // Get display items (words for scripts, single items for Solfege)
  const displayItems = useMemo(() => {
    return getDisplayItems(phrases, isSolfege);
  }, [phrases, isSolfege]);

  useEffect(() => {
    if (isRecording) {
      setDisplayIndex(currentIndex);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isRecording]);

  // Get mode-specific instruction text
  const getInstructionText = () => {
    if (testType === "solfege") {
      return "Follow the scrolling notes and sing each syllable naturally.";
    } else if (mode === "video") {
      return "Get ready to capture your natural voice on camera";
    } else {
      return "Ready to start reading";
    }
  };

  if (!isRecording && displayIndex === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-400 text-lg">{getInstructionText()}</p>
        </div>
      </div>
    );
  }

  // Ensure displayIndex is within bounds
  const safeDisplayIndex = Math.min(displayIndex, displayItems.length - 1);
  const hasNext = safeDisplayIndex < displayItems.length - 1;
  const hasPrevious = safeDisplayIndex > 0;

  return (
    <div className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="w-full max-w-md mx-auto relative h-full flex items-center justify-center">
        {/* Previous item (fading out at top) */}
        {hasPrevious && (
          <div
            className={`absolute -top-20 left-0 right-0 text-center transition-all duration-500 ${
              isAnimating ? "opacity-0 translate-y-[-30px]" : "opacity-20"
            }`}
            style={{ transform: isAnimating ? "translateY(-30px)" : "translateY(0)" }}
          >
            <p className="text-slate-400 text-lg">{displayItems[safeDisplayIndex - 1]}</p>
          </div>
        )}

        {/* Current item (centered, large, bold) - Clickable for manual advancement */}
        <div
          className={`text-center transition-all duration-500 ${
            isAnimating ? "translate-y-[-15px] opacity-0" : "translate-y-0 opacity-100"
          } ${isRecording && onNextPhrase && hasNext ? "cursor-pointer" : ""}`}
          onClick={() => {
            if (isRecording && onNextPhrase && hasNext) {
              onNextPhrase();
            }
          }}
        >
          <p className="text-4xl md:text-5xl font-bold text-[#111111] leading-tight">
            {displayItems[safeDisplayIndex] || displayItems[0] || ""}
          </p>
          {isRecording && onNextPhrase && hasNext && (
            <p className="text-xs text-slate-500 mt-3">Tap to advance</p>
          )}
        </div>

        {/* Next item (fading in from bottom) */}
        {hasNext && (
          <div
            className={`absolute -bottom-20 left-0 right-0 text-center transition-all duration-500 ${
              isAnimating ? "opacity-100 translate-y-0" : "opacity-20 translate-y-[30px]"
            }`}
            style={{ transform: isAnimating ? "translateY(0)" : "translateY(30px)" }}
          >
            <p className="text-slate-400 text-lg">{displayItems[safeDisplayIndex + 1]}</p>
          </div>
        )}
      </div>
    </div>
  );
}
