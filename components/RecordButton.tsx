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
  onItemComplete?: () => void; // Callback when an item is completed (for progress ring jump)
  totalItems?: number; // Total number of items in the session (for dynamic progress calculation)
  currentItemIndex?: number; // Current item index (for progress calculation)
  triggerStart?: boolean; // External trigger to start recording
};

export function RecordButton({ 
  onStart, 
  onStop, 
  onComplete, 
  disabled,
  recordVideo = false,
  audioDeviceId,
  onStreamReady,
  onItemComplete,
  totalItems = 0,
  currentItemIndex = 0,
  triggerStart = false
}: RecordButtonProps) {
  const [state, setState] = useState<"idle" | "recording" | "complete" | "processing">("idle");
  const [progress, setProgress] = useState(0);
  
  // Calculate progress based on items completed
  useEffect(() => {
    if (state === "recording" && totalItems > 0) {
      // Dynamic progress: each item = 100 / totalItems %
      const newProgress = (currentItemIndex / totalItems) * 100;
      setProgress(Math.min(newProgress, 99)); // Cap at 99% for manual stop
    }
  }, [currentItemIndex, totalItems, state]);
  
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
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

  // Progress is now calculated based on items completed (handled in the useEffect above)
  // Reset progress when recording stops
  useEffect(() => {
    if (state === "idle" || state === "complete") {
      setProgress(0);
    }
  }, [state]);

  // Handle external trigger to start recording
  useEffect(() => {
    if (triggerStart && state === "idle" && !disabled) {
      handleStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerStart, state, disabled]);

  const handleStart = async () => {
    try {
      // Request media with audio and optionally video
      // Use 'ideal' instead of 'exact' to allow fallback if device unavailable
      // Handle "default" as system default (use true)
      const audioConstraint = audioDeviceId && audioDeviceId !== "default" 
        ? { deviceId: { ideal: audioDeviceId } }
        : true;
      
      const constraints: MediaStreamConstraints = {
        audio: audioConstraint,
        video: recordVideo ? {
          facingMode: "user", // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false
      };

      console.log("Requesting media with constraints:", { 
        audioDeviceId, 
        audioConstraint,
        recordVideo 
      });

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Separate audio and video tracks
      const audioTracks = stream.getAudioTracks();
      
      // Log which device was actually selected
      if (audioTracks.length > 0) {
        const actualDevice = audioTracks[0].getSettings().deviceId;
        const actualLabel = audioTracks[0].label;
        console.log("Audio device selected:", { deviceId: actualDevice, label: actualLabel });
      }
      
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
      // Call onStart callback to notify parent that recording has started
      onStart();
    } catch (error) {
      console.error("Error accessing media devices:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // If device-specific request failed, try with system default
      if (audioDeviceId && audioDeviceId !== "default" && 
          (errorMessage.includes("NotFoundError") || errorMessage.includes("NotReadableError"))) {
        console.log("Device-specific request failed, trying with system default...");
        try {
          const fallbackConstraints: MediaStreamConstraints = {
            audio: true, // Use system default
            video: recordVideo ? {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } : false
          };
          
          const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          const fallbackAudioTracks = fallbackStream.getAudioTracks();
          const fallbackVideoTracks = fallbackStream.getVideoTracks();
          
          if (fallbackAudioTracks.length > 0) {
            const actualDevice = fallbackAudioTracks[0].getSettings().deviceId;
            const actualLabel = fallbackAudioTracks[0].label;
            console.log("Fallback: Using system default device:", { deviceId: actualDevice, label: actualLabel });
            
            // Continue with fallback stream
            const fallbackAudioStream = new MediaStream(fallbackAudioTracks);
            setAudioStream(fallbackAudioStream);
            
            let fallbackVideoStream: MediaStream | null = null;
            if (recordVideo && fallbackVideoTracks.length > 0) {
              fallbackVideoStream = new MediaStream([...fallbackAudioTracks, ...fallbackVideoTracks]);
              setVideoStream(fallbackVideoStream);
              if (onStreamReady) {
                onStreamReady(fallbackVideoStream);
              }
            } else {
              if (onStreamReady) {
                onStreamReady(fallbackAudioStream);
              }
            }
            
            const fallbackAudioRecorder = new MediaRecorder(fallbackAudioStream, {
              mimeType: "audio/webm;codecs=opus"
            });
            mediaRecorderRef.current = fallbackAudioRecorder;
            audioChunksRef.current = [];
            
            fallbackAudioRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
              }
            };
            
            videoBlobRef.current = undefined;
            audioBlobReadyRef.current = false;
            videoBlobReadyRef.current = false;
            
            fallbackAudioRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
              audioBlobReadyRef.current = true;
              
              fallbackStream.getTracks().forEach((track) => track.stop());
              setAudioStream(null);
              if (fallbackVideoStream) {
                setVideoStream(null);
              }
              if (onStreamReady) {
                onStreamReady(null);
              }
              
              if (recordVideo && videoRecorderRef.current) {
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
            
            if (recordVideo && fallbackVideoStream) {
              const fallbackVideoRecorder = new MediaRecorder(fallbackVideoStream, {
                mimeType: "video/webm;codecs=vp8,opus"
              });
              videoRecorderRef.current = fallbackVideoRecorder;
              videoChunksRef.current = [];
              
              fallbackVideoRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  videoChunksRef.current.push(event.data);
                }
              };
              
              fallbackVideoRecorder.onstop = () => {
                videoBlobRef.current = new Blob(videoChunksRef.current, { type: "video/webm;codecs=vp8,opus" });
                videoBlobReadyRef.current = true;
                
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
              
              fallbackVideoRecorder.start();
            }
            
            fallbackAudioRecorder.start();
            setState("recording");
            setProgress(0);
            onStart();
            return; // Success with fallback
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          // Continue to show error message below
        }
      }
      
      if (errorMessage.includes("permission") || errorMessage.includes("NotAllowedError")) {
        alert("Please allow microphone and camera access to record.");
      } else if (errorMessage.includes("NotFoundError")) {
        alert("Microphone not found. Please check your audio settings and try selecting a different device.");
      } else if (errorMessage.includes("NotReadableError")) {
        alert("Microphone is being used by another application. Please close other apps using the microphone and try again.");
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
          <Video className={`w-8 h-8 ${state === "recording" ? "text-white animate-pulse-mic" : "text-[#111111]"}`} />
        ) : (
          <Mic className={`w-8 h-8 ${state === "recording" ? "text-white animate-pulse-mic" : "text-[#111111]"}`} />
        )}
      </button>
    </div>
  );
}
