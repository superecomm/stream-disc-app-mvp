"use client";

import { useState, useEffect, useRef } from "react";
import VIIMAnimation from "./VIIMAnimation";
import { useVIIMRecorder } from "./VIIMRecorder";
import { useViim } from "@/contexts/VIIMContext";
import type { ViimState } from "@/contexts/VIIMContext";
import { GreetingBubble } from "./GreetingBubble";
import { VIIMInfo } from "./VIIMInfo";
import { ActiveIndicator } from "./ActiveIndicator";
import { llmModels, getModelById } from "@/lib/models/modelRegistry";
import { Send, Plus, Camera, Image, Globe, BookOpen, PenSquare, ShoppingBag, Paperclip, Bot } from "lucide-react";
import { processWhisper } from "@/lib/models/whisper";
import {
  processGPT,
  processGPTCode,
  processClaude,
  processSonnet,
  processGemini,
  processGrok,
  processCursor,
} from "@/lib/models/llmModels";
import { processElevenLabs, processSuno, processHume, processRunway } from "@/lib/models/audioModels";
import { MobileKeyboardMock } from "@/components/mobile/MobileKeyboardMock";

interface NeuralBoxProps {
  audioDeviceId?: string;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  className?: string;
  variant?: "assistant" | "capture";
  onAudioCapture?: (audioBlob: Blob) => Promise<void> | void;
  onStateChange?: (state: ViimState) => void;
  showInputPanel?: boolean;
  forcePromptVisible?: boolean;
  showKeyboardMock?: boolean;
}

