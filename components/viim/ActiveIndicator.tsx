"use client";

interface ActiveIndicatorProps {
  active: boolean;
}

export function ActiveIndicator({ active }: ActiveIndicatorProps) {
  if (!active) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-red-500/90 rounded-lg px-6 py-3 shadow-lg shadow-red-500/50 animate-glow-pulse">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="w-16 h-1.5 bg-white/90 rounded-full" />
        </div>
      </div>
    </div>
  );
}

