"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { StatsCards } from "@/components/StatsCards";
import { VerificationsTable } from "@/components/VerificationsTable";

type Verification = {
  assetId: string;
  similarityScore: number;
  grade: "A" | "B" | "C" | "D";
  serial: string;
  createdAt: string;
};

type Stats = {
  totalVerifications: number;
  uniqueAssetsCount: number;
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalVerifications: 0,
    uniqueAssetsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchVerifications = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `/api/voice-lock/verifications?userId=${currentUser.uid}`
      );
      const data = await response.json();
      setVerifications(data.verifications || []);
      setStats(data.stats || { totalVerifications: 0, uniqueAssetsCount: 0 });
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchVerifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-8 text-emerald-400">
            Dashboard
          </h1>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : (
            <>
              <StatsCards
                totalVerifications={stats.totalVerifications}
                uniqueAssetsCount={stats.uniqueAssetsCount}
              />
              <div>
                <h2 className="text-xl font-semibold mb-4 text-slate-200">
                  Recent Verifications
                </h2>
                <VerificationsTable verifications={verifications} />
              </div>
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

