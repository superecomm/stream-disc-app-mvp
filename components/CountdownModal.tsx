"use client";

import { useState, useEffect } from "react";

type CountdownModalProps = {
  isVisible: boolean;
  onComplete: () => void;
  onCancel?: () => void;
};

export function CountdownModal({ isVisible, onComplete, onCancel }: CountdownModalProps) {
  const [count, setCount] = useState(3);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setCount(3);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="relative">
        {/* Countdown Circle */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer ring animation */}
          <svg className="absolute inset-0 w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2"
            />
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeDasharray={377}
              strokeDashoffset={377 - (377 * (4 - count) / 3)}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>

          {/* Number */}
          <div
            className={`
              text-6xl font-bold text-white
              transition-all duration-300
              ${isAnimating ? "scale-110 opacity-100" : "scale-50 opacity-0"}
            `}
            key={count}
          >
            {count > 0 ? count : "GO"}
          </div>
        </div>

        {/* Instructions */}
        {count > 0 && (
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-white text-sm font-medium">Get ready...</p>
          </div>
        )}

        {/* Cancel button */}
        {onCancel && count > 0 && (
          <button
            onClick={onCancel}
            className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 text-white/70 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

