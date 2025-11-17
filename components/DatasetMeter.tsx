"use client";

import { useEffect, useState } from "react";

type DatasetMeterProps = {
  completion: number; // 0-100
  onClick: () => void;
};

export function DatasetMeter({ completion, onClick }: DatasetMeterProps) {
  const [animatedCompletion, setAnimatedCompletion] = useState(0);

  useEffect(() => {
    // Animate to the actual completion value
    const timer = setTimeout(() => {
      setAnimatedCompletion(completion);
    }, 100);
    return () => clearTimeout(timer);
  }, [completion]);

  const circumference = 2 * Math.PI * 18; // radius of 18 (for 36px circle)
  const offset = circumference - (animatedCompletion / 100) * circumference;

  return (
    <button
      onClick={onClick}
      className="relative w-10 h-10 rounded-full bg-[#F7F7F8] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors group"
      aria-label="Dataset progress"
    >
      {/* Progress ring */}
      <svg className="absolute inset-0 w-10 h-10 transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="2"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#111111"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
          strokeLinecap="round"
        />
      </svg>

      {/* Center: Show + if 0%, otherwise show percentage */}
      {animatedCompletion === 0 ? (
        <span className="text-[#111111] text-xl font-light relative z-10">+</span>
      ) : (
        <span className="text-[10px] font-medium text-[#111111] relative z-10">
          {Math.round(animatedCompletion)}%
        </span>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#111111] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {animatedCompletion === 0 
          ? "Create new dataset" 
          : `Dataset: ${Math.round(animatedCompletion)}% complete`}
      </div>
    </button>
  );
}

