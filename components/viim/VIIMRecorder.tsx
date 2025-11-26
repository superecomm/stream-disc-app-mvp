"use client";

import { useRef, useState, useCallback } from "react";

interface VIIMRecorderProps {
  audioDeviceId?: string;
  onStreamReady?: (stream: MediaStream | null) => void;
  onAudioData?: (audioBlob: Blob) => void;
  onError?: (error: Error) => void;
}

export function useVIIMRecorder({
  audioDeviceId,
  onStreamReady,
  onAudioData,
  onError,
}: VIIMRecorderProps = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const audioConstraint = audioDeviceId && audioDeviceId !== "default"
        ? { deviceId: { ideal: audioDeviceId } }
        : true;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraint,
      });

      audioStreamRef.current = stream;
      setHasPermission(true);
      onStreamReady?.(stream);

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        onAudioData?.(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
        onStreamReady?.(null);
      };

      recorder.onerror = (event) => {
        const error = new Error("MediaRecorder error");
        onError?.(error);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setHasPermission(false);
      const err = error instanceof Error ? error : new Error("Failed to start recording");
      onError?.(err);
    }
  }, [audioDeviceId, onStreamReady, onAudioData, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const getAudioStream = useCallback(() => {
    return audioStreamRef.current;
  }, []);

  return {
    isRecording,
    hasPermission,
    startRecording,
    stopRecording,
    getAudioStream,
  };
}

