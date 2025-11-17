"use client";

import { useState } from "react";
import { X, Music, Mic, ArrowRight } from "lucide-react";

type OnboardingModalProps = {
  isOpen: boolean;
  onComplete: () => void;
  onStart: () => void;
};

export function OnboardingModal({ isOpen, onComplete, onStart }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to VoiceLock™",
      content: (
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#111111] flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-center text-slate-600">
            Let's create your unique voice signature. We'll start with a musical test that captures your voice's unique characteristics.
          </p>
        </div>
      ),
    },
    {
      title: "The Solfege Test",
      content: (
        <div className="space-y-4">
          <div className="bg-[#F7F7F8] rounded-lg p-4">
            <p className="text-2xl font-bold text-center text-[#111111] mb-2">
              Do Re Mi Fa So La Ti Do
            </p>
            <p className="text-sm text-slate-500 text-center">
              Sing or speak the musical scale
            </p>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p className="font-semibold text-[#111111]">Why Solfege?</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Captures your pitch and tone</li>
              <li>Reveals vowel shaping patterns</li>
              <li>Shows your natural voice movement</li>
              <li>Helps detect authenticity</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Ready to Start?",
      content: (
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#111111] flex items-center justify-center">
              <Mic className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-center text-slate-600">
            When you're ready, we'll record you singing or speaking the Solfege scale. Take your time and be natural!
          </p>
          <div className="bg-[#F7F7F8] rounded-lg p-4 mt-4">
            <p className="text-xs text-slate-500 text-center">
              Tip: Sing it like you're warming up your voice, or speak it naturally. Both work!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onStart();
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index <= step ? "bg-[#111111] w-8" : "bg-[#E5E7EB] w-1.5"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-slate-500 hover:text-[#111111] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#111111] mb-4">
            {steps[step].title}
          </h2>
          {steps[step].content}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-4 py-2 bg-white border border-[#E5E7EB] text-[#111111] rounded-md hover:bg-[#F7F7F8] transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 bg-[#111111] text-white rounded-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            {step < steps.length - 1 ? (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Start Recording
                <Mic className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

