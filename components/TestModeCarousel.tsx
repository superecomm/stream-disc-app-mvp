"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Video, Music, FileText } from "lucide-react";

type TestMode = {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: "mode" | "test";
  description?: string;
};

type TestModeCarouselProps = {
  currentMode: string;
  onModeChange: (modeId: string) => void;
};

const testModes: TestMode[] = [
  { id: "voice", label: "Voice", icon: <Mic className="w-3 h-3" />, type: "mode" },
  { id: "video", label: "Video", icon: <Video className="w-3 h-3" />, type: "mode" },
  { id: "solfege", label: "Solfege", icon: <Music className="w-3 h-3" />, type: "test" },
  { id: "script1", label: "Script 1", icon: <FileText className="w-3 h-3" />, type: "test" },
  { id: "script2", label: "Script 2", icon: <FileText className="w-3 h-3" />, type: "test" },
  { id: "script3", label: "Script 3", icon: <FileText className="w-3 h-3" />, type: "test" },
];

export function TestModeCarousel({ currentMode, onModeChange }: TestModeCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    // Scroll to center the active item above the record button
    const activeItem = itemRefs.current.get(currentMode);
    if (activeItem && carouselRef.current) {
      const container = carouselRef.current;
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        const containerRect = container.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        // Center the item in the viewport (accounting for padding)
        const scrollLeft = activeItem.offsetLeft - (containerRect.width / 2) + (itemRect.width / 2) - 32; // 32px = half of button width
        
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: hasScrolledRef.current ? "smooth" : "auto", // Instant on first load
        });
        hasScrolledRef.current = true;
      }, 50);
    }
  }, [currentMode]);

  return (
    <div className="relative my-3 w-full overflow-hidden">
      {/* Left gradient fade */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 30%, rgba(255, 255, 255, 0) 100%)",
        }}
      />
      
      {/* Right gradient fade */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 30%, rgba(255, 255, 255, 0) 100%)",
        }}
      />

      {/* Carousel Container - positioned to center active item above record button */}
      <div
        ref={carouselRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth relative"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          paddingLeft: "calc(50% - 32px)", // Center first item (64px button / 2)
          paddingRight: "calc(50% - 32px)", // Center last item
        }}
      >
        {testModes.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              ref={(el) => {
                if (el) itemRefs.current.set(mode.id, el);
              }}
              onClick={() => onModeChange(mode.id)}
              className={`
                flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg
                transition-all duration-300 flex-shrink-0
                ${
                  isActive
                    ? "bg-[#111111] text-white shadow-md"
                    : "bg-[#F7F7F8] text-[#111111] hover:bg-[#E5E7EB]"
                }
              `}
              style={{ 
                scrollSnapAlign: "center", 
                minWidth: "64px",
                maxWidth: "64px",
              }}
            >
              <div className={`transition-transform duration-300 ${isActive ? "scale-110" : "scale-100"}`}>
                {mode.icon}
              </div>
              <div className="text-center w-full">
                <div className={`text-[10px] font-medium leading-tight ${isActive ? "text-white" : "text-[#111111]"}`}>
                  {mode.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

