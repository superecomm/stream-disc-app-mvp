"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/contexts/AuthContext";
import { useViim } from "@/contexts/VIIMContext";
import { UserAvatar } from "@/components/UserAvatar";
import { AudioSettings } from "@/components/AudioSettings";
import { StatusModal } from "@/components/StatusModal";
import { NeuralBox } from "@/components/viim/NeuralBox";
import type { VoiceLockDataset, VoiceLockProfile } from "@/types/voiceLock";
import type { ViimState } from "@/contexts/VIIMContext";
import { llmModels } from "@/lib/models/modelRegistry";
import { Menu, ChevronDown, X, Trash2 } from "lucide-react";

export default function StreamDiscMobileApp() {
  const { currentUser } = useAuth();
  const { selectedModel, setSelectedModel, setInputMode, conversationHistory, clearConversationHistory } = useViim();
  const [profile, setProfile] = useState<VoiceLockProfile | null>(null);
  const [currentDataset, setCurrentDataset] = useState<VoiceLockDataset | null>(null);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>();
  const [neuralState, setNeuralState] = useState<ViimState>("idle");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const statusMessages = ["Uploading sample…", "Processing…", "Updating dataset…"];

  useEffect(() => {
    if (!currentUser) return;
    fetchProfile();
    fetchCurrentDataset();
  }, [currentUser]);

  const fetchProfile = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/voice-lock/profile?userId=${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchCurrentDataset = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/voice-lock/datasets/active?userId=${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentDataset(data);
      } else if (response.status === 404) {
        setCurrentDataset(null);
      }
    } catch (error) {
      console.error("Error fetching dataset:", error);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setShowStatusModal(true);
    await saveSession(audioBlob);
  };

  const saveSession = async (audioBlob: Blob) => {
    if (!currentUser) return;
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("userId", currentUser.uid);
      formData.append("source", "mobile");
      formData.append("vocalType", "speech");

      const response = await fetch("/api/voice-lock/session", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        if (data.dataset) {
          setCurrentDataset(data.dataset);
        }
      }
    } catch (error) {
      console.error("Error saving session:", error);
    } finally {
      setShowStatusModal(false);
    }
  };

  const handleStatusComplete = () => {
    setShowStatusModal(false);
  };

  const handleNeuralStateChange = (state: ViimState) => {
    setNeuralState(state);
  };

  const voiceprintId = profile?.voiceprintId || currentDataset?.voiceprintId || "pending-voiceprint";

  const handleModelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const modelId = event.target.value;
    setSelectedModel(modelId);
    const model = llmModels.find((m) => m.id === modelId);
    if (model?.supportsText && !model.supportsAudio) {
      setInputMode("text");
    } else if (model?.supportsAudio && !model.supportsText) {
      setInputMode("voice");
    }
  };

  return (
    <AuthGate>
      <div className="flex h-screen flex-col overflow-hidden bg-white text-gray-900">
        <header className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex h-16 w-full max-w-4xl items-center gap-3 px-4">
            <button
              className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
              aria-label="Menu"
              onClick={() => setIsHistoryOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <label className="flex items-center gap-0.5 text-base font-semibold text-gray-900">
              <select
                value={selectedModel}
                onChange={handleModelChange}
                className="appearance-none bg-transparent pr-2 text-base font-semibold text-gray-900 focus:outline-none"
              >
                {llmModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400 -ml-1" />
            </label>
            <div className="ml-auto flex items-center gap-2">
              <UserAvatar />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden px-4">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden">
            <NeuralBox
              variant="assistant"
              audioDeviceId={selectedAudioDevice}
              className="flex-1"
              onStateChange={handleNeuralStateChange}
              onAudioCapture={handleRecordingComplete}
              showInputPanel
              forcePromptVisible
            />
          </div>
        </main>

        <footer className="bg-white">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-base font-semibold text-gray-900">{voiceprintId}</p>
              <p className="text-xs text-gray-500">Neural state: {neuralState}</p>
            </div>
            <AudioSettings
              onDeviceChange={(deviceId) => setSelectedAudioDevice(deviceId || undefined)}
              videoEnabled={false}
            />
          </div>
        </footer>

        <StatusModal isVisible={showStatusModal} messages={statusMessages} onComplete={handleStatusComplete} />

        {isHistoryOpen && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsHistoryOpen(false)} />
            <aside className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">History</p>
                  <p className="text-base font-semibold text-gray-900">Conversation log</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full p-2 text-gray-500 hover:text-gray-900"
                    aria-label="Clear history"
                    onClick={() => clearConversationHistory()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-full p-2 text-gray-500 hover:text-gray-900"
                    aria-label="Close history"
                    onClick={() => setIsHistoryOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
                {conversationHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No messages yet. Start a prompt to build your stream.</p>
                ) : (
                  conversationHistory
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 shadow-sm">
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                          <span className="font-semibold uppercase tracking-[0.2em]">
                            {entry.role === "user" ? "You" : "Stream Disc"}
                          </span>
                          <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-sm text-gray-800">{entry.content}</p>
                        {entry.model && (
                          <p className="mt-1 text-xs text-gray-400">
                            {entry.model}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </AuthGate>
  );
}

