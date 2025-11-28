/**
 * Client for communicating with the Python ML service.
 * Handles embedding extraction and similarity computation.
 */

import { resolveMlBaseUrl } from "@/lib/mlBaseUrl";

type MlRequestOptions = {
  baseUrl?: string;
};

export interface ExtractEmbeddingOptions extends MlRequestOptions {
  userId?: string;
  mode?: string;
  voiceprintId?: string;
}

function resolveServiceUrl(options?: MlRequestOptions): string {
  if (options?.baseUrl) {
    return options.baseUrl;
  }

  if (typeof window === "undefined") {
    return resolveMlBaseUrl();
  }

  const raw = (process.env.NEXT_PUBLIC_ML_SERVICE_URL || "").trim();

  if (!raw) {
    throw new Error(
      "NEXT_PUBLIC_ML_SERVICE_URL is not set. Configure it for client-side ML calls."
    );
  }

  return raw.replace(/\/extract-embedding\/?$/i, "").replace(/\/+$/, "");
}

export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
  audio_duration: number;
}

export interface SimilarityResponse {
  similarity: number;
  match: boolean;
  threshold: number;
}

/**
 * Extract speaker embedding from audio blob.
 * 
 * @param audioBlob Audio file as Blob
 * @param userId Optional user ID for database storage
 * @param mode Optional mode ('test', 'enroll', 'identify')
 * @param voiceprintId Optional voiceprint ID for enrollment
 * @returns Embedding vector and metadata
 */
export async function extractEmbedding(
  audioBlob: Blob,
  options: ExtractEmbeddingOptions = {}
): Promise<EmbeddingResponse> {
  try {
    const { userId, mode, voiceprintId } = options;
    const serviceUrl = resolveServiceUrl(options);

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    
    if (userId) {
      formData.append("user_id", userId);
    }
    if (mode) {
      formData.append("mode", mode);
    }
    if (voiceprintId) {
      formData.append("voiceprint_id", voiceprintId);
    }

    const response = await fetch(`${serviceUrl}/extract-embedding`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.detail || "Failed to extract embedding");
    }

    const data = await response.json();
    return data as EmbeddingResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`ML service error: ${error.message}`);
    }
    throw new Error("Unknown error extracting embedding");
  }
}

/**
 * Compute cosine similarity between two embeddings.
 * 
 * @param emb1 First embedding vector
 * @param emb2 Second embedding vector
 * @param threshold Similarity threshold (default: 0.7)
 * @returns Similarity score and match status
 */
export async function computeSimilarity(
  emb1: number[],
  emb2: number[],
  threshold: number = 0.7,
  options: MlRequestOptions = {}
): Promise<SimilarityResponse> {
  try {
    const serviceUrl = resolveServiceUrl(options);
    const response = await fetch(
      `${serviceUrl}/compute-similarity?threshold=${threshold}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embedding1: emb1,
          embedding2: emb2,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.detail || "Failed to compute similarity");
    }

    const data = await response.json();
    return data as SimilarityResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`ML service error: ${error.message}`);
    }
    throw new Error("Unknown error computing similarity");
  }
}

/**
 * Search for nearest recordings by embedding similarity.
 * 
 * @param embedding Embedding vector to search for
 * @param threshold Minimum similarity threshold (default: 0.5)
 * @param limit Maximum number of results (default: 3)
 * @param recordingId Optional recording ID to exclude from results
 * @returns Search results with matching recordings
 */
export interface SearchResult {
  count: number;
  matches: Array<{
    recording_id: string;
    user_id: string | null;
    similarity: number;
    created_at: string;
    mode: string;
    filename: string;
    duration_seconds: number;
    voiceprint_id: string | null;
  }>;
}

export async function searchRecordings(
  embedding: number[],
  threshold: number = 0.5,
  limit: number = 3,
  recordingId?: string,
  options: MlRequestOptions = {}
): Promise<SearchResult> {
  try {
    const serviceUrl = resolveServiceUrl(options);
    const response = await fetch(
      `${serviceUrl}/recordings/search?threshold=${threshold}&limit=${limit}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query_embedding: embedding,
          recording_id: recordingId || null,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.detail || "Failed to search recordings");
    }

    const data = await response.json();
    return data as SearchResult;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`ML service error: ${error.message}`);
    }
    throw new Error("Unknown error searching recordings");
  }
}

/**
 * Check if ML service is healthy.
 * 
 * @returns True if service is available
 */
export async function checkMLServiceHealth(
  options: MlRequestOptions = {}
): Promise<boolean> {
  try {
    const serviceUrl = resolveServiceUrl(options);
    const response = await fetch(`${serviceUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === "healthy";
  } catch (error) {
    return false;
  }
}

