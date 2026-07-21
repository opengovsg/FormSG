# Use Pair Foundry as the LLM provider for Magic Form Builder

## Context

Magic Form Builder (MFB) and other in-app LLM features previously called Azure AI Foundry via the `openai` npm package's `AzureOpenAI` client. We are migrating to Pair Foundry's PX Engine (`engine.pair.gov.sg`), the Singapore Government whole-of-government LLM gateway. PX Engine is LiteLLM-backed and OpenAI-compatible.

## Decision

- LLM access goes through Pair Foundry's PX Engine, accessed via the Vercel AI SDK (`ai` + `@ai-sdk/openai`'s `createOpenAI` provider pointed at `engine.pair.gov.sg`).
- All connection settings (`providerName`, `apiKey`, `baseUrl`, `modelName`) are parameterised in `apps/backend/src/app/config/features/aisdk.config.ts` and supplied via env vars (sourced from AWS SSM Parameter Store in prod).
- `sendPromptToModel` in `apps/backend/src/app/modules/form/admin-form/ai-model.ts` wraps ai-sdk's `generateText`. Internal types are ai-sdk-native (`CoreMessage`, etc.); callers in `admin-form.assistance.service.ts` build prompts in ai-sdk shape.
- JSON-mode is preserved per-call via `providerOptions.openai.responseFormat`. Downstream code continues to `JSON.parse` and zod-validate the response.
- Default model: `claude-sonnet-4-5-20250929-v1:rsn` (verified to support both image input and JSON mode on PX Engine). Same model serves both text-prompt and vision-prompt flows.
- Hard swap, no feature flag. Azure code (`azureopenai.config.ts`, `openai` npm package, `AZURE_OPENAI_*` env-var references) is removed in the same change. Rollback is via revert + redeploy + SSM.

## Consequences

- The application is now coupled to an OpenAI-compatible HTTP surface, but not to any specific provider — the same wrapper can point at any PX-Engine-style endpoint by changing SSM values.
- `temperature` is left unset (inherits model defaults). Reasoning models often ignore it anyway.
- Structured outputs via ai-sdk's `generateObject` (replacing the current `JSON.parse` + zod step) are explicitly deferred to a follow-up PR. This change is behaviour-preserving on the response-handling side.
- No staged rollout: a regression on Pair Foundry affects 100% of MFB users until reverted.

## Implementation considerations
- Do a review by commit and follow conventional commits to make it easy to review.