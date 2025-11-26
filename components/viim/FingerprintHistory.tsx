"use client";

import { Fingerprint, Clock, Copy, Check } from "lucide-react";
import { useState } from "react";

interface FingerprintRecord {
  id: string;
  fingerprint: string;
  timestamp: Date;
  mlModel?: string | null;
  mlOutput?: any;
  confidence?: number;
  processingTime?: number;
  modelConnected?: boolean;
}

interface FingerprintHistoryProps {
  history: FingerprintRecord[];
  onSelect?: (record: FingerprintRecord) => void;
}

export function FingerprintHistory({ history, onSelect }: FingerprintHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (fingerprint: string, id: string) => {
    try {
      await navigator.clipboard.writeText(fingerprint);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (history.length === 0) {
    return (
      <div className="mt-6 text-center text-gray-400 text-sm">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>No history yet</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {history.map((record) => (
        <div
          key={record.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
          onClick={() => onSelect?.(record)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {record.timestamp.toLocaleString()}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(record.fingerprint, record.id);
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy fingerprint"
            >
              {copiedId === record.id ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          <div className="font-mono text-xs text-gray-700 break-all bg-gray-50 p-2 rounded border border-gray-200">
            {record.fingerprint}
          </div>
          {record.mlModel && (
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">Model:</span> {record.mlModel}
              {record.confidence && (
                <span className="ml-2">
                  <span className="font-medium">Confidence:</span>{" "}
                  {(record.confidence * 100).toFixed(1)}%
                </span>
              )}
            </div>
          )}
          {record.processingTime && (
            <div className="mt-1 text-xs text-gray-500">
              Processed in {record.processingTime}ms
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

