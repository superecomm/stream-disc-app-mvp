"use client";

import { useEffect, useState } from "react";

type ReadingLaneProps = {
  phrases: string[];
  currentIndex: number;
  isRecording: boolean;
  onNextPhrase?: () => void; // Manual advancement callback
};

export function ReadingLane({ phrases, currentIndex, isRecording, onNextPhrase }: ReadingLaneProps) {
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isRecording) {
      setDisplayIndex(currentIndex);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isRecording]);

  if (!isRecording && displayIndex === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-400 text-lg">Ready to start reading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="w-full max-w-md mx-auto relative">
        {/* Previous phrase (fading out at top) */}
        {displayIndex > 0 && (
          <div
            className={`absolute -top-16 left-0 right-0 text-center transition-all duration-500 ${
              isAnimating ? "opacity-0 translate-y-[-20px]" : "opacity-20"
            }`}
          >
            <p className="text-slate-400 text-base">{phrases[displayIndex - 1]}</p>
          </div>
        )}

        {/* Current phrase (centered, bold) - Clickable for manual advancement */}
        <div
          className={`text-center transition-all duration-500 ${
            isAnimating ? "translate-y-[-10px] opacity-0" : "translate-y-0 opacity-100"
          } ${isRecording && onNextPhrase && displayIndex < phrases.length - 1 ? "cursor-pointer" : ""}`}
          onClick={() => {
            if (isRecording && onNextPhrase && displayIndex < phrases.length - 1) {
              onNextPhrase();
            }
          }}
        >
          <p className="text-2xl font-semibold text-[#111111] leading-relaxed">
            {phrases[displayIndex] || phrases[0]}
          </p>
          {isRecording && onNextPhrase && displayIndex < phrases.length - 1 && (
            <p className="text-xs text-slate-500 mt-2">Tap to advance</p>
          )}
        </div>

        {/* Next phrase (fading in from bottom) */}
        {displayIndex < phrases.length - 1 && (
          <div
            className={`absolute -bottom-16 left-0 right-0 text-center transition-all duration-500 ${
              isAnimating ? "opacity-100 translate-y-0" : "opacity-20 translate-y-[20px]"
            }`}
          >
            <p className="text-slate-400 text-base">{phrases[displayIndex + 1]}</p>
          </div>
        )}
      </div>
    </div>
  );
}
