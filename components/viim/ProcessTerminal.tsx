"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";

interface ProcessLog {
  timestamp: Date;
  level: "info" | "success" | "error" | "warning";
  message: string;
}

interface ProcessTerminalProps {
  logs: ProcessLog[];
}

export function ProcessTerminal({ logs }: ProcessTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: ProcessLog["level"]) => {
    switch (level) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-gray-300";
    }
  };

  const getLevelPrefix = (level: ProcessLog["level"]) => {
    switch (level) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "warning":
        return "⚠";
      default:
        return "→";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <Terminal className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-mono text-gray-400">Backend Process Log</span>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 bg-gray-900 text-xs font-mono p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
        style={{ minHeight: "200px", maxHeight: "400px" }}
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">Waiting for process to start...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-500">
                [{log.timestamp.toLocaleTimeString()}]
              </span>{" "}
              <span className={getLevelColor(log.level)}>
                {getLevelPrefix(log.level)} {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

