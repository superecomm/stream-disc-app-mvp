"use client";

interface VIIMInfoProps {
  visible: boolean;
}

export function VIIMInfo({ visible }: VIIMInfoProps) {
  if (!visible) return null;

  return (
    <div className="animate-fade-in px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Stream Disc - Voice Identification Intelligence Model (VIIM)
      </h1>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Simple Definition</h2>
      <p className="text-gray-600 leading-relaxed">
        <strong>VIIM is Stream Disc's core AI engine that</strong> enables intelligent voice identification and natural language understanding. It combines advanced speech recognition, voiceprint analysis, and conversational AI to provide a seamless voice-first experience.
      </p>
    </div>
  );
}

