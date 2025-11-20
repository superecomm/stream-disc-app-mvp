"use client";

import { useEffect, useState, useRef } from "react";
import { ChatMessage } from "./ChatMessage";

type VoiceTranscriptionProps = {
  audioStream: MediaStream | null;
  isRecording: boolean;
  onTranscriptComplete?: (transcript: string, audioBlob: Blob) => void;
};

type Message = {
  id: string;
  transcript: string;
  audioBlob?: Blob;
  timestamp: Date;
};

export function VoiceTranscription({ audioStream, isRecording, onTranscriptComplete }: VoiceTranscriptionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const interimTranscriptRef = useRef<string>("");
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const currentMessageStartTimeRef = useRef<Date | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageAudioChunksRef = useRef<Blob[]>([]);
  const messageStartTimeRef = useRef<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageIdCounterRef = useRef<number>(0);

  // Initialize media recorder for continuous audio capture
  useEffect(() => {
    if (isRecording && audioStream) {
      try {
        const recorder = new MediaRecorder(audioStream, {
          mimeType: "audio/webm;codecs=opus",
        });
        
        audioChunksRef.current = [];
        messageAudioChunksRef.current = [];
        messageStartTimeRef.current = new Date();
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            messageAudioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorderRef.current = recorder;
        recorder.start(100); // Collect data every 100ms for better responsiveness
      } catch (error) {
        console.error("Error initializing media recorder:", error);
      }
    } else {
      // Stop recording when not recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    }
  }, [isRecording, audioStream]);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser");
      return;
    }

    if (isRecording && audioStream) {
      // Initialize speech recognition with optimized settings
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1; // Faster processing
      
      // Improve performance - don't wait too long for results
      // Note: These properties may not be available in all browsers
      if ('serviceURI' in recognition) {
        (recognition as any).serviceURI = undefined; // Use default service
      }
      
      // Use grammars for better accuracy (optional, can be removed if causing issues)
      // recognition.grammars = null;

      recognition.onstart = () => {
        setIsListening(true);
        console.log("Speech recognition started");
        if (!currentMessageStartTimeRef.current) {
          currentMessageStartTimeRef.current = new Date();
        }
      };

      recognition.onresult = (event: any) => {
        // Clear silence timer when we get results
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        let interimTranscript = "";
        let finalTranscript = "";

        // Process all results from the current index
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        interimTranscriptRef.current = interimTranscript;
        
        if (finalTranscript) {
          // Just accumulate the transcript - don't finalize messages during recording
          // This keeps the recording continuous without breaking it up
          setCurrentTranscript((prev) => {
            return (prev + finalTranscript).trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          // This is normal, don't show error
          return;
        }
        if (event.error === "not-allowed") {
          alert("Microphone permission denied. Please allow microphone access.");
        } else if (event.error === "aborted") {
          // Recognition was stopped, this is normal
          return;
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Restart recognition if still recording (with a small delay to avoid rapid restarts)
        if (isRecording && audioStream) {
          setTimeout(() => {
            try {
              if (recognitionRef.current) {
                recognitionRef.current.start();
              }
            } catch (error) {
              // If already started, ignore the error
              if ((error as Error).message && !(error as Error).message.includes("already started")) {
                console.error("Error restarting recognition:", error);
              }
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;

      // Start recognition
      try {
        recognition.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }

      return () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (error) {
            console.error("Error stopping recognition:", error);
          }
        }
        setIsListening(false);
      };
    } else {
      // Stop recognition when not recording
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
        recognitionRef.current = null;
      }
      setIsListening(false);
    }
  }, [isRecording, audioStream, onTranscriptComplete]);

  // Finalize and save message when recording stops
  // Use a ref to track if we've already finalized to prevent duplicates
  const finalizedRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (!isRecording && currentTranscript.trim() && !finalizedRef.current) {
      finalizedRef.current = true; // Prevent duplicate finalization
      
      const messageAudioBlob = messageAudioChunksRef.current.length > 0
        ? new Blob([...messageAudioChunksRef.current], { type: "audio/webm;codecs=opus" })
        : undefined;
      
      if (messageAudioBlob) {
        // Generate unique message ID
        messageIdCounterRef.current += 1;
        const messageId = `msg_${Date.now()}_${messageIdCounterRef.current}_${Math.random().toString(36).substr(2, 9)}`;
        const message: Message = {
          id: messageId,
          transcript: currentTranscript.trim(),
          audioBlob: messageAudioBlob,
          timestamp: messageStartTimeRef.current || new Date(),
        };
        
        // Check for duplicates before adding
        setMessages((prev) => {
          // Prevent duplicate messages with same transcript and timestamp
          const isDuplicate = prev.some(
            (m) => m.transcript === message.transcript && 
                   Math.abs(m.timestamp.getTime() - message.timestamp.getTime()) < 1000
          );
          if (isDuplicate) {
            return prev;
          }
          return [...prev, message];
        });
        
        if (onTranscriptComplete) {
          onTranscriptComplete(currentTranscript.trim(), messageAudioBlob);
        }
      }
    } else if (isRecording) {
      // Reset finalized flag when recording starts
      finalizedRef.current = false;
    }
  }, [isRecording, currentTranscript, onTranscriptComplete]);

  // Reset when recording stops
  useEffect(() => {
    if (!isRecording) {
      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      // Don't clear transcript or audio chunks immediately - let the final save happen
      // Only clear after a delay to ensure final message is saved
      setTimeout(() => {
        setCurrentTranscript("");
        interimTranscriptRef.current = "";
        currentMessageStartTimeRef.current = null;
        messageStartTimeRef.current = null;
        messageAudioChunksRef.current = [];
        messageIdCounterRef.current = 0;
        finalizedRef.current = false;
      }, 1000);
    } else {
      // Reset finalized flag when recording starts
      finalizedRef.current = false;
    }
  }, [isRecording]);

  const displayText = currentTranscript + interimTranscriptRef.current;

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayText]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Chat Messages - Centered on desktop */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-1">
          {messages.length === 0 && !isRecording && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-slate-400 text-lg">Ready to start recording</p>
                <p className="text-slate-500 text-sm mt-2">Select voice mode and tap the record button</p>
              </div>
            </div>
          )}
        
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            transcript={message.transcript}
            audioBlob={message.audioBlob}
            timestamp={message.timestamp}
            isUser={true}
          />
        ))}
        
        {/* Current recording message */}
        {isRecording && displayText && (
          <div className="flex gap-3 justify-end mb-4">
            <div className="flex flex-col items-end max-w-[80%]">
              <div className="rounded-2xl px-4 py-3 bg-[#111111] text-white rounded-br-md">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {currentTranscript && <span>{currentTranscript}</span>}
                  {interimTranscriptRef.current && (
                    <span className="opacity-60 italic">{interimTranscriptRef.current}</span>
                  )}
                </p>
              </div>
              {isListening && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-500">Listening...</span>
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">U</span>
            </div>
          </div>
        )}
        
        {isRecording && !displayText && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-slate-400 text-lg">Listening...</p>
              </div>
              <p className="text-slate-500 text-sm">Speak into your microphone              </p>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
