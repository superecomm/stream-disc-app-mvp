"use client";

import { useEffect, useState } from "react";

type StatusModalProps = {
  isVisible: boolean;
  messages: string[];
  onComplete: () => void;
};

export function StatusModal({ isVisible, messages, onComplete }: StatusModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < messages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setTimeout(() => {
            onComplete();
          }, 500);
          return prev;
        }
      });
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isVisible, messages.length, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-24 left-1/2 transform -translate-x-1/2
        bg-white rounded-lg shadow-xl border border-[#E5E7EB]
        px-4 py-3 min-w-[200px] max-w-[90%]
        transition-all duration-300
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      <p className="text-sm text-[#111111] text-center mb-2">
        {messages[currentStep] || messages[messages.length - 1]}
      </p>
      
      {/* Sweeping progress bar */}
      <div className="w-full h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#111111] rounded-full transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

