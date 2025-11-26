"use client";

import { useState, useEffect } from "react";
import VoiceAnimation from "@/components/VoiceAnimation";

export default function AnimationTestPage() {
  const [state, setState] = useState<"idle" | "listening" | "active" | "recording">("idle");
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [container, setContainer] = useState<"circle" | "square" | "none">("square");
  const [visualStyle, setVisualStyle] = useState<"bars" | "waves" | "blob" | "radial" | "canvas" | "particles">("particles");
  const [autoToggle, setAutoToggle] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [recordingCountdown, setRecordingCountdown] = useState<number | undefined>(undefined);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Audio recording states
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordedAudioURL, setRecordedAudioURL] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [activeAudioStream, setActiveAudioStream] = useState<MediaStream | null>(null);

  // Auto-toggle between states for testing
  useEffect(() => {
    if (autoToggle) {
      const interval = setInterval(() => {
        setState(prev => {
          if (prev === "idle") return "listening";
          if (prev === "listening") return "active";
          if (prev === "active") return "recording";
          return "idle";
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [autoToggle]);
  
  // Request microphone permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop()); // Stop immediately, we'll request again when needed
      } catch (error) {
        console.error("Microphone permission denied:", error);
        setPermissionError("Microphone access denied. Please allow microphone access to use recording features.");
      }
    };
    requestPermission();
  }, []);

  // Recording timer
  useEffect(() => {
    if (state === "recording" && recordingCountdown === 0) {
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state, recordingCountdown]);

  // Helper to add log entry
  const addLog = (message: string) => {
    setSimulationLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Helper to change state with logging
  const changeState = (newState: "idle" | "listening" | "active" | "recording", label: string) => {
    setState(newState);
    addLog(label);
  };
  
  // Start real audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setActiveAudioStream(stream); // Store stream for Web Audio API
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioURL = URL.createObjectURL(audioBlob);
        setRecordedAudioURL(audioURL);
        setAudioChunks(chunks);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
        setActiveAudioStream(null); // Clear stream
        
        addLog(`✓ Recording saved (${(audioBlob.size / 1024).toFixed(2)} KB)`);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      
      return recorder;
    } catch (error) {
      console.error("Failed to start recording:", error);
      addLog("✗ Failed to start recording");
      return null;
    }
  };
  
  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };
  
  // Download recorded audio
  const downloadAudio = () => {
    if (recordedAudioURL) {
      const a = document.createElement('a');
      a.href = recordedAudioURL;
      a.download = `viim-recording-${Date.now()}.webm`;
      a.click();
      addLog("✓ Audio downloaded");
    }
  };

  // Simulation: Natural Conversation
  const simulateConversation = async () => {
    setIsSimulating(true);
    setSimulationLog([]);
    
    addLog("Starting natural conversation simulation...");
    
    // User initiates
    changeState("idle", "→ IDLE: VIIM waiting (thinking baseline)");
    await new Promise(r => setTimeout(r, 2000));
    
    changeState("listening", "→ LISTENING: User said 'Hey VIIM'");
    await new Promise(r => setTimeout(r, 2000));
    
    changeState("active", "→ SPEAKING: 'Hello! How can I help you?'");
    await new Promise(r => setTimeout(r, 3000));
    
    changeState("listening", "→ LISTENING: Waiting for user response...");
    await new Promise(r => setTimeout(r, 2500));
    
    changeState("active", "→ SPEAKING: 'I can verify your voice identity.'");
    await new Promise(r => setTimeout(r, 3000));
    
    changeState("idle", "→ IDLE: Conversation ended, returning to constellation");
    addLog("✓ Conversation simulation complete");
    setIsSimulating(false);
  };

  // Simulation: Voice Identity Verification
  const simulateVerification = async () => {
    setIsSimulating(true);
    setSimulationLog([]);
    
    addLog("Starting voice identity verification...");
    
    changeState("idle", "→ IDLE: System ready");
    await new Promise(r => setTimeout(r, 1500));
    
    changeState("listening", "→ LISTENING: 'Please speak your passphrase'");
    await new Promise(r => setTimeout(r, 2000));
    
    changeState("active", "→ PROCESSING: Analyzing voice biometrics...");
    await new Promise(r => setTimeout(r, 4000));
    
    changeState("active", "→ SPEAKING: 'Voice verified. Welcome back!'");
    await new Promise(r => setTimeout(r, 2500));
    
    addLog("💥 EXPLOSION: Verification successful!");
    changeState("idle", "→ IDLE: Burst effect confirming authentication");
    await new Promise(r => setTimeout(r, 1500));
    
    addLog("✓ Identity verified with success burst animation");
    setIsSimulating(false);
  };

  // Simulation: Thinking/Processing
  const simulateThinking = async () => {
    setIsSimulating(true);
    setSimulationLog([]);
    
    addLog("Starting thinking/processing simulation...");
    
    changeState("listening", "→ LISTENING: 'What's the weather today?'");
    await new Promise(r => setTimeout(r, 2000));
    
    changeState("idle", "→ THINKING: Processing query (constellation pulsing)");
    await new Promise(r => setTimeout(r, 3000));
    
    changeState("active", "→ SPEAKING: 'It's sunny with a high of 75°F'");
    await new Promise(r => setTimeout(r, 3000));
    
    changeState("idle", "→ IDLE: Ready for next query");
    addLog("✓ Thinking simulation complete");
    setIsSimulating(false);
  };

  // Simulation: Creative Idea Delivery
  const simulateIdeaDelivery = async () => {
    setIsSimulating(true);
    setSimulationLog([]);
    
    addLog("Starting creative idea delivery...");
    
    changeState("idle", "→ IDLE: Generating creative output...");
    await new Promise(r => setTimeout(r, 2000));
    
    changeState("idle", "→ THINKING: Constellation pulsing (idea forming)");
    await new Promise(r => setTimeout(r, 2500));
    
    changeState("active", "→ SPEAKING: Delivering idea with neural stream");
    await new Promise(r => setTimeout(r, 4000));
    
    // Idea delivered - explosion effect automatically triggered on transition
    addLog("💥 EXPLOSION: Neural wave bursts outward! (Idea delivered)");
    changeState("idle", "→ IDLE: Particles surge out and gracefully return to constellation");
    await new Promise(r => setTimeout(r, 1500));
    
    addLog("✓ Idea delivered successfully with explosion flourish");
    setIsSimulating(false);
  };

  // Simulation: Recording Session with Real Audio
  const simulateRecording = async () => {
    setIsSimulating(true);
    setSimulationLog([]);
    setRecordingTime(0);
    
    addLog("Starting real recording session...");
    
    changeState("idle", "→ IDLE: Preparing to record");
    setRecordingCountdown(undefined);
    await new Promise(r => setTimeout(r, 1500));
    
    // Countdown: 3
    addLog("🔴 Recording countdown starting...");
    setRecordingCountdown(3);
    changeState("idle", "→ COUNTDOWN: 3 dots");
    await new Promise(r => setTimeout(r, 1000));
    
    // Countdown: 2
    setRecordingCountdown(2);
    addLog("→ COUNTDOWN: 2 dots");
    await new Promise(r => setTimeout(r, 1000));
    
    // Countdown: 1
    setRecordingCountdown(1);
    addLog("→ COUNTDOWN: 1 dot");
    await new Promise(r => setTimeout(r, 1000));
    
    // Recording starts - begin real microphone recording
    setRecordingCountdown(0);
    const recorder = await startRecording();
    if (!recorder) {
      addLog("✗ Recording failed - microphone not available");
      setIsSimulating(false);
      setState("idle");
      setRecordingCountdown(undefined);
      return;
    }
    
    changeState("recording", "→ RECORDING: 🔴 Active waveform visualization (speak now!)");
    addLog("🔴 RECORDING ACTIVE: Soft red glow + waveform animation");
    await new Promise(r => setTimeout(r, 10000));
    
    stopRecording();
    setRecordingCountdown(undefined);
    changeState("active", "→ PROCESSING: Encoding voice data...");
    addLog("Recording stopped - processing audio");
    await new Promise(r => setTimeout(r, 2500));
    
    changeState("active", "→ SPEAKING: 'Recording saved successfully'");
    await new Promise(r => setTimeout(r, 2000));
    
    addLog("💥 EXPLOSION: Processing complete! (File saved)");
    changeState("idle", "→ IDLE: Burst effect + return to constellation");
    await new Promise(r => setTimeout(r, 1500));
    
    addLog("✓ Recording session complete with completion burst");
    setIsSimulating(false);
  };

  // Simulation: Error/Alert
  const simulateError = async () => {
    setIsSimulating(true);
    setSimulationLog([]);
    
    addLog("Starting error handling simulation...");
    
    changeState("listening", "→ LISTENING: Waiting for input...");
    await new Promise(r => setTimeout(r, 2000));
    
    changeState("active", "→ ERROR: Voice not recognized!");
    await new Promise(r => setTimeout(r, 2000));
    
    changeState("idle", "→ IDLE: Returning to safe state");
    addLog("⚠️ Error handled, system reset");
    setIsSimulating(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold mb-2">VIIM Voice Animation Test Lab</h1>
          <p className="text-gray-400">Design and test the signature Stream Disc / VIIM voice activity animation</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Conversation Simulator */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-6 mb-8 border border-purple-700/50">
          <h2 className="text-2xl font-bold mb-4 text-purple-300">🎙️ VIIM Conversation Simulator</h2>
          <p className="text-gray-300 mb-6">Test realistic interaction flows and state transitions</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={simulateConversation}
              disabled={isSimulating}
              className={`px-4 py-3 rounded-lg font-medium transition ${
                isSimulating
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
              }`}
            >
              💬 Natural Conversation
            </button>
            
            <button
              onClick={simulateVerification}
              disabled={isSimulating}
              className={`px-4 py-3 rounded-lg font-medium transition ${
                isSimulating
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-500 hover:to-teal-500"
              }`}
            >
              🔐 Voice Verification
            </button>
            
            <button
              onClick={simulateThinking}
              disabled={isSimulating}
              className={`px-4 py-3 rounded-lg font-medium transition ${
                isSimulating
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500"
              }`}
            >
              🤔 Thinking/Processing
            </button>
            
            <button
              onClick={simulateIdeaDelivery}
              disabled={isSimulating}
              className={`px-4 py-3 rounded-lg font-medium transition ${
                isSimulating
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-500 hover:to-orange-500"
              }`}
            >
              💡 Idea Delivery
            </button>
            
            <button
              onClick={simulateRecording}
              disabled={isSimulating}
              className={`px-4 py-3 rounded-lg font-medium transition ${
                isSimulating
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500"
              }`}
            >
              🔴 Recording Session
            </button>
            
            <button
              onClick={simulateError}
              disabled={isSimulating}
              className={`px-4 py-3 rounded-lg font-medium transition ${
                isSimulating
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-700 to-red-800 text-white hover:from-red-600 hover:to-red-700"
              }`}
            >
              ⚠️ Error Handling
            </button>
          </div>

          {/* Simulation Log */}
          {simulationLog.length > 0 && (
            <div className="bg-black/50 rounded-lg p-4 border border-gray-700 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-cyan-400">Simulation Log</h3>
                <button
                  onClick={() => setSimulationLog([])}
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1 font-mono text-sm">
                {simulationLog.map((log, i) => (
                  <div key={i} className={`${
                    log.includes('IDLE') ? 'text-gray-400' :
                    log.includes('LISTENING') ? 'text-blue-400' :
                    log.includes('SPEAKING') || log.includes('PROCESSING') ? 'text-purple-400' :
                    log.includes('THINKING') ? 'text-yellow-400' :
                    log.includes('ERROR') ? 'text-red-400' :
                    log.includes('✓') ? 'text-green-400' :
                    log.includes('💡') ? 'text-orange-400' :
                    'text-cyan-400'
                  }`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Manual Controls */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Manual Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Visual Style Control */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visualization Style
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(["bars", "waves", "blob", "radial", "canvas", "particles"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setVisualStyle(style)}
                    className={`px-3 py-2 rounded-lg font-medium transition text-sm ${
                      visualStyle === style
                        ? "bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* State Control */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                VIIM State (4-State System)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(["idle", "listening", "active", "recording"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setState(s)}
                    className={`px-3 py-2 rounded-lg font-medium transition text-sm ${
                      state === s
                        ? s === "idle" ? "bg-gray-600 text-white" :
                          s === "listening" ? "bg-blue-600 text-white" :
                          s === "active" ? "bg-purple-600 text-white" :
                          "bg-red-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Container Control */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Container Style
              </label>
              <div className="flex gap-2">
                {(["circle", "square", "none"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setContainer(c)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition text-sm ${
                      container === c
                        ? "bg-pink-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Control */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Size
              </label>
              <div className="flex gap-2">
                {(["sm", "md", "lg"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      size === s
                        ? "bg-cyan-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {s === "sm" ? "Small" : s === "md" ? "Medium" : "Large"}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Auto Toggle (3s interval)
              </label>
              <button
                onClick={() => setAutoToggle(!autoToggle)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                  autoToggle
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {autoToggle ? "ON" : "OFF"}
              </button>
            </div>

            {/* Audio Recording Controls */}
            <div className="md:col-span-2 border-t border-gray-700 pt-6 mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                🎙️ Audio Recording & Storage
              </label>
              
              {permissionError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                  {permissionError}
                </div>
              )}
              
              {!hasPermission && !permissionError && (
                <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
                  Requesting microphone permission...
                </div>
              )}
              
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={async () => {
                    if (state === "recording") {
                      stopRecording();
                      setState("idle");
                      setRecordingCountdown(undefined);
                    } else {
                      // Start countdown and recording
                      setRecordingCountdown(3);
                      setRecordingTime(0);
                      await new Promise(r => setTimeout(r, 1000));
                      setRecordingCountdown(2);
                      await new Promise(r => setTimeout(r, 1000));
                      setRecordingCountdown(1);
                      await new Promise(r => setTimeout(r, 1000));
                      setRecordingCountdown(0);
                      const recorder = await startRecording();
                      if (recorder) {
                        setState("recording");
                      }
                    }
                  }}
                  disabled={!hasPermission || isSimulating}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    state === "recording"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed"
                  }`}
                >
                  {state === "recording" ? "⏹ Stop Recording" : "⏺ Start Recording"}
                </button>
                
                {recordedAudioURL && (
                  <>
                    <audio src={recordedAudioURL} controls className="flex-1 min-w-[200px]" />
                    <button
                      onClick={downloadAudio}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      💾 Download
                    </button>
                  </>
                )}
              </div>
              
              {state === "recording" && (
                <div className="mt-3 text-sm text-red-400">
                  ⏺ Recording... {recordingTime}s elapsed
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Animation Display - Dark Background */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">VIIM Neural Network Interface (Monochrome)</h2>
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-lg p-12 flex items-center justify-center border border-gray-800 min-h-[600px]">
            <VoiceAnimation 
              state={state} 
              size={size} 
              container={container} 
              visualStyle={visualStyle} 
              recordingCountdown={recordingCountdown}
              recordingTime={recordingTime}
              audioStream={activeAudioStream}
            />
          </div>
          <p className="text-center text-gray-400 mt-4">
            State: <span className="font-bold text-white">{state}</span> | 
            Size: <span className="font-bold text-white">{size}</span> | 
            Container: <span className="font-bold text-white">{container}</span> |
            Style: <span className="font-bold text-white">{visualStyle}</span>
            {state === "recording" && <span className="ml-2 text-red-400 font-bold">🔴 RECORDING</span>}
          </p>
          <p className="text-center text-gray-500 text-sm mt-2">
            {state === "idle" && "Constellation mode - 5 particles orbiting center"}
            {state === "listening" && "Spread particles with micro-shake - waiting for input"}
            {state === "active" && "Neural waveform stream - magnetized horizontal flow"}
            {state === "recording" && "🔴 Recording active - reactive waveform with red glow"}
          </p>
        </div>

        {/* Animation Display - Light Background */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Light Background Preview</h2>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-12 flex items-center justify-center border border-gray-300 min-h-[600px]">
            <VoiceAnimation 
              state={state} 
              size={size} 
              container={container} 
              visualStyle={visualStyle} 
              recordingCountdown={recordingCountdown}
              recordingTime={recordingTime}
              audioStream={activeAudioStream}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

