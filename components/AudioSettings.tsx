"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, Mic, Video, VideoOff } from "lucide-react";

type AudioSettingsProps = {
  onDeviceChange?: (deviceId: string) => void;
  onVideoToggle?: (enabled: boolean) => void;
  videoEnabled?: boolean;
};

export function AudioSettings({ onDeviceChange, onVideoToggle, videoEnabled = false }: AudioSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      // Get all audio input devices
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceList.filter(device => device.kind === "audioinput");
      setDevices(audioInputs);

      // Try to get the default device and auto-connect
      if (audioInputs.length > 0) {
        const defaultDevice = audioInputs.find(d => d.deviceId === "default") || audioInputs[0];
        setSelectedDevice(defaultDevice.deviceId);
        if (onDeviceChange) {
          onDeviceChange(defaultDevice.deviceId);
        }
      }
    } catch (error) {
      console.error("Error loading audio devices:", error);
      setHasPermission(false);
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
    if (onDeviceChange) {
      onDeviceChange(deviceId);
    }
    setIsOpen(false);
  };

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      await loadDevices();
    } catch (error) {
      console.error("Permission denied:", error);
      setHasPermission(false);
    }
  };

  // Check if no devices are available
  const hasNoDevices = hasPermission !== false && devices.length === 0;

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (hasPermission === false) {
            requestPermission();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="w-10 h-10 rounded-full bg-[#F7F7F8] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors border border-[#E5E7EB] relative"
        aria-label="Audio settings"
      >
        <Settings className="w-4 h-4 text-[#111111]" />
        {hasNoDevices && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && hasPermission && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50">
            <div className="p-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111111]">Audio Input</h3>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {devices.length === 0 ? (
                <div className="p-3 text-sm text-slate-500">No audio devices found</div>
              ) : (
                devices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => handleDeviceSelect(device.deviceId)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      selectedDevice === device.deviceId
                        ? "bg-[#F7F7F8] text-[#111111] font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mic className="w-3 h-3" />
                      <span className="truncate">{device.label || `Microphone ${device.deviceId.slice(0, 8)}`}</span>
                      {selectedDevice === device.deviceId && (
                        <span className="ml-auto text-xs text-slate-500">●</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="p-2 border-t border-[#E5E7EB] space-y-2">
              <button
                onClick={async () => {
                  try {
                    // Request permission again to refresh device list
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    const deviceList = await navigator.mediaDevices.enumerateDevices();
                    const audioInputs = deviceList.filter(device => device.kind === "audioinput");
                    setDevices(audioInputs);
                    
                    // Auto-connect to first available device after refresh
                    if (audioInputs.length > 0 && onDeviceChange) {
                      const firstDevice = audioInputs[0];
                      setSelectedDevice(firstDevice.deviceId);
                      onDeviceChange(firstDevice.deviceId);
                    }
                  } catch (error) {
                    console.error("Error refreshing devices:", error);
                  }
                }}
                className="w-full text-xs text-slate-600 hover:text-[#111111] py-1"
              >
                Refresh devices
              </button>
              {onVideoToggle && (
                <button
                  onClick={() => {
                    onVideoToggle(!videoEnabled);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-colors ${
                    videoEnabled
                      ? "bg-[#F7F7F8] text-[#111111]"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {videoEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                    Video Recording
                  </span>
                  <span className={`text-xs ${videoEnabled ? "text-[#111111]" : "text-slate-400"}`}>
                    {videoEnabled ? "ON" : "OFF"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Permission prompt */}
      {hasPermission === false && !isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 p-3">
          <p className="text-xs text-slate-600 mb-2">Microphone access required</p>
          <button
            onClick={requestPermission}
            className="w-full px-3 py-1.5 text-xs bg-[#111111] text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            Allow Access
          </button>
        </div>
      )}
    </div>
  );
}

