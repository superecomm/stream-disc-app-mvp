"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";

export default function Home() {
  const { currentUser, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const router = useRouter();

  // Redirect everyone to reading session (skip login for now)
  useEffect(() => {
    if (!loading) {
      router.push("/viim/read");
    }
  }, [loading, router]);

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 text-[#111111]">
              Stream Disc
            </h1>
            <p className="text-xl text-slate-600 mb-2">
              Voice Identity Intelligence Model
            </p>
            <p className="text-base text-slate-500 mt-4">
              Voice security system — functional prototype phase before AI integration
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-lg p-6 hover:border-slate-300 transition-colors">
              <h2 className="text-xl font-semibold mb-3 text-[#111111]">
                Register Your Voice
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Create your Stream Disc profile through guided reading sessions. Each recording builds your unique voice signature for authentication.
              </p>
            </div>

            <div className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-lg p-6 hover:border-slate-300 transition-colors">
              <h2 className="text-xl font-semibold mb-3 text-[#111111]">
                Secure Your Assets
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Every asset receives a Stream Disc verification score and unique serial code. Protect your original recordings and establish authenticity.
              </p>
            </div>

            <div className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-lg p-6 hover:border-slate-300 transition-colors">
              <h2 className="text-xl font-semibold mb-3 text-[#111111]">
                Track Analytics
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Monitor verification history, track dataset completion, and view detailed analytics for all your protected assets.
              </p>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-lg p-8 mb-12 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-[#111111]">
              Your Voice. Your Identity. Protected.
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Stream Disc provides biometric-grade voice authentication for artists and creators. 
              Build your voice profile through mobile sessions, then verify your assets with industry-leading security. 
              Your voice signature is unique, secure, and cannot be replicated.
            </p>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            {currentUser ? (
              <div className="space-y-4">
                <Link
                  href="/viim/read"
                  className="inline-block px-8 py-3 bg-[#111111] text-white rounded-md hover:bg-slate-800 transition-colors font-semibold"
                >
                  Start Reading Session
                </Link>
                <div className="mt-4">
                  <Link
                    href="/dashboard"
                    className="text-slate-600 hover:text-[#111111] transition-colors"
                  >
                    Go to Dashboard →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-8 py-3 bg-[#111111] text-white rounded-md hover:bg-slate-800 transition-colors font-semibold"
                >
                  Get Started
                </button>
                <p className="text-sm text-slate-500">
                  Sign up to create your Stream Disc profile
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

