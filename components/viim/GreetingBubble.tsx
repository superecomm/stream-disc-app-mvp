"use client";

interface GreetingBubbleProps {
  message?: string;
  visible: boolean;
}

export function GreetingBubble({ message = "Hello, how may I help?", visible }: GreetingBubbleProps) {
  if (!visible) return null;

  return (
    <div className="animate-fade-in mb-4 px-4">
      <div className="inline-block bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-[85%]">
        <p className="text-gray-900 text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

