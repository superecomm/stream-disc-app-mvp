"use client";

import { useState, useEffect } from "react";
import { User, X, Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { NewDatasetModal } from "@/components/NewDatasetModal";
import type { ViimDataset } from "@/types/viim";

export function UserAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [datasets, setDatasets] = useState<ViimDataset[]>([]);
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && isOpen) {
      fetchDatasets();
    }
  }, [currentUser, isOpen]);

  const fetchDatasets = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/viim/datasets?userId=${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
      }
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  const handleCreateDataset = async (name: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch("/api/viim/datasets", {
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
        await fetchDatasets();
        // Refresh the page to load the new dataset
        window.location.reload();
      }
    } catch (error) {
      console.error("Error creating dataset:", error);
    }
  };

  const handleSwitchDataset = async (datasetId: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch("/api/viim/datasets/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          datasetId,
        }),
      });

      if (response.ok) {
        setIsOpen(false);
        // Refresh the page to load the new dataset
        window.location.reload();
      }
    } catch (error) {
      console.error("Error switching dataset:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/");
  };

  // Get user initials or use default
  const getInitials = () => {
    if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getAvatarUrl = () => {
    return currentUser?.photoURL || null;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative w-8 h-8 rounded-full bg-[#F7F7F8] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors border border-[#E5E7EB]"
        aria-label="User menu"
      >
        {getAvatarUrl() ? (
          <img
            src={getAvatarUrl()!}
            alt="User avatar"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-xs font-medium text-[#111111]">
            {getInitials()}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2 mb-6">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/viim/setup"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Setup
              </Link>
              <Link
                href="/viim/verify"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Verify
              </Link>
              <Link
                href="/viim/read"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Reading Session
              </Link>
              <Link
                href="/viim/sessions"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Chat Sessions
              </Link>
            </div>

            {/* Datasets Section - ChatGPT style */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3 px-4">
                <h3 className="text-sm font-semibold text-slate-900">Datasets</h3>
                <button
                  onClick={() => setShowNewDatasetModal(true)}
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="New dataset"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {datasets.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-slate-500">
                    No datasets yet. Create one to get started.
                  </div>
                ) : (
                  datasets.map((dataset) => (
                    <button
                      key={dataset.datasetId}
                      onClick={() => handleSwitchDataset(dataset.datasetId)}
                      className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                        dataset.isActive
                          ? "bg-slate-100 text-slate-900 font-medium"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm">{dataset.name}</span>
                        {dataset.isActive && (
                          <span className="ml-2 text-xs text-slate-500">●</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {Math.round(dataset.datasetCompletion)}% • {dataset.status === "studio_verified" ? "Verified" : dataset.status === "mobile_enrolled" ? "Mobile" : "New"}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="px-4 py-2 text-sm text-slate-500">
                Studio Info
              </div>
              <p className="px-4 text-xs text-slate-400">
                Coming soon
              </p>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            {currentUser && (
              <div className="mb-4 px-4 py-2 text-sm text-slate-600">
                {currentUser.email}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* New Dataset Modal */}
      <NewDatasetModal
        isOpen={showNewDatasetModal}
        onClose={() => setShowNewDatasetModal(false)}
        onCreate={handleCreateDataset}
      />
    </>
  );
}

