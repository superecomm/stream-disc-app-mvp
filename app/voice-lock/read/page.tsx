"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { UserAvatar } from "@/components/UserAvatar";
import { ReadingLane } from "@/components/ReadingLane";
import { RecordButton } from "@/components/RecordButton";
import { StatusModal } from "@/components/StatusModal";
import { DatasetMeter } from "@/components/DatasetMeter";
import { NewDatasetModal } from "@/components/NewDatasetModal";
import { AudioSettings } from "@/components/AudioSettings";
import { TestModeCarousel } from "@/components/TestModeCarousel";
import { VideoPreview } from "@/components/VideoPreview";
import { OnboardingModal } from "@/components/OnboardingModal";
import { CountdownModal } from "@/components/CountdownModal";
import { readingPhrases, solfegePhrases, getPhrasesForDataset } from "@/lib/phrases";
import type { VoiceLockProfile, VoiceLockDataset } from "@/types/voiceLock";

export default function VoiceLockRead() {
  const { currentUser } = useAuth();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [profile, setProfile] = useState<VoiceLockProfile | null>(null);
  const [currentDataset, setCurrentDataset] = useState<VoiceLockDataset | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [lastSessionPhrases, setLastSessionPhrases] = useState(0);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | undefined>(undefined);
  const [recordVideo, setRecordVideo] = useState(false);
  const [recordingMode, setRecordingMode] = useState<"voice" | "video">("voice");
  const [showTextOverlay, setShowTextOverlay] = useState(true);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstDataset, setIsFirstDataset] = useState(false);
  const [testType, setTestType] = useState<"solfege" | "script1" | "script2" | "script3" | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>("voice");
  const [showCountdown, setShowCountdown] = useState(false);
  const [pendingRecordingStart, setPendingRecordingStart] = useState(false);
  const phraseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get phrases based on selected mode/test
  const currentPhrases = selectedMode === "solfege"
    ? solfegePhrases
    : selectedMode === "script1" || selectedMode === "script2" || selectedMode === "script3"
    ? readingPhrases // TODO: Use different phrases for each script
    : isFirstDataset
    ? solfegePhrases
    : readingPhrases;

  // Update recording mode and test type based on selected mode
  useEffect(() => {
    if (selectedMode === "voice" || selectedMode === "video") {
      setRecordingMode(selectedMode);
      setTestType(null);
    } else if (selectedMode === "solfege" || selectedMode === "script1" || selectedMode === "script2" || selectedMode === "script3") {
      setTestType(selectedMode);
      // Keep current recording mode (voice/video) when selecting a test
    }
  }, [selectedMode]);

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
      fetchCurrentDataset();
    }

    // Check URL params for test type
    const params = new URLSearchParams(window.location.search);
    const testParam = params.get("test");
    if (testParam === "solfege") {
      setTestType("solfege");
    } else if (testParam === "script1" || testParam === "script2" || testParam === "script3") {
      setTestType(testParam);
    }

    // Listen for custom events from menu
    const handleTestStart = (event: CustomEvent) => {
      const testType = event.detail?.testType;
      if (testType === "solfege") {
        setTestType("solfege");
      } else if (testType === "script1" || testType === "script2" || testType === "script3") {
        setTestType(testType);
      }
    };

    window.addEventListener("startTest", handleTestStart as EventListener);
    return () => {
      window.removeEventListener("startTest", handleTestStart as EventListener);
    };
  }, [currentUser]);

  // Update recordVideo based on mode
  useEffect(() => {
    setRecordVideo(recordingMode === "video");
    // Clear preview stream when switching modes
    if (!isRecording) {
      setPreviewStream(null);
    }
  }, [recordingMode, isRecording]);

  // Reset phrase index when phrases change (e.g., switching between onboarding and regular)
  useEffect(() => {
    if (!isRecording) {
      setCurrentPhraseIndex(0);
    }
  }, [isFirstDataset, testType, isRecording]);

  // Manual phrase advancement - no auto-scrolling
  const handleNextPhrase = () => {
    if (isRecording && currentPhraseIndex < currentPhrases.length - 1) {
      setCurrentPhraseIndex((prev) => prev + 1);
    }
  };

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
        setIsFirstDataset(false);
      } else if (response.status === 404) {
        // No active dataset - check if user has any datasets
        const allDatasetsResponse = await fetch(`/api/voice-lock/datasets?userId=${currentUser.uid}`);
        if (allDatasetsResponse.ok) {
          const allData = await allDatasetsResponse.json();
          const hasAnyDatasets = allData.datasets && allData.datasets.length > 0;
          setIsFirstDataset(!hasAnyDatasets);
          // Show onboarding if this is truly the first dataset
          if (!hasAnyDatasets && currentDataset === null) {
            // Only show if user has an active dataset (they just created one)
            // We'll show onboarding when they create their first dataset instead
          }
        }
        setCurrentDataset(null);
      }
    } catch (error) {
      console.error("Error fetching dataset:", error);
    }
  };

  const handleCreateDataset = async (name: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch("/api/voice-lock/datasets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentDataset(data);
        setProfile(data); // Update profile with new dataset data
        
        // Check if this is the first dataset
        const allDatasetsResponse = await fetch(`/api/voice-lock/datasets?userId=${currentUser.uid}`);
        if (allDatasetsResponse.ok) {
          const allData = await allDatasetsResponse.json();
          const isFirst = allData.datasets && allData.datasets.length === 1;
          setIsFirstDataset(isFirst);
          if (isFirst) {
            setShowOnboarding(true);
          }
        }
      }
    } catch (error) {
      console.error("Error creating dataset:", error);
    }
  };

  const handleRecordingStart = () => {
    // Ensure there's an active dataset before recording
    if (!currentDataset && currentUser) {
      // Prompt user to create a dataset first
      setShowNewDatasetModal(true);
      return;
    }
    
    // Show countdown before starting
    setPendingRecordingStart(true);
    setShowCountdown(true);
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setIsRecording(true);
    setCurrentPhraseIndex(0);
    setShowOnboarding(false);
    setPendingRecordingStart(false);
  };

  const handleCountdownCancel = () => {
    setShowCountdown(false);
    setPendingRecordingStart(false);
  };

  const handleRecordingComplete = async (audioBlob: Blob, videoBlob?: Blob) => {
    setIsRecording(false);
    setPreviewStream(null); // Clear preview stream when recording stops
    setShowStatusModal(true);
    await saveSession(audioBlob, videoBlob);
  };

  const handleSessionComplete = () => {
    setCurrentPhraseIndex(0);
  };

  const saveSession = async (audioBlob: Blob, videoBlob?: Blob) => {
    if (!currentUser) return;

    try {
      const formData = new FormData();
      
      // Always send audio (extracted from video if video exists, or standalone)
      formData.append("audio", audioBlob, "recording.webm");
      
      // Send video if recorded
      if (videoBlob) {
        formData.append("video", videoBlob, "recording.webm");
      }
      
      formData.append("userId", currentUser.uid);
      formData.append("phrasesCount", (currentPhraseIndex + 1).toString()); // Actual phrases read
      formData.append("isOnboarding", isFirstDataset ? "true" : "false"); // Mark onboarding sessions
      formData.append("source", "mobile");
      formData.append("vocalType", "speech"); // Default to speech, can be changed later
      formData.append("hasVideo", videoBlob ? "true" : "false");

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
        setLastSessionPhrases(readingPhrases.length);
      }
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const handleStatusComplete = () => {
    setShowStatusModal(false);
  };

  const datasetCompletion = currentDataset?.datasetCompletion || profile?.datasetCompletion || 0;
  const status = currentDataset?.status || profile?.status || "not_started";
  const statusText =
    status === "studio_verified"
      ? "Studio Verified"
      : status === "mobile_enrolled"
      ? "Mobile-only"
      : "Not started";

  const statusMessages = [
    "Uploading sample…",
    "Processing…",
    "Updating dataset…",
  ];

  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#FFFFFF', color: '#111111' }}>
        {/* Top Nav Bar - ChatGPT style */}
        <header className="sticky top-0 z-40" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between px-4 h-14">
            <div className="w-8" /> {/* Spacer */}
            <h1 className="text-sm font-medium text-[#111111]">VoiceLock Session</h1>
            <UserAvatar />
          </div>
        </header>

        {/* Main Content - Video or Text */}
        <main className="flex-1 relative">
          {recordingMode === "video" ? (
            <VideoPreview
              stream={previewStream}
              showTextOverlay={showTextOverlay}
              onToggleText={() => setShowTextOverlay(!showTextOverlay)}
              phrases={currentPhrases}
              currentIndex={currentPhraseIndex}
              isRecording={isRecording}
              onNextPhrase={handleNextPhrase}
            />
          ) : (
            <ReadingLane
              phrases={currentPhrases}
              currentIndex={currentPhraseIndex}
              isRecording={isRecording}
              onNextPhrase={handleNextPhrase}
            />
          )}
        </main>

        {/* Bottom Bar - ChatGPT input bar style */}
        <div className="fixed bottom-0 left-0 right-0 safe-area-inset-bottom" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
          {/* Test/Mode Carousel - full width with gradients */}
          <div className="w-full">
            <TestModeCarousel
              currentMode={selectedMode}
              onModeChange={setSelectedMode}
            />
          </div>

          {/* Controls Row */}
          <div className="flex flex-col max-w-2xl mx-auto">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Left: Dataset Meter */}
              <DatasetMeter
                completion={datasetCompletion}
                onClick={() => setShowNewDatasetModal(true)}
              />

              {/* Center: Large Record Button */}
              <div className="flex-1 flex justify-center">
                <RecordButton
                  onStart={handleRecordingStart}
                  onStop={handleRecordingComplete}
                  onComplete={handleSessionComplete}
                  disabled={showStatusModal}
                  recordVideo={recordVideo}
                  audioDeviceId={selectedAudioDevice}
                  onStreamReady={setPreviewStream}
                />
              </div>

              {/* Right: Audio Settings */}
              <AudioSettings
                onDeviceChange={(deviceId) => {
                  setSelectedAudioDevice(deviceId);
                }}
                videoEnabled={recordVideo}
              />
            </div>
          </div>
        </div>

        {/* Status Modal */}
        <StatusModal
          isVisible={showStatusModal}
          messages={statusMessages}
          onComplete={handleStatusComplete}
        />

        {/* New Dataset Modal */}
        <NewDatasetModal
          isOpen={showNewDatasetModal}
          onClose={() => setShowNewDatasetModal(false)}
          onCreate={handleCreateDataset}
        />

        {/* Onboarding Modal */}
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          onStart={handleRecordingStart}
        />

        {/* Countdown Modal */}
        <CountdownModal
          isVisible={showCountdown}
          onComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
        />
      </div>
    </AuthGate>
  );
}
