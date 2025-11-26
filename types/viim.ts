import { Timestamp } from "firebase-admin/firestore";

export type ViimResult = {
  similarityScore: number;
  grade: "A" | "B" | "C" | "D";
  serial: string;
};

export type ViimProfile = {
  viimId: string;
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

export type ChatMessage = {
  id: string;
  transcript: string;
  timestamp: string; // ISO string
  audioBlobUrl?: string; // URL to audio file if stored
};

export type ViimSession = {
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
  transcript?: string; // Full transcript text
  chatMessages?: ChatMessage[]; // Array of chat messages for voice mode
};

export type ViimDataset = {
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

export type ViimVerification = {
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

export type Voiceprint = {
  userId: string;
  voiceprintId: string;
  embedding: number[]; // 192-dimensional vector from ECAPA-TDNN
  sampleCount: number; // Number of samples used (3-5)
  samples: VoiceprintSample[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  modelVersion: string; // "speechbrain/spkrec-ecapa-voxceleb"
};

export type VoiceprintSample = {
  sampleId: string;
  audioUrl: string; // Firebase Storage URL (optional)
  embedding: number[]; // Individual sample embedding
  duration: number; // seconds
  createdAt: Timestamp;
};

export type VoiceprintMatch = {
  userId: string;
  voiceprintId: string;
  similarity: number; // 0-1 cosine similarity
  match: boolean; // similarity > threshold
  threshold: number;
  timestamp: Timestamp;
};

