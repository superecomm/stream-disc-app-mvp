// LLM Model Stubs - GPT, Claude, etc.
import type { ModelResponse } from "./modelRegistry";

export async function processGPT(text: string): Promise<ModelResponse> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Simulated response
  return {
    text: `This is a simulated GPT-5.1 response to: "${text}". In production, this would call OpenAI's API.`,
  };
}

export async function processClaude(text: string): Promise<ModelResponse> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simulated response
  return {
    text: `This is a simulated Claude 3.5 response to: "${text}". In production, this would call Anthropic's API.`,
  };
}

