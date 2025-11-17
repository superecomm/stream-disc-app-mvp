"use client";

import { useState } from "react";
import { X } from "lucide-react";

type NewDatasetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
};

export function NewDatasetModal({ isOpen, onClose, onCreate }: NewDatasetModalProps) {
  const [datasetName, setDatasetName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (datasetName.trim()) {
      onCreate(datasetName.trim());
      setDatasetName("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#111111]">New Dataset</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-[#111111] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111111] mb-2">
              Dataset Name
            </label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g., Main Voice Profile, Studio Session 1"
              required
              className="w-full px-4 py-2 bg-[#F7F7F8] border border-[#E5E7EB] rounded-md text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-[#E5E7EB] text-[#111111] rounded-md hover:bg-[#F7F7F8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#111111] text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Create Dataset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

