"use client";

import { Mic, Video } from "lucide-react";

type Mode = "voice" | "video";

type ModeCarouselProps = {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
};

export function ModeCarousel({ currentMode, onModeChange }: ModeCarouselProps) {
  const modes: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: "voice", label: "Voice", icon: <Mic className="w-4 h-4" /> },
    { id: "video", label: "Video", icon: <Video className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
            ${
              currentMode === mode.id
                ? "bg-[#111111] text-white shadow-md"
                : "bg-[#F7F7F8] text-[#111111] hover:bg-[#E5E7EB]"
            }
          `}
        >
          {mode.icon}
          {mode.label}
        </button>
      ))}
    </div>
  );
}

