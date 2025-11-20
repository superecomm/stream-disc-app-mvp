"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

type ChatMessageProps = {
  transcript: string;
  audioBlob?: Blob;
  timestamp: Date;
  isUser?: boolean;
};

export function ChatMessage({ transcript, audioBlob, timestamp, isUser = true }: ChatMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#F7F7F8] flex items-center justify-center flex-shrink-0">
          <Volume2 className="w-4 h-4 text-[#111111]" />
        </div>
      )}
      
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-[#111111] text-white rounded-br-md"
              : "bg-[#F7F7F8] text-[#111111] rounded-bl-md"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
        </div>
        
        {audioBlob && audioUrl && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={togglePlayback}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F7F8] hover:bg-[#E5E7EB] transition-colors text-sm text-[#111111]"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play</span>
                </>
              )}
            </button>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />
          </div>
        )}
        
        <span className="text-xs text-slate-500 mt-1">{formatTime(timestamp)}</span>
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-medium">U</span>
        </div>
      )}
    </div>
  );
}

