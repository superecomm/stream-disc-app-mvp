// LLM Model plumbing – routes to real provider APIs
import type { ModelResponse } from "./modelRegistry";

async function callLLMEndpoint(
  endpoint: string,
  payload: Record<string, unknown>,
  label: string
): Promise<ModelResponse> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || data?.error) {
      const message = data?.error ?? `Failed to reach ${label}`;
      return { error: message };
    }

    return { text: data.text ?? "" };
  } catch (error) {
    console.error(`[LLM:${label}]`, error);
    return { error: `Unable to reach ${label}` };
  }
}

export async function processGPT(text: string): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/openai",
    { prompt: text, model: "gpt-4o-mini" },
    "GPT-5.1"
  );
}

export async function processGPTCode(text: string): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/openai",
    { prompt: text, model: "o4-mini" },
    "GPT-5.1 Code"
  );
}

export async function processClaude(text: string): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/anthropic",
    { prompt: text, model: "claude-3-5-haiku-20241022" },
    "Claude 3.5"
  );
}

export async function processSonnet(text: string): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/anthropic",
    { prompt: text, model: "claude-3-5-sonnet-20240620" },
    "Sonnet 4.5"
  );
}

export async function processGemini(text: string): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/gemini",
    { prompt: text, model: "gemini-1.5-pro-latest" },
    "Gemini 3 Pro"
  );
}

async function simulateLLMResponse(modelName: string, text: string, latency = 1200): Promise<ModelResponse> {
  await new Promise((resolve) => setTimeout(resolve, latency));
  return {
    text: `[${modelName}] Synthetic response to: "${text}".`,
  };
}

export async function processGrok(text: string): Promise<ModelResponse> {
  return simulateLLMResponse("Grok 3", text, 1350);
}

export async function processCursor(text: string): Promise<ModelResponse> {
  return simulateLLMResponse("Cursor Max", text, 1000);
}

