"use client";

import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { NeuralBox } from "@/components/viim/NeuralBox";

export default function ViimRead() {
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | undefined>(undefined);

  return (
    <AuthGate>
      <div 
        className="flex min-h-screen flex-col relative overflow-hidden" 
        style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
      >
        {/* Header - ChatGPT 5.1 style */}
        <header className="w-full px-4 py-2.5 bg-white z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-base font-medium text-gray-900">ChatGPT 5.1</h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="font-medium">9:12</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-3 border border-gray-400 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-1.5 bg-gray-400 rounded-sm" />
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - NeuralBox */}
        <main className="flex-1 w-full relative">
          <NeuralBox
            audioDeviceId={selectedAudioDevice}
            onTranscript={(text) => {
              console.log("Transcript:", text);
            }}
            onResponse={(text) => {
              console.log("AI Response:", text);
            }}
          />
        </main>
      </div>
    </AuthGate>
  );
}
