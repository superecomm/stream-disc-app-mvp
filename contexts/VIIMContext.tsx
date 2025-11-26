"use client";

import { createContext, useContext, useState, useRef, ReactNode } from "react";

export type ViimState = "idle" | "listening" | "speaking" | "recording" | "processing";

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
  const [selectedModel, setSelectedModel] = useState<string>("whisper");
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
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

  const setPreferences = (prefs: Partial<ViimContextType["preferences"]>) => {
    setPreferencesState((prev) => ({ ...prev, ...prefs }));
  };

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

