"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Check, Video } from "lucide-react";
import { Waveform } from "./Waveform";

type RecordButtonProps = {
  onStart: () => void;
  onStop: (audioBlob: Blob, videoBlob?: Blob) => void;
  onComplete: () => void;
  disabled?: boolean;
  recordVideo?: boolean; // Enable video recording
  audioDeviceId?: string; // Specific audio device to use
  onStreamReady?: (stream: MediaStream | null) => void; // Expose stream for preview
};

export function RecordButton({ 
  onStart, 
  onStop, 
  onComplete, 
  disabled,
  recordVideo = false,
  audioDeviceId,
  onStreamReady
}: RecordButtonProps) {
  const [state, setState] = useState<"idle" | "recording" | "complete" | "processing">("idle");
  const [progress, setProgress] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const videoBlobRef = useRef<Blob | undefined>(undefined);
  const audioBlobReadyRef = useRef(false);
  const videoBlobReadyRef = useRef(false);

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      if (videoRecorderRef.current && recordVideo) {
        videoRecorderRef.current.stop();
      }
      setState("complete");
      setProgress(100);
      
      // Wait for both recorders to finish before processing
      // The onstop handlers will call onStop with the blobs
    }
  };

  useEffect(() => {
    if (state === "recording") {
      recordingStartTimeRef.current = Date.now();
      // Update progress based on elapsed time (for visual feedback, max 5 minutes)
      const maxDuration = 5 * 60 * 1000; // 5 minutes max
      progressIntervalRef.current = setInterval(() => {
        if (recordingStartTimeRef.current) {
          const elapsed = Date.now() - recordingStartTimeRef.current;
          const newProgress = Math.min((elapsed / maxDuration) * 100, 99); // Cap at 99% for manual stop
          setProgress(newProgress);
        }
      }, 100);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      recordingStartTimeRef.current = null;
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleStart = async () => {
    try {
      // Request media with audio and optionally video
      const constraints: MediaStreamConstraints = {
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: recordVideo ? {
          facingMode: "user", // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Separate audio and video tracks
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      
      // Create audio-only stream for audio recorder
      const audioStream = new MediaStream(audioTracks);
      setAudioStream(audioStream);
      
      // Create video stream if recording video
      if (recordVideo && videoTracks.length > 0) {
        const videoStream = new MediaStream([...audioTracks, ...videoTracks]);
        setVideoStream(videoStream);
        // Expose stream for preview
        if (onStreamReady) {
          onStreamReady(videoStream);
        }
      } else {
        // Expose audio stream for preview (even in voice mode, for consistency)
        if (onStreamReady) {
          onStreamReady(audioStream);
        }
      }

      // Audio recorder (always record audio)
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus" // Better quality for ML processing
      });
      mediaRecorderRef.current = audioRecorder;
      audioChunksRef.current = [];

      audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Reset refs for this recording session
      videoBlobRef.current = undefined;
      audioBlobReadyRef.current = false;
      videoBlobReadyRef.current = false;

      audioRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
        audioBlobReadyRef.current = true;
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
        if (videoStream) {
          setVideoStream(null);
        }
        // Clear preview stream
        if (onStreamReady) {
          onStreamReady(null);
        }

        // If video recording, wait for video blob, otherwise proceed
        if (recordVideo && videoRecorderRef.current) {
          // Wait for video to finish - check if already ready
          if (videoBlobReadyRef.current) {
            onStop(audioBlob, videoBlobRef.current);
            setState("processing");
            setTimeout(() => {
              setState("idle");
              setProgress(0);
              onComplete();
            }, 1500);
          }
        } else {
          onStop(audioBlob);
          setState("processing");
          setTimeout(() => {
            setState("idle");
            setProgress(0);
            onComplete();
          }, 1500);
        }
      };

      // Video recorder (if enabled)
      if (recordVideo && videoTracks.length > 0) {
        const videoRecorder = new MediaRecorder(videoStream!, {
          mimeType: "video/webm;codecs=vp8,opus" // WebM with VP8 video and Opus audio
        });
        videoRecorderRef.current = videoRecorder;
        videoChunksRef.current = [];

        videoRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data);
          }
        };

        videoRecorder.onstop = () => {
          videoBlobRef.current = new Blob(videoChunksRef.current, { type: "video/webm;codecs=vp8,opus" });
          videoBlobReadyRef.current = true;
          
          // If audio is ready, call onStop
          if (audioBlobReadyRef.current) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
            onStop(audioBlob, videoBlobRef.current);
            setState("processing");
            setTimeout(() => {
              setState("idle");
              setProgress(0);
              onComplete();
            }, 1500);
          }
        };

        videoRecorder.start();
      }

      audioRecorder.start();
      setState("recording");
      setProgress(0);
      onStart();
    } catch (error) {
      console.error("Error accessing media devices:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("permission") || errorMessage.includes("NotAllowedError")) {
        alert("Please allow microphone and camera access to record.");
      } else {
        alert(`Error accessing media: ${errorMessage}`);
      }
    }
  };

  const handleStop = () => {
    if (state === "recording") {
      stopRecording();
    }
  };

  const handleClick = () => {
    if (disabled || state === "processing") return;
    
    if (state === "recording") {
      handleStop();
    } else if (state === "idle") {
      handleStart();
    }
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || state === "processing"}
        className={`
          relative w-24 h-24 rounded-full flex items-center justify-center
          transition-all duration-300
          ${state === "recording"
            ? "bg-[#FF3B30] hover:bg-[#FF2D20] shadow-lg"
            : state === "complete"
            ? "bg-green-500"
            : state === "processing"
            ? "bg-slate-300"
            : "bg-white border-2 border-slate-300 hover:border-slate-400 shadow-sm"
          }
          ${disabled || state === "processing" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${state === "idle" ? "animate-pulse-slow" : ""}
        `}
      >
        {/* Sweep ring animation (recording) */}
        {state === "recording" && (
          <svg className="absolute inset-0 w-24 h-24 transform -rotate-90 pointer-events-none">
            <circle
              cx="48"
              cy="48"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="2"
            />
            <circle
              cx="48"
              cy="48"
              r="45"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-100"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Waveform inside circle (recording) */}
        {state === "recording" && audioStream && !recordVideo && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <Waveform isRecording={true} audioStream={audioStream} />
          </div>
        )}

        {/* Video indicator (recording) */}
        {state === "recording" && recordVideo && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}

        {/* Icon */}
        {state === "processing" ? (
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : state === "complete" ? (
          <Check className="w-8 h-8 text-white" />
        ) : recordVideo ? (
          <Video className={`w-8 h-8 ${state === "recording" ? "text-white" : "text-[#111111]"}`} />
        ) : (
          <Mic className={`w-8 h-8 ${state === "recording" ? "text-white" : "text-[#111111]"}`} />
        )}
      </button>
    </div>
  );
}
