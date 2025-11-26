"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface VIIMPromptProps {
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function VIIMPrompt({
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
}: VIIMPromptProps) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !disabled) {
      onSubmit(prompt.trim());
      setPrompt("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl mx-auto px-4 pb-4 transition-all duration-300"
    >
      <div className="relative flex items-end gap-2 bg-white border border-gray-200 rounded-lg shadow-sm focus-within:border-gray-400 focus-within:shadow-md transition-all">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border-0 focus:ring-0 focus:outline-none px-4 py-3 text-sm text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
          style={{ maxHeight: "200px", overflowY: "auto" }}
        />
        <button
          type="submit"
          disabled={!prompt.trim() || disabled}
          className="m-2 p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

