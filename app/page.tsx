"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // Redirect to beta test page to focus on AI/ML fingerprinting functionality
  useEffect(() => {
    router.push("/viim/beta-test");
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Stream Disc Beta Test...</p>
      </div>
    </div>
  );
}
