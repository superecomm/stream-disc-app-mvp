<!-- 2b5f445a-efba-470d-8667-d3abb31b49c2 ef58cb11-524c-46d9-bcdc-aed3e62c966d -->
# Plan
1. Scaffold server routes under `app/api/llm/` (OpenAI, Anthropic, Gemini) that call each provider with env-based API keys, normalize responses, and guard missing configs.
2. Update `lib/models/llmModels.ts` + `modelRegistry.ts` so each model hits the appropriate internal route and handles provider-specific payloads/errors.
3. Verify NeuralBox text + voice flows call the new routes, log conversation entries, and surface errors gracefully; adjust docs/env notes if needed.

### To-dos

- [ ] Create OpenAI/Anthropic/Gemini API routes
- [ ] Point llmModels/modelRegistry to new routes
- [ ] Exercise NeuralBox + env guidance