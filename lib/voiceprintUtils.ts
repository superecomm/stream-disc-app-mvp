/**
 * Utility functions for voiceprint operations.
 * Handles cosine similarity computation and embedding averaging.
 */

/**
 * Compute cosine similarity between two embedding vectors.
 * 
 * @param vec1 First embedding vector
 * @param vec2 Second embedding vector
 * @returns Cosine similarity score (0-1, where 1 is identical)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error(
      `Vector dimension mismatch: ${vec1.length} vs ${vec2.length}`
    );
  }

  // Compute dot product
  let dotProduct = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
  }

  // Compute magnitudes
  const magnitude1 = Math.sqrt(
    vec1.reduce((sum, val) => sum + val * val, 0)
  );
  const magnitude2 = Math.sqrt(
    vec2.reduce((sum, val) => sum + val * val, 0)
  );

  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  // Cosine similarity
  const similarity = dotProduct / (magnitude1 * magnitude2);

  // Clamp to [0, 1] range
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Average multiple embeddings into a single voiceprint.
 * 
 * @param embeddings Array of embedding vectors
 * @returns Averaged embedding vector
 */
export function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) {
    throw new Error("Cannot average empty array of embeddings");
  }

  const dimensions = embeddings[0].length;
  
  // Validate all embeddings have same dimensions
  for (const emb of embeddings) {
    if (emb.length !== dimensions) {
      throw new Error(
        `Embedding dimension mismatch: expected ${dimensions}, got ${emb.length}`
      );
    }
  }

  // Compute average
  const averaged = new Array(dimensions).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dimensions; i++) {
      averaged[i] += emb[i];
    }
  }

  // Divide by count
  for (let i = 0; i < dimensions; i++) {
    averaged[i] /= embeddings.length;
  }

  // Normalize the averaged vector (L2 normalization)
  const magnitude = Math.sqrt(
    averaged.reduce((sum, val) => sum + val * val, 0)
  );
  
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      averaged[i] /= magnitude;
    }
  }

  return averaged;
}

/**
 * Find the best matching voiceprint from a list.
 * 
 * @param queryEmbedding Query embedding to match
 * @param voiceprints Array of voiceprints with embeddings
 * @param threshold Minimum similarity threshold (default: 0.7)
 * @returns Best match or null if below threshold
 */
export function findBestMatch(
  queryEmbedding: number[],
  voiceprints: Array<{ userId: string; voiceprintId: string; embedding: number[] }>,
  threshold: number = 0.7
): { userId: string; voiceprintId: string; similarity: number } | null {
  let bestMatch: { userId: string; voiceprintId: string; similarity: number } | null = null;
  let bestSimilarity = threshold;

  for (const voiceprint of voiceprints) {
    const similarity = cosineSimilarity(queryEmbedding, voiceprint.embedding);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = {
        userId: voiceprint.userId,
        voiceprintId: voiceprint.voiceprintId,
        similarity,
      };
    }
  }

  return bestMatch;
}

