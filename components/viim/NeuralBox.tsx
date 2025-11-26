"use client";

import { useState, useEffect, useRef } from "react";
import VIIMAnimation from "./VIIMAnimation";
import { useVIIMRecorder } from "./VIIMRecorder";
import { useViim } from "@/contexts/VIIMContext";
import { GreetingBubble } from "./GreetingBubble";
import { VIIMInfo } from "./VIIMInfo";
import { ActiveIndicator } from "./ActiveIndicator";
import { allModels, getModelsForMode, getModelById } from "@/lib/models/modelRegistry";
import { Mic, Send, Square } from "lucide-react";
import { processWhisper } from "@/lib/models/whisper";
import { processWav2vec } from "@/lib/models/wav2vec";
import { processHubert } from "@/lib/models/hubert";
import { processEncodec } from "@/lib/models/encodec";
import { processConformer } from "@/lib/models/conformer";
import { processGPT, processClaude } from "@/lib/models/llmModels";
import { processElevenLabs, processSuno, processHume, processRunway } from "@/lib/models/audioModels";

interface NeuralBoxProps {
  audioDeviceId?: string;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  className?: string;
}

export function NeuralBox({
  audioDeviceId,
  onTranscript,
  onResponse,
  className = "",
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
  } = useViim();

  const [textInput, setTextInput] = useState("");
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Get available models based on current input mode
  const availableModels = getModelsForMode(inputMode);
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
      
      // Process audio with selected model
      try {
        let response;
        switch (selectedModel) {
          case "whisper":
            response = await processWhisper(audioBlob);
            break;
          case "wav2vec":
            response = await processWav2vec(audioBlob);
            break;
          case "hubert":
            response = await processHubert(audioBlob);
            break;
          case "encodec":
            response = await processEncodec(audioBlob);
            break;
          case "conformer":
            response = await processConformer(audioBlob);
            break;
          default:
            response = await processWhisper(audioBlob);
        }

        if (response.text) {
          setLastTranscript(response.text);
          onTranscript?.(response.text);
          
          // Get LLM response
          const llmResponse = await processLLM(response.text);
          if (llmResponse) {
            setState("speaking");
            onResponse?.(llmResponse);
            setTimeout(() => setState("idle"), 3000);
          } else {
            setState("idle");
          }
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
  const processLLM = async (text: string): Promise<string | null> => {
    try {
      switch (selectedModel) {
        case "gpt-5.1":
          const gptResponse = await processGPT(text);
          return gptResponse.text || null;
        case "claude-3.5":
          const claudeResponse = await processClaude(text);
          return claudeResponse.text || null;
        case "elevenlabs":
          const elevenResponse = await processElevenLabs(text);
          return elevenResponse.text || null;
        case "suno":
          const sunoResponse = await processSuno(text);
          return sunoResponse.text || null;
        case "hume":
          const humeResponse = await processHume(text);
          return humeResponse.text || null;
        case "runway":
          const runwayResponse = await processRunway(text);
          return runwayResponse.text || null;
        default:
          return null;
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

  // Handle NeuralBox tap when activated (for voice mode)
  const handleNeuralBoxClick = async () => {
    if (isActivated) {
      if (inputMode === "voice") {
        if (state === "idle" || state === "listening") {
          try {
            await startRecording();
            // Set recording state after a brief delay
            setTimeout(() => {
              if (isRecording) {
                setState("recording");
              }
            }, 100);
          } catch (error) {
            console.error("Failed to start recording:", error);
          }
        } else if (state === "recording") {
          stopRecording();
          setState("idle");
        }
      }
    } else {
      handleActivate();
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
    setLastPrompt(textInput);

    try {
      const response = await processLLM(textInput);
      if (response) {
        setState("speaking");
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

  const isActive = state === "listening" || state === "recording" || state === "processing";

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-24 overflow-y-auto">
        {/* Greeting Bubble */}
        {isActivated && <GreetingBubble visible={showGreeting} />}

        {/* VIIM Info Display */}
        {isActivated && <VIIMInfo visible={showInfo} />}

        {/* Idle State: Large Black Square with Constellation Animation */}
        {!isActivated && (
          <div
            onClick={handleActivate}
            className="cursor-pointer transition-all duration-300 touch-manipulation w-full flex flex-col items-center justify-center"
          >
            <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] md:w-[380px] md:h-[380px] flex items-center justify-center">
              <VIIMAnimation
                state="idle"
                size="sm"
                container="square"
                visualStyle="particles"
                audioStream={null}
              />
            </div>
            <p className="text-center text-gray-500 text-sm mt-4 px-4">
              {state === "idle" ? "idle state of launch" : "launch in idle state"}
            </p>
            <p className="text-center text-gray-400 text-xs mt-2 px-4 max-w-md mx-auto">
              User taps the box, or the box speaks after launched by voice activation
            </p>
          </div>
        )}

        {/* Activated State: Animation Display (if needed) */}
        {isActivated && (state === "listening" || state === "recording" || state === "speaking" || state === "processing") && (
          <div className="my-8">
            <VIIMAnimation
              state={state}
              size="md"
              container="square"
              visualStyle="particles"
              audioStream={getAudioStream()}
            />
          </div>
        )}
      </div>

      {/* Bottom Input Field (Transformed Box) */}
      <div
        ref={inputContainerRef}
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-500 ease-in-out z-30 ${
          isActivated
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        } safe-area-inset-bottom`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ask anything"
                disabled={isProcessingInput || state === "processing" || inputMode === "voice"}
                rows={1}
                className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                style={{ maxHeight: "120px", overflowY: "auto" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                  }
                }}
              />
              {/* Voice/Text Toggle Icons */}
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const newMode = inputMode === "voice" ? "text" : "voice";
                    setInputMode(newMode);
                    if (newMode === "text") {
                      setTimeout(() => textareaRef.current?.focus(), 100);
                    } else if (newMode === "voice" && state === "idle") {
                      await startRecording();
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    inputMode === "voice" && (state === "listening" || state === "recording")
                      ? "bg-red-500 text-white animate-pulse"
                      : inputMode === "voice"
                      ? "bg-red-500/80 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  aria-label={inputMode === "voice" ? "Switch to text" : "Switch to voice"}
                >
                  <Mic className="w-4 h-4" />
                </button>
                {inputMode === "text" && (
                  <button
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim() || isProcessingInput || state === "processing"}
                    className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Indicator (Glowing Red Box) */}
      <ActiveIndicator active={isActive} />
    </div>
  );
}