export function NeuralBox({
  audioDeviceId,
  onTranscript,
  onResponse,
  className = "",
  variant = "assistant",
  onAudioCapture,
  onStateChange,
  showInputPanel = true,
  forcePromptVisible = false,
  showKeyboardMock = false,
}: NeuralBoxProps) {
  const {
    state,
    setState,
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
    setLastTranscript,
    setLastPrompt,
    addConversationEntry,
  } = useViim();

  const [textInput, setTextInput] = useState("");
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [hasActivatedOnce, setHasActivatedOnce] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [isKeyboardMockVisible, setIsKeyboardMockVisible] = useState(showKeyboardMock);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  const createConversationEntry = (role: "user" | "assistant", content: string) => ({
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${role}-${Date.now()}-${Math.random()}`,
    role,
    content,
    timestamp: Date.now(),
    model: selectedModel,
  });

  // The model roster mirrors the LLM picker from the Cursor mock
  const availableModels = llmModels;
  const currentModel = getModelById(selectedModel) || availableModels[0];

  // Audio recording setup
  const { isRecording, startRecording, stopRecording, getAudioStream } = useVIIMRecorder({
    audioDeviceId,
    onStreamReady: (stream) => {
      if (stream) {
        setState("listening");
        setIsListening(true);
      }
    },
    onAudioData: async (audioBlob) => {
      setIsListening(false);
      setState("processing");

      if (onAudioCapture) {
        try {
          await onAudioCapture(audioBlob);
        } catch (error) {
          console.error("NeuralBox capture handler error:", error);
        }
      }

      if (variant === "capture") {
        setState("idle");
        return;
      }
      
      // Process audio by transcribing then routing to the chosen LLM
      try {
        const transcription = await processWhisper(audioBlob);

        if (transcription.text) {
          const trimmedTranscript = transcription.text.trim();
          setLastTranscript(trimmedTranscript);
          onTranscript?.(trimmedTranscript);
          if (trimmedTranscript) {
            addConversationEntry(createConversationEntry("user", trimmedTranscript));
          }
          
          // Get LLM response
          const llmResponse = await processLLM(selectedModel, transcription.text);
          if (llmResponse) {
            setState("speaking");
            addConversationEntry(createConversationEntry("assistant", llmResponse));
            onResponse?.(llmResponse);
            setTimeout(() => setState("idle"), 3000);
          } else {
            setState("idle");
          }
        } else {
          setState("idle");
        }
      } catch (error) {
        console.error("Error processing audio:", error);
        setState("idle");
      }
    },
    onError: (error) => {
      console.error("Recording error:", error);
      setState("idle");
      setIsListening(false);
    },
  });

  // Process LLM response
  const processLLM = async (modelId: string, text: string): Promise<string | null> => {
    try {
      switch (modelId) {
        case "gpt-5.1":
          return (await processGPT(text)).text || null;
        case "gpt-5.1-code":
          return (await processGPTCode(text)).text || null;
        case "sonnet-4.5":
          return (await processSonnet(text)).text || null;
        case "claude-3.5":
          return (await processClaude(text)).text || null;
        case "gemini-3-pro":
          return (await processGemini(text)).text || null;
        case "grok-3":
          return (await processGrok(text)).text || null;
        case "cursor-max":
          return (await processCursor(text)).text || null;
        case "elevenlabs":
          return (await processElevenLabs(text)).text || null;
        case "suno":
          return (await processSuno(text)).text || null;
        case "hume":
          return (await processHume(text)).text || null;
        case "runway":
          return (await processRunway(text)).text || null;
        default:
          return (await processGPT(text)).text || null;
      }
    } catch (error) {
      console.error("Error processing LLM:", error);
      return null;
    }
  };

  // Handle NeuralBox activation (tap on idle box)
  const handleActivate = async () => {
    if (!isActivated && state === "idle") {
      setIsActivated(true);
      setHasActivatedOnce(true);
      setShowGreeting(true);
      
      // Auto-start voice recording if in voice mode, or focus text input
      setTimeout(async () => {
        if (inputMode === "voice") {
          try {
            await startRecording();
            // Set recording state after a brief delay to ensure stream is ready
            setTimeout(() => {
              if (isRecording) {
                setState("recording");
              }
            }, 100);
          } catch (error) {
            console.error("Failed to start recording:", error);
          }
        } else if (inputMode === "text") {
          textareaRef.current?.focus();
        }
      }, 600);
    }
  };

  // Sync recording state with isRecording from recorder
  useEffect(() => {
    if (isRecording && state !== "recording") {
      setState("recording");
    } else if (!isRecording && state === "recording") {
      // Don't auto-change state here, let onAudioData handle it
    }
  }, [isRecording, state]);

  // Handle text input submit
  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textInput.trim() || isProcessingInput) return;

    setIsProcessingInput(true);
    setState("processing");
    const trimmedInput = textInput.trim();
    setLastPrompt(trimmedInput);
    addConversationEntry(createConversationEntry("user", trimmedInput));

    try {
      const response = await processLLM(selectedModel, trimmedInput);
      if (response) {
        setState("speaking");
        addConversationEntry(createConversationEntry("assistant", response));
        onResponse?.(response);
        setTextInput("");
        setTimeout(() => {
          setState("idle");
          setIsProcessingInput(false);
        }, 3000);
      } else {
        setState("idle");
        setIsProcessingInput(false);
      }
    } catch (error) {
      console.error("Error processing text:", error);
      setState("idle");
      setIsProcessingInput(false);
    }
  };

  const handlePrimaryButtonClick = async () => {
    if (inputMode === "voice") {
      if (state === "recording") {
        stopRecording();
      } else if (state !== "processing") {
        try {
          await startRecording();
          setTimeout(() => {
            setState("recording");
          }, 120);
        } catch (error) {
          console.error("Failed to start recording:", error);
        }
      }
    } else {
      if (!textInput.trim() || isProcessingInput || state === "processing") return;
      handleTextSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textInput]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && inputMode === "text" && textInput.trim()) {
        e.preventDefault();
        handleTextSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [textInput, inputMode]);

  // Show info after greeting
  useEffect(() => {
    if (showGreeting) {
      const timer = setTimeout(() => {
        setShowInfo(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showGreeting]);

  // Surface internal state changes to parent components
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  useEffect(() => {
    setIsKeyboardMockVisible(showKeyboardMock || isPlusMenuOpen);
  }, [showKeyboardMock, isPlusMenuOpen]);

  const isVoiceMode = inputMode === "voice";
  const canSendText = Boolean(textInput.trim());
  const primaryButtonDisabled = isVoiceMode
    ? state === "processing" || isProcessingInput
    : !canSendText || isProcessingInput || state === "processing";
  const isActive = state === "listening" || state === "recording" || state === "processing";
  const promptVisible = forcePromptVisible || isActivated;

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-4 pt-4 pb-24 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">

          {/* Greeting Bubble */}
          {isActivated && <GreetingBubble visible={showGreeting} />}

          {!hasActivatedOnce ? (
            <div onClick={handleActivate} className="cursor-pointer flex flex-col items-center justify-center py-6">
              <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] flex items-center justify-center">
                <VIIMAnimation state="idle" size="sm" container="square" visualStyle="particles" audioStream={null} />
              </div>
              <p className="text-center text-gray-500 text-sm mt-6 px-4 max-w-md">
                Tap to launch the neural block. It will dock near the prompt bar after activation.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Input Field (Transformed Box) */}
      {showInputPanel && (
        <div
          ref={inputContainerRef}
          className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-500 ease-in-out z-30 ${
            promptVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          } safe-area-inset-bottom`}
        >
          <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
            <div className="h-2" />
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isVoiceMode ? "Voice mode active" : "What up?"}
                  disabled={isVoiceMode || isProcessingInput || state === "processing"}
                  rows={1}
                  className="w-full resize-none border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/40 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 [&::-webkit-scrollbar]:hidden pr-16"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isVoiceMode) {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                />
                <div className="pointer-events-auto absolute bottom-1.5 right-3 flex items-center gap-2.5 text-[11px] font-semibold text-gray-500">
                  <button
                    className="rounded-full p-1.5 text-gray-500 hover:text-gray-900 transition touch-manipulation"
                    aria-label="Add tool"
                    onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-full p-1.5 text-gray-500 hover:text-gray-900 transition touch-manipulation"
                    aria-label="Camera"
                    onClick={() => setIsPlusMenuOpen(true)}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-full p-1.5 text-gray-500 hover:text-gray-900 transition touch-manipulation"
                    aria-label="Photos"
                    onClick={() => setIsPlusMenuOpen(true)}
                  >
                    <Image className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={handlePrimaryButtonClick}
                disabled={primaryButtonDisabled}
                className={`flex flex-col items-center gap-1 rounded-3xl px-2 py-1 transition ${
                  primaryButtonDisabled ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.02]"
                }`}
              >
                <div className="relative w-6 h-6 rounded-full bg-black flex items-center justify-center shadow-lg">
                  <VIIMAnimation
                    state={state}
                    size="xxs"
                    container="square"
                    visualStyle="particles"
                    audioStream={getAudioStream()}
                  />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {isVoiceMode ? (state === "recording" ? "Stop" : "Speak") : "Send"}
                </span>
              </button>
            </div>
            {isPlusMenuOpen && !isKeyboardMockVisible && (
                <div className="rounded-t-3xl bg-white/95 px-4 pb-6 pt-5 shadow-[0_-20px_35px_rgba(15,23,42,0.15)] border-t">
                  <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Camera, label: "Camera" },
                      { icon: Image, label: "Photos" },
                      { icon: PenSquare, label: "Create image" },
                      { icon: BookOpen, label: "Deep research" },
                      { icon: Globe, label: "Web search" },
                      { icon: BookOpen, label: "Study & learn" },
                      { icon: Bot, label: "Agent mode" },
                      { icon: Paperclip, label: "Add files" },
                      { icon: ShoppingBag, label: "Shopping" },
                    ].map((action) => {
                      const Icon = action.icon;
                      return (
                        <button key={action.label} className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-4 text-xs font-semibold text-gray-700">
                          <Icon className="h-5 w-5 text-gray-900" />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                    <span>Input mode</span>
                    <div className="inline-flex rounded-full bg-white p-1 text-xs font-semibold text-gray-500">
                      <button
                        onClick={() => setInputMode("text")}
                        className={`px-3 py-1 rounded-full transition ${
                          !isVoiceMode ? "bg-black text-white shadow" : "text-gray-500"
                        }`}
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => setInputMode("voice")}
                        className={`px-3 py-1 rounded-full transition ${
                          isVoiceMode ? "bg-black text-white shadow" : "text-gray-500"
                        }`}
                      >
                        Voice
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <MobileKeyboardMock />
                  </div>
                </div>
            )}
            {isKeyboardMockVisible && !isPlusMenuOpen && <MobileKeyboardMock />}
          </div>
        </div>
      )}

      {/* Active Indicator (Glowing Red Box) */}
      <ActiveIndicator active={isActive} />
    </div>
  );
}
