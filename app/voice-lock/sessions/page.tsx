"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { UserAvatar } from "@/components/UserAvatar";
import { ChatMessage } from "@/components/ChatMessage";
import type { VoiceLockSession, ChatMessage as ChatMessageType } from "@/types/voiceLock";

export default function ChatSessionsPage() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<VoiceLockSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<VoiceLockSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchSessions();
    }
  }, [currentUser]);

  const fetchSessions = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/voice-lock/sessions?userId=${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        // Filter to only show sessions with chat messages
        const chatSessions = (data.sessions || []).filter(
          (session: VoiceLockSession) => session.chatMessages && session.chatMessages.length > 0
        );
        setSessions(chatSessions);
        if (chatSessions.length > 0 && !selectedSession) {
          setSelectedSession(chatSessions[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getSessionTitle = (session: VoiceLockSession) => {
    const date = formatDate(session.createdAt);
    return `Session ${date}`;
  };

  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#FFFFFF', color: '#111111' }}>
        {/* Top Nav Bar */}
        <header className="sticky top-0 z-40" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between px-4 h-14">
            <div className="w-8" /> {/* Spacer */}
            <h1 className="text-sm font-medium text-[#111111]">Chat Sessions</h1>
            <UserAvatar />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Session List */}
          <div className="w-64 border-r border-[#E5E7EB] bg-[#F7F7F8] overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-[#111111] mb-4">Sessions</h2>
              {loading ? (
                <div className="text-sm text-slate-500">Loading...</div>
              ) : sessions.length === 0 ? (
                <div className="text-sm text-slate-500">No chat sessions yet</div>
              ) : (
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <button
                      key={session.sessionId}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedSession?.sessionId === session.sessionId
                          ? "bg-[#111111] text-white"
                          : "text-slate-700 hover:bg-white"
                      }`}
                    >
                      <div className="truncate">{getSessionTitle(session)}</div>
                      <div className={`text-xs mt-0.5 ${
                        selectedSession?.sessionId === session.sessionId
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}>
                        {session.chatMessages?.length || 0} messages
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Chat View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedSession ? (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
                  {selectedSession.chatMessages?.map((message: ChatMessageType) => (
                    <ChatMessage
                      key={message.id}
                      transcript={message.transcript}
                      audioBlob={message.audioBlobUrl ? undefined : undefined} // Audio URLs would need to be loaded
                      timestamp={new Date(message.timestamp)}
                      isUser={true}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-slate-400 text-lg">Select a session to view</p>
                  <p className="text-slate-500 text-sm mt-2">
                    {sessions.length === 0 ? "Start a voice recording session to create your first chat" : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}

