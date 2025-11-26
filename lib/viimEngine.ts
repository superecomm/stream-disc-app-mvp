import type { ViimResult } from "@/types/viim";

/**
 * VIIM Engine - Functional Prototype Phase
 * 
 * This implementation provides deterministic scoring for function, design, and demo purposes.
 * The architecture is designed to seamlessly transition to AI/ML integration in the next phase.
 * 
 * To integrate AI: Replace runViim() to call your ML service while maintaining the same interface.
 */

function hashStringToNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function scoreFromIds(userId: string, assetId: string): number {
  const h = hashStringToNumber(`${userId}:${assetId}`);
  // Map to [0.7, 0.99]
  return 0.7 + (h % 3000) / 10000; // 0.7 – 0.999
}

function gradeFromScore(score: number): "A" | "B" | "C" | "D" {
  if (score >= 0.9) return "A";
  if (score >= 0.8) return "B";
  if (score >= 0.7) return "C";
  return "D";
}

export function runViim(userId: string, assetId: string): ViimResult {
  const similarityScore = scoreFromIds(userId, assetId);
  const grade = gradeFromScore(similarityScore);
  const serialNum = Math.floor(similarityScore * 100000);
  const serial = `VIIM-${grade}-${serialNum.toString().padStart(6, "0")}`;
  return { similarityScore, grade, serial };
}

