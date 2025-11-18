"use client";

import { useEffect, useRef, useState } from "react";

type WaveformProps = {
  isRecording: boolean;
  audioStream?: MediaStream;
};

export function Waveform({ isRecording, audioStream }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | undefined>(undefined);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!isRecording || !audioStream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    canvas.width = 120;
    canvas.height = 40;

    const draw = () => {
      if (!isRecording || !analyserRef.current || !dataArrayRef.current) return;

      animationFrameRef.current = requestAnimationFrame(draw);

      const dataArray = dataArrayRef.current;
      if (dataArray && analyserRef.current) {
        // @ts-expect-error - getByteFrequencyData accepts Uint8Array with ArrayBufferLike
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      // Clear with transparent background for ChatGPT-style waveform
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = 2;
      const barGap = 1.5;
      const barCount = 24;
      const centerY = canvas.height / 2;
      const maxBarHeight = canvas.height * 0.8;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * dataArray.length);
        // More responsive: use average of nearby frequencies for smoother visualization
        const avgValue = dataArray[dataIndex] || 0;
        const barHeight = Math.max(2, (avgValue / 255) * maxBarHeight);
        
        const x = (canvas.width / 2) - (barCount * (barWidth + barGap)) / 2 + i * (barWidth + barGap);
        
        // ChatGPT-style: white bars on red background (when recording)
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [isRecording, audioStream]);

  if (!isRecording) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: "multiply" }}
    />
  );
}

