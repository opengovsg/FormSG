# Migrate LLM provider from Azure AI Foundry to Pair Foundry

## Problem Statement

FormSG's Magic Form Builder (MFB) — the feature that lets admins generate form fields from a text prompt or images of a paper form — currently calls Azure AI Foundry via the `openai` npm package's `AzureOpenAI` client. As a Singapore Government product, FormSG should be using Pair Foundry's PX Engine (`engine.pair.gov.sg`), the whole-of-government LLM gateway, instead of a tenant-specific Azure deployment.

Staying on Azure AI Foundry also blocks adoption of newer models exposed through Pair Foundry, which we want for an upcoming follow-up that introduces structured outputs (via ai-sdk `generateText` since `generateObject` will be deprecated) to reduce flakiness in MFB output parsing.

## Solution

Swap the underlying LLM provider for MFB (and any future in-app LLM features) from Azure AI Foundry to Pair Foundry's PX Engine. All connection settings — provider name, API key, base URL, model name — are parameterised in the backend's convict config and supplied via env vars sourced from AWS SSM Parameter Store in production, so future model/endpoint changes don't require code edits.

Under the hood, the LLM client wrapper switches from the `openai` npm package's `AzureOpenAI` client to the Vercel AI SDK (`ai` package + `@ai-sdk/openai`'s `createOpenAI` provider pointed at PX Engine's OpenAI-compatible HTTP surface). This is a behaviour-preserving swap from the user's perspective: MFB continues to generate form fields from text and image prompts; output quality may shift due to the underlying model change but the feature contract is unchanged.

## User Stories

1. As a FormSG admin using Magic Form Builder, I want to generate form fields from a text prompt, so that I can build forms faster without manually adding each field.
2. As a FormSG admin using Magic Form Builder, I want to upload images of a paper form and have form fields generated from them, so that I can digitise existing paper forms quickly.
3. As a FormSG admin, I want MFB to continue working without interruption after the provider migration, so that my workflow is not disrupted.
4. As a FormSG admin, I want MFB output to follow the same form-field structure (titles, field types, required flags, options, table columns, statements, etc.), so that the generated form remains immediately editable.
5. As a FormSG admin, I want vision-based MFB to keep generating sectioned, ordered fields matching the source paper form, so that the generated form is faithful to the original.
6. As a FormSG operator/SRE, I want the LLM provider's API key, base URL, model name, and provider name to be configurable via AWS SSM Parameter Store, so that we can rotate credentials and change endpoints without redeploying code.
7. As a FormSG operator/SRE, I want a clear rollback path if Pair Foundry misbehaves, so that I can revert the change and redeploy quickly.
8. As a FormSG operator/SRE, I want stale Azure-specific config and env vars removed in the same change, so that SSM / IaC stops carrying dead parameters.
9. As a FormSG developer, I want the internal LLM client API to use Vercel AI SDK native types (`CoreMessage`, ai-sdk options), so that future LLM features (streaming, tool use, structured outputs) plug in cleanly.
10. As a FormSG developer, I want `sendPromptToModel` to remain the single seam between application code and the LLM provider, so that future provider swaps stay isolated to one file.
11. As a FormSG developer, I want JSON-mode (`response_format: { type: 'json_object' }`) preserved for both text and vision MFB flows, so that downstream `JSON.parse` + zod validation continues to work without flakiness regression.
12. As a FormSG developer, I want LLM-call errors to map to the existing `ModelGetClientFailureError` / `ModelResponseFailureError` domain errors, so that error-handling code paths in MFB controllers and the assistance service don't need to change.
13. As a FormSG developer, I want the `openai` npm package removed from `apps/backend` once it's no longer imported anywhere, so that the lockfile and bundle don't carry dead weight.
14. As a FormSG developer, I want the ADR for this migration documented under `docs/adr/`, so that future contributors understand why we point at a non-OpenAI base URL and use a specific model variant.
15. As a FormSG developer reviewing this change, I want the PR split into reviewable conventional commits, so that each step of the migration (config, wrapper rewrite, prompt rewrite, cleanup, ADR) can be reviewed and reasoned about independently.
16. As a FormSG developer, I want unit tests for the new `ai-model` wrapper covering message/options forwarding, JSON-mode plumbing, error mapping, and null-response handling, so that the migration has a safety net even though existing assistance-service tests mock the wrapper.
17. As a FormSG developer working on a follow-up PR, I want the wrapper structured so that swapping `generateText` for `generateObject` (structured outputs) requires minimal additional change, so that we can land the structured-outputs improvement next without revisiting the migration scaffolding.

