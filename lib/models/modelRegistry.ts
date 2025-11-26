// Model Registry - Central definition of all available AI models

export type ModelType = "asr" | "llm" | "audio" | "voiceprint";
export type ModelProvider = "openai" | "meta" | "google" | "anthropic" | "elevenlabs" | "hume" | "suno" | "runway" | "local" | "streamdisc";

export interface ModelResponse {
  text?: string;
  audio?: Blob;
  embeddings?: number[];
  timestamps?: Array<{ start: number; end: number; text: string }>;
  acousticFeatures?: Record<string, any>;
  error?: string;
}

export interface Model {
  id: string;
  name: string;
  type: ModelType;
  description: string;
  provider: ModelProvider;
  costPerMinute?: number;
  supportsAudio: boolean;
  supportsText: boolean;
  processAudio?: (audio: Blob) => Promise<ModelResponse>;
  processText?: (text: string) => Promise<ModelResponse>;
  icon?: string;
}

// ASR Models (Speech Recognition)
export const asrModels: Model[] = [
  {
    id: "whisper",
    name: "Whisper",
    type: "asr",
    description: "OpenAI's state-of-the-art speech recognition",
    provider: "openai",
    costPerMinute: 0.006,
    supportsAudio: true,
    supportsText: false,
  },
  {
    id: "wav2vec",
    name: "Wav2vec",
    type: "asr",
    description: "Meta's self-supervised speech recognition",
    provider: "meta",
    costPerMinute: 0.002,
    supportsAudio: true,
    supportsText: false,
  },
  {
    id: "hubert",
    name: "HuBERT",
    type: "asr",
    description: "Meta's hidden unit BERT for speech",
    provider: "meta",
    costPerMinute: 0.003,
    supportsAudio: true,
    supportsText: false,
  },
  {
    id: "encodec",
    name: "EnCodec",
    type: "asr",
    description: "Neural codec for high-fidelity audio compression",
    provider: "meta",
    costPerMinute: 0.004,
    supportsAudio: true,
    supportsText: false,
  },
  {
    id: "conformer",
    name: "Conformer",
    type: "asr",
    description: "Google's convolution-augmented transformer",
    provider: "google",
    costPerMinute: 0.005,
    supportsAudio: true,
    supportsText: false,
  },
];

// LLM Models (Text Generation)
export const llmModels: Model[] = [
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    type: "llm",
    description: "OpenAI's latest language model",
    provider: "openai",
    costPerMinute: 0.01,
    supportsAudio: false,
    supportsText: true,
  },
  {
    id: "claude-3.5",
    name: "Claude 3.5",
    type: "llm",
    description: "Anthropic's advanced AI assistant",
    provider: "anthropic",
    costPerMinute: 0.012,
    supportsAudio: false,
    supportsText: true,
  },
];

// Audio Generation Models
export const audioModels: Model[] = [
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    type: "audio",
    description: "High-quality voice synthesis",
    provider: "elevenlabs",
    costPerMinute: 0.03,
    supportsAudio: true,
    supportsText: true,
  },
  {
    id: "suno",
    name: "Suno",
    type: "audio",
    description: "AI music generation",
    provider: "suno",
    costPerMinute: 0.05,
    supportsAudio: true,
    supportsText: true,
  },
  {
    id: "hume",
    name: "Hume",
    type: "audio",
    description: "Emotionally intelligent voice AI",
    provider: "hume",
    costPerMinute: 0.04,
    supportsAudio: true,
    supportsText: true,
  },
  {
    id: "runway",
    name: "Runway",
    type: "audio",
    description: "Creative audio generation",
    provider: "runway",
    costPerMinute: 0.06,
    supportsAudio: true,
    supportsText: true,
  },
];

// Voiceprint/Identity Models
export const voiceprintModels: Model[] = [
  {
    id: "streamdisc",
    name: "Stream Disc",
    type: "voiceprint",
    description: "Voice identity intelligence model - always active",
    provider: "streamdisc",
    costPerMinute: 0,
    supportsAudio: true,
    supportsText: false,
  },
];

// All models combined
export const allModels: Model[] = [
  ...asrModels,
  ...llmModels,
  ...audioModels,
  ...voiceprintModels,
];

// Helper functions
export function getModelById(id: string): Model | undefined {
  return allModels.find((m) => m.id === id);
}

export function getModelsByType(type: ModelType): Model[] {
  return allModels.filter((m) => m.type === type);
}

export function getModelsForMode(mode: "voice" | "text"): Model[] {
  if (mode === "voice") {
    return allModels.filter((m) => m.supportsAudio);
  } else {
    return allModels.filter((m) => m.supportsText);
  }
}

