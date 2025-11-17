"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";

type Verification = {
  verificationId: string;
  userId: string;
  assetId: string;
  similarityScore: number;
  grade: "A" | "B" | "C" | "D";
  serial: string;
  createdAt: string;
};

const gradeColors = {
  A: "text-green-400",
  B: "text-blue-400",
  C: "text-yellow-400",
  D: "text-red-400",
};

export default function VoiceLockVerify() {
  const { currentUser } = useAuth();
  const [assetId, setAssetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Verification | null>(null);
  const [recentVerifications, setRecentVerifications] = useState<Verification[]>([]);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!currentUser || !assetId.trim()) {
      setError("Please enter an asset ID");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/voice-lock/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          assetId: assetId.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Verification failed");
      }

      const data = await response.json();
      setResult(data);
      setRecentVerifications((prev) => [data, ...prev].slice(0, 10));
      setAssetId("");
    } catch (err: any) {
      setError(err.message || "Failed to verify asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-8 text-emerald-400">
            VoiceLock Verification
          </h1>

          <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-200">
              Verify Asset
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Asset ID
                </label>
                <input
                  type="text"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="e.g., track_001, song_abc123"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleVerify();
                    }
                  }}
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-900/30 text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading || !assetId.trim()}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Running VoiceLock..." : "Run VoiceLock"}
              </button>
            </div>
          </div>

          {result && (
            <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-200">
                Verification Result
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Similarity Score:</span>
                  <p className="text-2xl font-bold text-emerald-400">
                    {(result.similarityScore * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Grade:</span>
                  <p
                    className={`text-2xl font-bold ${gradeColors[result.grade]}`}
                  >
                    {result.grade}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Serial:</span>
                  <p className="text-lg font-mono text-emerald-400">
                    {result.serial}
                  </p>
                </div>
              </div>
            </div>
          )}

          {recentVerifications.length > 0 && (
            <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-200">
                Recent Verifications
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                        Asset ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                        Score
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                        Grade
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                        Serial
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {recentVerifications.map((v, index) => (
                      <tr key={index} className="hover:bg-slate-800/30">
                        <td className="px-4 py-2 text-sm text-slate-300">
                          {v.assetId}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-300">
                          {(v.similarityScore * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`text-sm font-bold ${gradeColors[v.grade]}`}
                          >
                            {v.grade}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-300 font-mono">
                          {v.serial}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

