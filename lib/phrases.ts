// Standard reading phrases for VoiceLock enrollment
export const readingPhrases = [
  "This is my authentic voice for my Stream Disc artist account.",
  "VoiceLock protects my original recordings and identity.",
  "No one else is allowed to use my voice without my permission.",
];

// Solfege scale for first-time onboarding
export const solfegePhrases = [
  "Do",
  "Re",
  "Mi",
  "Fa",
  "So",
  "La",
  "Ti",
  "Do",
];

// Get phrases based on whether it's the first dataset (onboarding)
export function getPhrasesForDataset(isFirstDataset: boolean): string[] {
  if (isFirstDataset) {
    return solfegePhrases;
  }
  return readingPhrases;
}
