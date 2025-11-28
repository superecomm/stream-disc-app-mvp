const DEFAULT_DEV_URL = "http://localhost:8000";

function sanitizeRawUrl(raw: string): { sanitized: string; warned: boolean } {
  let sanitized = raw.trim();
  let warned = false;

  const markerIndex = sanitized.indexOf("NEXT_PUBLIC_ML_SERVICE_URL=");
  if (markerIndex !== -1) {
    sanitized = sanitized.slice(0, markerIndex).trim();
    warned = true;
  }

  const whitespaceIndex = sanitized.search(/\s/);
  if (whitespaceIndex !== -1) {
    sanitized = sanitized.slice(0, whitespaceIndex).trim();
    warned = true;
  }

  const urlMatch = sanitized.match(/https?:\/\/[^\s]+/i);
  if (urlMatch && urlMatch[0] !== sanitized) {
    sanitized = urlMatch[0];
    warned = true;
  }

  return { sanitized, warned };
}

export function resolveMlBaseUrl(): string {
  const isBuildEnv = Boolean(process.env.BUILD_ID);
  const isCloudRunRuntime = Boolean(process.env.K_SERVICE);

  let raw = process.env.ML_SERVICE_URL || "";

  if (!raw.trim()) {
    if (isCloudRunRuntime && !isBuildEnv) {
      throw new Error(
        "[ML] ML_SERVICE_URL is not set. Configure it in Cloud Run."
      );
    }
    raw = DEFAULT_DEV_URL;
  }

  const { sanitized, warned } = sanitizeRawUrl(raw);

  const cleaned = sanitized
    .replace(/\/extract-embedding\/?$/i, "")
    .replace(/\/+$/, "");

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[ML] base URL raw:", raw, "→ cleaned:", cleaned);
    if (warned) {
      // eslint-disable-next-line no-console
      console.warn(
        "[ML] Warning: ML_SERVICE_URL contained unexpected text. Sanitized to:",
        cleaned
      );
    }
  }

  return cleaned;
}
