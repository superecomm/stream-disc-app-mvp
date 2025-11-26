"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";

type Profile = {
  voiceLockId: string;
  hasVoiceLock: boolean;
  samplesCount: number;
  calibrationLevel: number;
  createdAt: string;
  updatedAt: string;
};

export default function VoiceLockSetup() {
  const { currentUser } = useAuth();
  const [samplesCount, setSamplesCount] = useState(3);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Optionally fetch existing profile
  }, []);

  const handleSave = async () => {
    if (!currentUser) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/voice-lock/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          samplesCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const data = await response.json();
      setProfile(data);
      setMessage({ type: "success", text: "Profile saved successfully!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to save profile" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-8 text-emerald-400">
            VoiceLock Setup
          </h1>

          <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-200">
              Profile Status
            </h2>
            {profile ? (
              <div className="space-y-2 text-slate-300">
                <p>
                  <span className="text-slate-400">VoiceLock ID:</span>{" "}
                  <span className="font-mono text-emerald-400">
                    {profile.voiceLockId}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Samples Count:</span>{" "}
                  {profile.samplesCount}
                </p>
                <p>
                  <span className="text-slate-400">Calibration Level:</span>{" "}
                  {profile.calibrationLevel}%
                </p>
              </div>
            ) : (
              <p className="text-slate-400">Not configured</p>
            )}
          </div>

          <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-200">
              Configure VoiceLock Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  How many voice samples have you uploaded?
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={samplesCount}
                  onChange={(e) => setSamplesCount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="mt-2 text-sm text-slate-400">
                  Calibration level will be calculated based on samples count
                  (max 100%).
                </p>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-md ${
                    message.type === "success"
                      ? "bg-green-900/30 text-green-400 border border-green-500/20"
                      : "bg-red-900/30 text-red-400 border border-red-500/20"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>

              <div className="pt-4 border-t border-slate-700">
                <Link
                  href="/voice-lock/read"
                  className="block w-full px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors text-center"
                >
                  Start reading session →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}