## Implementation Decisions

### Modules

- **`ai-model` LLM client wrapper** (`apps/backend/src/app/modules/form/admin-form/ai-model.ts`) is a *deep module*: a single exported function `sendPromptToModel({ messages, options, formId })` encapsulates Vercel AI SDK provider construction, the `providerOptions.openai.responseFormat` plumbing, and translation of ai-sdk errors into the existing `ModelGetClientFailureError` / `ModelResponseFailureError` domain errors. Internals are fully rewritten; the function signature stays a stable seam for `admin-form.assistance.service.ts`.
- **AI SDK config** (`apps/backend/src/app/config/features/aisdk.config.ts`) stays as-is: `providerName`, `apiKey`, `baseUrl`, `modelName`, all defaulting to `''`, all wired through env vars (`AI_SDK_PROVIDER_NAME`, `AI_SDK_API_KEY`, `AI_SDK_BASE_URL`, `AI_SDK_MODEL_NAME`). SSM Parameter Store supplies these env vars in prod.
- **Form-fields assistance service** (`admin-form.assistance.service.ts`) is modified, not extracted. Prompt builders (`generateFormCreationPrompt`, `generateFormCreationVisionPrompt`) are rewritten to emit ai-sdk `CoreMessage[]`. The vision-flow message rewrites `{ type: 'image_url', image_url: { url } }` content parts to ai-sdk's `{ type: 'image', image: <dataURL> }` shape.
- **Cleanup**: delete `apps/backend/src/app/config/features/azureopenai.config.ts`; remove `openai` from `apps/backend/package.json` and the pnpm lockfile; scrub `AZURE_OPENAI_*` env-var references in repo `.env` examples, docs, and any IaC manifests that live in this repo (the deployment-IaC repo, if separate, is handled in a follow-up).

### Vercel AI SDK adoption

- The `ai` package is added as a new backend dependency. `@ai-sdk/openai` is already installed.
- `sendPromptToModel` internally calls ai-sdk's `generateText`. We do not adopt `generateObject` in this PR — structured outputs are a separate follow-up.
- Internal types exposed to `admin-form.assistance.service.ts` become ai-sdk native (`CoreMessage`, `ModelMessage`), replacing the current `ChatCompletionMessageParam` (from the `openai` SDK) and the local `Role` enum / `Message` alias. Application code builds prompts directly in ai-sdk shape.
- `temperature` is left unset on the call — the wrapper inherits model defaults. Callers retain the ability to pass it via the `options` pass-through.

### Provider configuration

- The `@ai-sdk/openai` provider is constructed once per call with `createOpenAI({ name: aisdkConfig.providerName, baseURL: aisdkConfig.baseUrl, apiKey: aisdkConfig.apiKey })` and `.chat(aisdkConfig.modelName)` selects the model.
- Model: default and prod target is `claude-sonnet-4-5-20250929-v1:rsn` (Claude Sonnet 4.5 reasoning variant exposed by PX Engine; verified to support both image content parts and `response_format: json_object`). The same model serves both the text-prompt and the vision-prompt MFB flows.
- JSON mode is preserved per-call via `providerOptions: { openai: { responseFormat: { type: 'json_object' } } }`. Downstream `JSON.parse` + zod validation in `admin-form.assistance.service.ts` is unchanged.

### Rollout

- Hard swap, no feature flag. Rollback is via revert + redeploy + SSM, consistent with how FormSG handles other LLM/provider configuration today.
- No staged rollout: 100% of MFB users move to Pair Foundry at deploy.

### Error contract

- The wrapper continues to surface `ModelGetClientFailureError` (provider/client construction failure) and `ModelResponseFailureError` (request failure or empty response). Returning `null` on missing message content remains the contract for "model responded but produced nothing usable".

### Review and commit hygiene

