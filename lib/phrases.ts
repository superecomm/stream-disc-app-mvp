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

// Split a phrase into words for word-by-word display (for reading phrases)
export function splitPhraseIntoWords(phrase: string): string[] {
  // Split by spaces and filter out empty strings
  return phrase.split(/\s+/).filter(word => word.length > 0);
}

// Get all displayable items for a set of phrases
// For Solfege: returns phrases as-is (single items)
// For reading phrases: splits each phrase into words and flattens
export function getDisplayItems(phrases: string[], isSolfege: boolean): string[] {
  if (isSolfege) {
    // Solfege phrases are already single items
    return phrases;
  } else {
    // For reading phrases, split each phrase into words
    return phrases.flatMap(phrase => splitPhraseIntoWords(phrase));
  }
}
