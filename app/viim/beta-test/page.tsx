"use client";

import { useState, useRef, useEffect } from "react";
import { AuthGate } from "@/components/AuthGate";
import VIIMAnimation from "@/components/viim/VIIMAnimation";
import { useVIIMRecorder } from "@/components/viim/VIIMRecorder";
import { ProcessTerminal } from "@/components/viim/ProcessTerminal";
import { FingerprintHistory } from "@/components/viim/FingerprintHistory";
import { Fingerprint, Loader2, AlertCircle, CheckCircle2, UserPlus, Search, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type FingerprintState = "idle" | "recording" | "processing" | "complete";
type Mode = "enroll" | "identify" | "test";

interface ProcessLog {
  timestamp: Date;
  level: "info" | "success" | "error" | "warning";
  message: string;
}

interface FingerprintRecord {
  id: string;
  fingerprint: string;
  timestamp: Date;
  mlModel?: string | null;
  mlOutput?: any;
  confidence?: number;
  processingTime?: number;
  modelConnected?: boolean;
}

const HISTORY_STORAGE_KEY = "streamdisc_fingerprint_history";
const MAX_HISTORY = 50;

export default function BetaTestPage() {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState<Mode>("enroll");
  const [fingerprintState, setFingerprintState] = useState<FingerprintState>("idle");
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [mlOutput, setMlOutput] = useState<any>(null);
  const [modelConnected, setModelConnected] = useState<boolean | null>(null);
  const [mlModel, setMlModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processLogs, setProcessLogs] = useState<ProcessLog[]>([]);
  const [history, setHistory] = useState<FingerprintRecord[]>([]);
  
  // Enrollment state
  const [enrollmentProgress, setEnrollmentProgress] = useState({ sampleCount: 0, voiceprintId: null as string | null, status: "" });
  
  // Identification state
  const [identificationResults, setIdentificationResults] = useState<Array<{ userId: string; voiceprintId: string; similarity: number; match: boolean }> | null>(null);
  
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const historyWithDates = parsed.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
        }));
        setHistory(historyWithDates);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (record: FingerprintRecord) => {
    const newHistory = [record, ...history].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (err) {
      console.error("Failed to save history:", err);
    }
  };

  // Add log to process terminal
  const addLog = (level: ProcessLog["level"], message: string) => {
    setProcessLogs((prev) => [
      ...prev,
      { timestamp: new Date(), level, message },
    ]);
  };

  const { isRecording, startRecording, stopRecording, getAudioStream } = useVIIMRecorder({
    onStreamReady: (stream) => {
      audioStreamRef.current = stream;
      if (stream) {
        setFingerprintState("recording");
        setRecordingTime(0);
        addLog("info", "Microphone access granted");
        addLog("success", "Recording started");
        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      }
    },
    onAudioData: async (audioBlob) => {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
      setFingerprintState("processing");
      setError(null);
      addLog("info", "Recording stopped");
      addLog("info", `Audio blob size: ${(audioBlob.size / 1024).toFixed(2)} KB`);

      try {
        addLog("info", `Sending audio to backend for ${mode}...`);
        
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        
        if (mode === "enroll" && currentUser) {
          formData.append("userId", currentUser.uid);
        }

        const startTime = Date.now();
        const endpoint = 
          mode === "enroll" ? "/api/viim/enroll" :
          mode === "identify" ? "/api/viim/identify" :
          "/api/viim/fingerprint"; // test mode
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        addLog("info", `Backend response received (${Date.now() - startTime}ms)`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to ${mode}`);
        }

        const data = await response.json();
        
        if (mode === "test") {
          // Test mode - just show fingerprint and ML output
          addLog("info", "Processing audio with ML model...");
          if (data.modelConnected) {
            addLog("success", `Connected to ML model: ${data.mlModel || "speechbrain/spkrec-ecapa-voxceleb"}`);
            addLog("info", `Generated ${data.mlOutput?.embeddingDimensions || 0} dimensional embeddings`);
            setModelConnected(true);
            setMlModel(data.mlModel || "speechbrain/spkrec-ecapa-voxceleb");
            setMlOutput(data.mlOutput);
          } else {
            addLog("warning", "No ML model connection - using fallback");
            setModelConnected(false);
            setMlModel(null);
            setMlOutput(null);
          }
          addLog("success", `Fingerprint generated: ${data.fingerprint?.substring(0, 20)}...`);
          if (data.confidence) {
            addLog("info", `Confidence: ${(data.confidence * 100).toFixed(1)}%`);
          }
          addLog("success", `Processing complete in ${data.processingTime || 0}ms`);
          
          setFingerprint(data.fingerprint);
          setFingerprintState("complete");
        } else if (mode === "enroll") {
          // Enrollment flow
          addLog("info", "Processing audio with ML model for enrollment...");
          addLog("success", `Connected to ML model: ${data.mlModel || "speechbrain/spkrec-ecapa-voxceleb"}`);
          addLog("info", `Generated ${data.embedding?.length || 0} dimensional embeddings`);
          addLog("success", `Sample ${data.sampleCount}/5 recorded`);
          addLog("info", `Status: ${data.status}`);
          addLog("success", data.message);
          
          setEnrollmentProgress({
            sampleCount: data.sampleCount,
            voiceprintId: data.voiceprintId,
            status: data.status,
          });
          
          setModelConnected(true);
          setMlModel("speechbrain/spkrec-ecapa-voxceleb");
          setMlOutput({ embeddingDimensions: data.embedding?.length || 192 });
          
          if (data.status === "complete") {
            setFingerprint(data.voiceprintId);
            setFingerprintState("complete");
          } else {
            setFingerprintState("idle"); // Ready for next sample
          }
        } else {
          // Identification flow
          addLog("info", "Processing audio with ML model for identification...");
          addLog("success", `Connected to ML model: speechbrain/spkrec-ecapa-voxceleb`);
          addLog("info", `Generated ${data.embeddingDimensions || 0} dimensional embeddings`);
          addLog("info", `Found ${data.matches?.length || 0} matches above threshold ${data.threshold}`);
          
          if (data.topMatch) {
            addLog("success", `Top match: User ${data.topMatch.userId.substring(0, 8)}... (similarity: ${(data.topMatch.similarity * 100).toFixed(1)}%)`);
          } else {
            addLog("warning", "No matches found above threshold");
          }
          
          setIdentificationResults(data.matches || []);
          setModelConnected(true);
          setMlModel("speechbrain/spkrec-ecapa-voxceleb");
          setMlOutput({ embeddingDimensions: data.embeddingDimensions });
          setFingerprint(data.topMatch ? `Match: ${data.topMatch.userId}` : "No match");
          setFingerprintState("complete");
        }
      } catch (err) {
        console.error(`Error in ${mode}:`, err);
        addLog("error", err instanceof Error ? err.message : `Failed to ${mode}`);
        setError(err instanceof Error ? err.message : `Failed to ${mode}`);
        setFingerprintState("idle");
        setModelConnected(false);
      }
    },
    onError: (error) => {
      // Stop timer on error
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
      addLog("error", `Recording error: ${error.message}`);
      console.error("Recording error:", error);
      setError("Recording failed. Please try again.");
      setFingerprintState("idle");
    },
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleBoxClick = async () => {
    if (fingerprintState === "idle") {
      // Clear previous logs
      setProcessLogs([]);
      addLog("info", "Initializing recording session...");
      try {
        await startRecording();
      } catch (err) {
        console.error("Failed to start recording:", err);
        addLog("error", "Failed to start recording. Please check microphone permissions.");
        setError("Failed to start recording. Please check microphone permissions.");
      }
    } else if (fingerprintState === "recording") {
      stopRecording();
    }
  };

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setFingerprintState("idle");
    setFingerprint(null);
    setMlOutput(null);
    setModelConnected(null);
    setMlModel(null);
    setError(null);
    setRecordingTime(0);
    setProcessLogs([]);
    // Only reset enrollment progress if not complete
    if (enrollmentProgress.status !== "complete") {
      setEnrollmentProgress({ sampleCount: 0, voiceprintId: null, status: "" });
    }
    setIdentificationResults(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="w-full px-4 py-3 border-b border-gray-200 bg-white">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Stream Disc Beta Test</h1>
                <p className="text-xs text-gray-500 mt-1">Voice Fingerprint System - Transparent Pipeline</p>
              </div>
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setMode("test");
                    handleReset();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    mode === "test"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span className="text-sm font-medium">Test</span>
                </button>
                <button
                  onClick={() => {
                    setMode("enroll");
                    handleReset();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    mode === "enroll"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Enroll</span>
                </button>
                <button
                  onClick={() => {
                    setMode("identify");
                    handleReset();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    mode === "identify"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span className="text-sm font-medium">Identify</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Three Column Layout */}
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Side */}
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Input</h2>
              <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] bg-gray-50 rounded-lg p-8">
                {/* Neural Box */}
                <div
                  onClick={handleBoxClick}
                  className="cursor-pointer transition-all duration-300"
                >
                  <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex items-center justify-center">
                    <VIIMAnimation
                      state={
                        fingerprintState === "recording"
                          ? "recording"
                          : fingerprintState === "processing"
                          ? "processing"
                          : "idle"
                      }
                      size="sm"
                      container="square"
                      visualStyle="particles"
                      audioStream={getAudioStream()}
                    />
                  </div>
                </div>

                {/* Enrollment Progress */}
                {mode === "enroll" && enrollmentProgress.sampleCount > 0 && (
                  <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Enrollment Progress: {enrollmentProgress.sampleCount}/5 samples
                    </p>
                    {enrollmentProgress.status === "complete" && (
                      <p className="text-xs text-blue-700 mt-1">✓ Enrollment complete!</p>
                    )}
                  </div>
                )}

                {/* Status Text */}
                <div className="mt-6 text-center">
                  {fingerprintState === "idle" && (
                    <p className="text-gray-600 text-sm">
                      {mode === "enroll" 
                        ? "Press the box to record enrollment sample"
                        : mode === "identify"
                        ? "Press the box to identify voice"
                        : "Press the box to test microphone & model"}
                    </p>
                  )}
                  {fingerprintState === "recording" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <p className="text-red-600 text-sm font-medium">Recording... Press to stop</p>
                      </div>
                      <p className="text-gray-500 text-xs font-mono">{formatTime(recordingTime)}</p>
                    </div>
                  )}
                  {fingerprintState === "processing" && (
                    <div className="flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      <p className="text-gray-600 text-sm">Processing...</p>
                    </div>
                  )}
                  {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Process Terminal - Middle */}
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Process Log</h2>
              <div className="flex-1 min-h-[500px] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <ProcessTerminal logs={processLogs} />
              </div>
            </div>

            {/* Output Side */}
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Output</h2>
              <div className="flex-1 flex flex-col min-h-[500px] bg-gray-50 rounded-lg p-8">
                {fingerprintState === "complete" && fingerprint ? (
                  <div className="w-full">
                    {/* Model Connection Status */}
                    <div className={`mb-4 p-3 rounded-lg border-2 ${
                      modelConnected
                        ? "bg-green-50 border-green-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        {modelConnected ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-900">
                                ML Model Connected
                              </p>
                              <p className="text-xs text-green-700">{mlModel}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <div>
                              <p className="text-sm font-medium text-yellow-900">
                                No ML Model Connection
                              </p>
                              <p className="text-xs text-yellow-700">
                                Using fallback fingerprint generation
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Fingerprint Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Fingerprint className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    {/* Fingerprint String */}
                    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                        Voice Fingerprint
                      </label>
                      <div className="font-mono text-xs text-gray-900 break-all bg-gray-50 p-3 rounded border border-gray-200">
                        {fingerprint}
                      </div>
                    </div>

                    {/* ML Output */}
                    {mlOutput && modelConnected && (
                      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                          ML Model Output
                        </label>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium text-gray-700">Embeddings:</span>{" "}
                            <span className="text-gray-600">
                              {mlOutput.embeddingDimensions || 0} dimensions
                            </span>
                          </div>
                          {mlOutput.acousticFeatures && (
                            <div>
                              <span className="font-medium text-gray-700">Confidence:</span>{" "}
                              <span className="text-gray-600">
                                {(mlOutput.acousticFeatures.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                          <details className="mt-2">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                              View raw output
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 text-xs overflow-x-auto">
                              {JSON.stringify(mlOutput, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </div>
                    )}

                    {/* Identification Results */}
                    {mode === "identify" && identificationResults && (
                      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                          Identification Results
                        </label>
                        {identificationResults.length > 0 ? (
                          <div className="space-y-2">
                            {identificationResults.map((match, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded border ${
                                  match.match
                                    ? "bg-green-50 border-green-200"
                                    : "bg-gray-50 border-gray-200"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      User: {match.userId.substring(0, 12)}...
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      Voiceprint: {match.voiceprintId.substring(0, 16)}...
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">
                                      {(match.similarity * 100).toFixed(1)}%
                                    </p>
                                    {match.match && (
                                      <p className="text-xs text-green-600">Match</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">No matches found</p>
                        )}
                      </div>
                    )}

                    {/* Reset Button */}
                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                      {mode === "enroll" && enrollmentProgress.status !== "complete"
                        ? "Record Next Sample"
                        : "Start New Recording"}
                    </button>

                    {/* History Section */}
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">History</h3>
                      <FingerprintHistory history={history} />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                    <Fingerprint className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm mb-6">Fingerprint will appear here after recording</p>
                    
                    {/* Show history even when no current result */}
                    {history.length > 0 && (
                      <div className="w-full mt-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 text-left">History</h3>
                        <FingerprintHistory history={history} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
