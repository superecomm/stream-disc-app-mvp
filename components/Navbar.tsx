"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="border-b border-[#E5E7EB] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-[#111111]">
            VoiceLock™ by Stream Disc
          </Link>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-[#111111] transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/voice-lock/setup"
                  className="text-slate-600 hover:text-[#111111] transition-colors"
                >
                  Setup
                </Link>
                <Link
                  href="/voice-lock/verify"
                  className="text-slate-600 hover:text-[#111111] transition-colors"
                >
                  Verify
                </Link>
                <span className="text-slate-500 text-sm">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-[#111111] text-white rounded-md hover:bg-slate-800 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/"
                className="px-4 py-2 bg-[#111111] text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                Log in / Sign up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

