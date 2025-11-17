"use client";

import { useEffect, useRef, useState } from "react";

type VideoPreviewProps = {
  stream: MediaStream | null;
  showTextOverlay: boolean;
  onToggleText: () => void;
  phrases: string[];
  currentIndex: number;
  isRecording: boolean;
  onNextPhrase?: () => void;
};

export function VideoPreview({
  stream,
  showTextOverlay,
  onToggleText,
  phrases,
  currentIndex,
  isRecording,
  onNextPhrase,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    if (isRecording) {
      setDisplayIndex(currentIndex);
    }
  }, [currentIndex, isRecording]);

  if (!stream) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <p className="text-white text-lg">Camera preview will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-black overflow-hidden">
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Text Overlay (like live chat) */}
      {showTextOverlay && isRecording && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-md mx-auto px-4">
            {/* Previous phrase */}
            {displayIndex > 0 && (
              <div className="absolute -top-16 left-0 right-0 text-center">
                <p className="text-white/40 text-base drop-shadow-lg">
                  {phrases[displayIndex - 1]}
                </p>
              </div>
            )}

            {/* Current phrase - large, centered */}
            <div
              className={`
                text-center transition-all duration-500
                ${onNextPhrase && displayIndex < phrases.length - 1 ? "cursor-pointer" : ""}
              `}
              onClick={() => {
                if (isRecording && onNextPhrase && displayIndex < phrases.length - 1) {
                  onNextPhrase();
                }
              }}
            >
              <p className="text-3xl font-bold text-white drop-shadow-2xl leading-relaxed">
                {phrases[displayIndex] || phrases[0]}
              </p>
              {isRecording && onNextPhrase && displayIndex < phrases.length - 1 && (
                <p className="text-xs text-white/60 mt-2 drop-shadow-lg">Tap to advance</p>
              )}
            </div>

            {/* Next phrase */}
            {displayIndex < phrases.length - 1 && (
              <div className="absolute -bottom-16 left-0 right-0 text-center">
                <p className="text-white/40 text-base drop-shadow-lg">
                  {phrases[displayIndex + 1]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle Text Overlay Button */}
      {isRecording && (
        <button
          onClick={onToggleText}
          className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-black/70 transition-colors pointer-events-auto z-10"
        >
          {showTextOverlay ? "Hide Text" : "Show Text"}
        </button>
      )}
    </div>
  );
}

