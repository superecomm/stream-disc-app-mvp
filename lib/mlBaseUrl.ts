const DEFAULT_DEV_URL = "http://localhost:8000";

export function getMlBaseUrl(): string {
  const isBuildEnv = Boolean(process.env.BUILD_ID);
  const isCloudRunRuntime = Boolean(process.env.K_SERVICE);

  let raw =
    process.env.ML_SERVICE_URL ||
    process.env.NEXT_PUBLIC_ML_SERVICE_URL ||
    "";

  raw = raw.trim();

  if (!raw) {
    if (isCloudRunRuntime && !isBuildEnv) {
      throw new Error(
        "[Config] ML_SERVICE_URL is not set. It must be the base URL of the ML service (e.g. https://viim-ml-service-xxxxx-uc.a.run.app)."
      );
    }
    raw = DEFAULT_DEV_URL;
  }

  const cleaned = raw
    .replace(/\/extract-embedding\/?$/i, "")
    .replace(/\/+$/, "");

  if (process.env.NODE_ENV !== "production" || isBuildEnv) {
    // eslint-disable-next-line no-console
    console.log("[VIIM] ML base URL raw:", raw, "cleaned:", cleaned);
  }

  return cleaned;
}
