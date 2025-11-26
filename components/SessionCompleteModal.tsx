"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";

type SessionCompleteModalProps = {
  isOpen: boolean;
  phrasesCount: number;
  datasetCompletion: number;
  status: "not_started" | "mobile_enrolled" | "studio_verified";
  onClose: () => void;
  onNext: () => void;
  testType?: string | null; // Test type: "solfege", "script1", "script2", "script3", or null
};

type ProcessingStep = {
  label: string;
  completed: boolean;
};

export function SessionCompleteModal({
  isOpen,
  phrasesCount,
  datasetCompletion,
  status,
  onClose,
  onNext,
  testType,
}: SessionCompleteModalProps) {
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { label: "Saving audio sample…", completed: false },
    { label: "Updating dataset…", completed: false },
    { label: "Ready.", completed: false },
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Animate through processing steps
      const stepInterval = setInterval(() => {
        setProcessingSteps((prev) => {
          const newSteps = [...prev];
          if (currentStep < newSteps.length) {
            newSteps[currentStep].completed = true;
            setCurrentStep((prev) => prev + 1);
          }
          return newSteps;
        });
      }, 800);

      return () => clearInterval(stepInterval);
    } else {
      // Reset on close
      setProcessingSteps([
        { label: "Saving audio sample…", completed: false },
        { label: "Updating dataset…", completed: false },
        { label: "Ready.", completed: false },
      ]);
      setCurrentStep(0);
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  // Get mode-specific completion message
  const getCompletionMessage = () => {
    if (testType === "solfege") {
      return "Solfege Test Complete - Your voice sample has been added to your VIIM dataset.";
    } else if (testType === "script1" || testType === "script2" || testType === "script3") {
      return "Reading Session Complete - Your voice sample has been added to your VIIM dataset.";
    } else {
      return "Session Complete - Your voice sample has been added to your VIIM dataset.";
    }
  };

  const statusMessage =
    status === "mobile_enrolled"
      ? "Your dataset is in early-stage. For maximum protection, schedule a studio session with a VoiceLock partner."
      : status === "studio_verified"
      ? "Your dataset is complete and verified."
      : "Continue recording to build your voice profile.";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {processingSteps.map((step, index) => (
              <div key={index} className="flex-1 flex items-center">
                <div
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    step.completed ? "bg-green-500" : "bg-slate-200"
                  }`}
                />
                {index < processingSteps.length - 1 && (
                  <div className="w-2 h-2 rounded-full bg-slate-200 mx-1" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 text-center">
            {processingSteps[currentStep]?.label || "Ready."}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{getCompletionMessage()}</h3>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Phrases read:</span>
              <span className="font-medium text-slate-900">{phrasesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Dataset updated:</span>
              <span className="font-medium text-slate-900">now at {datasetCompletion}% complete</span>
            </div>
          </div>

          {/* Status message */}
          <div className="p-3 bg-slate-50 rounded-md">
            <p className="text-sm text-slate-600">{statusMessage}</p>
          </div>

          {/* Progress bar for dataset */}
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Dataset completion</span>
              <span>{datasetCompletion}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${datasetCompletion}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onNext}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Start next session
            </button>
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

