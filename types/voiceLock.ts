import { Timestamp } from "firebase-admin/firestore";

export type VoiceLockResult = {
  similarityScore: number;
  grade: "A" | "B" | "C" | "D";
  serial: string;
};

export type VoiceLockProfile = {
  voiceLockId: string;
  status: "not_started" | "mobile_enrolled" | "studio_verified";
  mobileSamples: number;
  studioSamples: number;
  studioVerified: boolean;
  datasetCompletion: number; // 0-100
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Legacy fields for backward compatibility
  hasVoiceLock?: boolean;
  samplesCount?: number;
  calibrationLevel?: number;
};

export type VoiceLockSession = {
  userId: string;
  sessionId: string;
  phrasesCount: number;
  createdAt: Timestamp;
  source: "mobile" | "studio";
  audioUrl?: string;
  datasetId?: string; // Link to dataset
  studioId?: string; // Studio unique identifier (if studio session)
  studioName?: string; // Studio name (if studio session)
  vocalType?: "speech" | "singing" | "rapping" | "other"; // Type of vocal sample
  verified?: boolean; // Whether studio has verified this session
};

export type VoiceLockDataset = {
  userId: string;
  datasetId: string;
  name: string;
  status: "not_started" | "mobile_enrolled" | "studio_verified";
  mobileSamples: number;
  studioSamples: number;
  studioVerified: boolean;
  datasetCompletion: number; // 0-100
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean; // Current active dataset
  primaryStudioId?: string; // User's primary studio
};

export type VoiceLockVerification = {
  userId: string;
  assetId: string;
  similarityScore: number;
  grade: "A" | "B" | "C" | "D";
  serial: string;
  createdAt: Timestamp;
};

export type UserDoc = {
  email: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