- The PR is split into conventional commits (one logical step per commit: config defaults, wrapper rewrite, prompt rewrite, cleanup, ADR) so that the reviewer can step through it commit-by-commit. This came out of the grilling session and is recorded in the ADR's "Implementation considerations" section.

### Documentation

- `docs/adr/0001-pair-foundry-llm-provider.md` records the decision (context, decision points, consequences, implementation considerations). Already written.

## Testing Decisions

### What makes a good test here

Tests should assert observable external behaviour of the `ai-model` wrapper — what messages and options were passed to the underlying ai-sdk call, what errors callers see, what return values they get for happy and degenerate model responses — without coupling to the structure of internal helpers. Mocking happens at the ai-sdk boundary (`generateText`), not deeper. Tests should remain valid if we later swap `generateText` for `generateObject` provided the externally observable contract of `sendPromptToModel` is preserved.

### Module under test

- **`ai-model` wrapper** (`sendPromptToModel`). New spec colocated with the existing assistance tests. Coverage targets:
  - Happy path: messages and `providerOptions.openai.responseFormat` are forwarded to the mocked ai-sdk call; the text payload from the model is returned to the caller.
  - Null/empty response: a model response with no content returns `null` to the caller (matches today's contract used by `admin-form.assistance.service.ts`).
  - Client construction failure: provider creation throws → wrapper returns a `ResultAsync` err of `ModelGetClientFailureError`.
  - Request failure: ai-sdk `generateText` rejects → wrapper returns a `ResultAsync` err of `ModelResponseFailureError` and logs with the supplied `formId`.
  - Options pass-through: caller-supplied options (e.g. `temperature`, `providerOptions`) reach the ai-sdk call, with the wrapper's own response-format option layered correctly.

### Prior art

- `apps/backend/src/app/modules/form/admin-form/__tests__/admin-form.assistance.service.spec.ts` is the closest neighbour — it uses `jest.mock` + `jest.mocked(AiModel).sendPromptToModel` to stub the wrapper from the outside. The new wrapper spec mirrors this style but mocks one level deeper (the ai-sdk `generateText`/provider import) instead.

### Out-of-scope tests

- No new tests for `admin-form.assistance.service.ts`: existing tests already mock `sendPromptToModel` entirely and remain valid through the swap (the mock surface doesn't care about the new ai-sdk message types).
- No live integration test against `engine.pair.gov.sg` in this PR — env-gated end-to-end coverage against Pair Foundry is a separate decision and would carry credential/CI maintenance cost.

## Out of Scope

- **Structured outputs via `generateObject`**: deferred to a follow-up PR. That PR will replace `JSON.parse` + zod safeParse with a schema-enforced `generateObject` call against `suggestedFormFieldsSchema`.
- **Streaming**: today's flows are non-streaming; this PR stays non-streaming.
- **Feature flag / staged rollout**: explicitly rejected in favour of a hard swap.
- **Splitting the LLM model by use case** (separate text vs vision models): single shared model only.
- **Refactoring prompt builders or the response parser** into separate modules: out of scope for this migration PR.
- **Cleanup of deployment-side IaC** (if it lives in a separate repo) referencing `AZURE_OPENAI_*` env vars: handled in a follow-up PR against that repo. The in-repo `.env` examples and docs are cleaned up here.
- **Adding a custom `headers` field to `aisdk.config.ts`** for Pair Foundry tracing or auditing: not needed today.

## Further Notes

- Pair Foundry's PX Engine is LiteLLM-backed and exposes an OpenAI-compatible HTTP surface. We deliberately keep the `@ai-sdk/openai` provider — not `@ai-sdk/anthropic` — because the underlying gateway speaks the OpenAI wire protocol regardless of which underlying model (`claude-sonnet-4-5-20250929-v1:rsn` here) is routed to behind it.
- The wrapper's signature (`sendPromptToModel({ messages, options, formId })`) is the single seam between application code and any LLM provider. Future provider swaps stay isolated to `ai-model.ts`.
- The `formId` parameter is logging-only — it flows into log metadata for traceability of MFB calls against forms. This is preserved.
- All env vars on the new path are namespaced `AI_SDK_*` (generic) rather than `PAIR_FOUNDRY_*` (provider-specific), so that pointing the wrapper at a different OpenAI-compatible engine in the future requires only SSM value changes, not code or config-schema changes.
