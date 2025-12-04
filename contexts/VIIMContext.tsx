"use client";

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";

export type ViimState = "idle" | "listening" | "speaking" | "recording" | "processing";

export type ConversationEntry = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  model?: string;
};

interface ViimContextType {
  state: ViimState;
  setState: (state: ViimState) => void;
  lastTranscript: string;
  setLastTranscript: (transcript: string) => void;
  lastPrompt: string;
  setLastPrompt: (prompt: string) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  audioBuffers: Blob[];
  addAudioBuffer: (buffer: Blob) => void;
  clearAudioBuffers: () => void;
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  inputMode: "voice" | "text";
  setInputMode: (mode: "voice" | "text") => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  isActivated: boolean; // Track if box has been activated (transformed)
  setIsActivated: (activated: boolean) => void;
  showGreeting: boolean; // Track if greeting should be shown
  setShowGreeting: (show: boolean) => void;
  showInfo: boolean; // Track if VIIM info should be shown
  setShowInfo: (show: boolean) => void;
  conversationHistory: ConversationEntry[];
  addConversationEntry: (entry: ConversationEntry) => void;
  clearConversationHistory: () => void;
  preferences: {
    autoAdvance: boolean;
    showTranscript: boolean;
  };
  setPreferences: (prefs: Partial<ViimContextType["preferences"]>) => void;
}

const ViimContext = createContext<ViimContextType | undefined>(undefined);

export function ViimProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ViimState>("idle");
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-5.1");
  const [inputMode, setInputMode] = useState<"voice" | "text">("text");
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("viim:conversationHistory");
      return raw ? (JSON.parse(raw) as ConversationEntry[]) : [];
    } catch {
      return [];
    }
  });
  const audioBuffersRef = useRef<Blob[]>([]);
  const [preferences, setPreferencesState] = useState({
    autoAdvance: true,
    showTranscript: true,
  });

  const addAudioBuffer = (buffer: Blob) => {
    audioBuffersRef.current.push(buffer);
  };

  const clearAudioBuffers = () => {
    audioBuffersRef.current = [];
  };

  const addConversationEntry = (entry: ConversationEntry) => {
    setConversationHistory((prev) => [...prev, entry]);
  };

  const clearConversationHistory = () => {
    setConversationHistory([]);
  };

  const setPreferences = (prefs: Partial<ViimContextType["preferences"]>) => {
    setPreferencesState((prev) => ({ ...prev, ...prefs }));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("viim:conversationHistory", JSON.stringify(conversationHistory));
    } catch {
      // ignore write errors
    }
  }, [conversationHistory]);

  return (
    <ViimContext.Provider
      value={{
        state,
        setState,
        lastTranscript,
        setLastTranscript,
        lastPrompt,
        setLastPrompt,
        isRecording,
        setIsRecording,
        isProcessing,
        setIsProcessing,
        selectedModel,
        setSelectedModel,
        inputMode,
        setInputMode,
        isListening,
        setIsListening,
        isActivated,
        setIsActivated,
        showGreeting,
        setShowGreeting,
        showInfo,
        setShowInfo,
        conversationHistory,
        addConversationEntry,
        clearConversationHistory,
        audioBuffers: audioBuffersRef.current,
        addAudioBuffer,
        clearAudioBuffers,
        preferences,
        setPreferences,
      }}
    >
      {children}
    </ViimContext.Provider>
  );
}

export function useViim() {
  const context = useContext(ViimContext);
  if (context === undefined) {
    throw new Error("useViim must be used within a ViimProvider");
  }
  return context;
}

