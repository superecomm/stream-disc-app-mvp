"use client";

import { useState, useEffect } from "react";
import VIIMAnimation from "./VIIMAnimation";
import { useVIIMRecorder } from "./VIIMRecorder";
import { VIIMPrompt } from "./VIIMPrompt";
import { useViim } from "@/contexts/VIIMContext";

interface VIIMProps {
  onStart?: () => void;
  onStop?: (audioBlob: Blob) => void;
  onPromptSubmit?: (prompt: string) => void;
  audioDeviceId?: string;
  showPrompt?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VIIM({
  onStart,
  onStop,
  onPromptSubmit,
  audioDeviceId,
  showPrompt = false,
  size = "md",
  className = "",
}: VIIMProps) {
  const { state: contextState, setState: setContextState } = useViim();
  const [localState, setLocalState] = useState<"idle" | "listening" | "speaking" | "recording" | "processing">(
    contextState || "idle"
  );
  const [recordingCountdown, setRecordingCountdown] = useState<number | undefined>(undefined);
  const [recordingTime, setRecordingTime] = useState(0);

  // Sync with context
  useEffect(() => {
    setLocalState(contextState);
  }, [contextState]);

  const { isRecording, startRecording, stopRecording, getAudioStream } = useVIIMRecorder({
    audioDeviceId,
    onStreamReady: (stream) => {
      // Stream is ready
    },
    onAudioData: (audioBlob) => {
      onStop?.(audioBlob);
      setLocalState("processing");
      setContextState("processing");
      // After processing, return to idle
      setTimeout(() => {
        setLocalState("idle");
        setContextState("idle");
      }, 2000);
    },
    onError: (error) => {
      console.error("VIIM recording error:", error);
      setLocalState("idle");
      setContextState("idle");
    },
  });

  // Recording timer
  useEffect(() => {
    if (localState === "recording" && recordingCountdown === 0) {
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [localState, recordingCountdown]);

  const handleClick = async () => {
    if (localState === "idle" || localState === "listening") {
      // Start recording with countdown
      setRecordingCountdown(3);
      setRecordingTime(0);
      setLocalState("idle");
      setContextState("idle");

      // Countdown: 3
      await new Promise((r) => setTimeout(r, 1000));
      setRecordingCountdown(2);

      // Countdown: 2
      await new Promise((r) => setTimeout(r, 1000));
      setRecordingCountdown(1);

      // Countdown: 1
      await new Promise((r) => setTimeout(r, 1000));
      setRecordingCountdown(0);

      // Start recording
      await startRecording();
      setLocalState("recording");
      setContextState("recording");
      onStart?.();
    } else if (localState === "recording") {
      // Stop recording
      stopRecording();
      setRecordingCountdown(undefined);
      setLocalState("processing");
      setContextState("processing");
    }
  };

  const handlePromptSubmit = (prompt: string) => {
    onPromptSubmit?.(prompt);
    setLocalState("processing");
    setContextState("processing");
    // Simulate processing, then return to idle
    setTimeout(() => {
      setLocalState("idle");
      setContextState("idle");
    }, 2000);
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <button
        onClick={handleClick}
        disabled={localState === "processing"}
        className="relative focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={localState === "recording" ? "Stop recording" : "Start recording"}
      >
        <VIIMAnimation
          state={localState}
          size={size}
          container="square"
          visualStyle="particles"
          recordingCountdown={recordingCountdown}
          recordingTime={recordingTime}
          audioStream={getAudioStream()}
        />
      </button>

      {showPrompt && (
        <div className="w-full animate-slide-up">
          <VIIMPrompt onSubmit={handlePromptSubmit} disabled={localState === "processing"} />
        </div>
      )}

      {localState === "recording" && (
        <div className="text-sm text-red-600 font-medium">
          Recording... {recordingTime}s
        </div>
      )}
    </div>
  );
}

