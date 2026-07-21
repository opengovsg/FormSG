# Migrate `ai-model` wrapper + both MFB flows to Pair Foundry via Vercel AI SDK

**Type:** AFK
**Triage:** ready-for-agent

## Parent

PRD: `.scratch/migrate-pair-foundry/PRD.md`
ADR: `docs/adr/0001-pair-foundry-llm-provider.md`

## What to build

Replace the Azure-OpenAI-backed Magic Form Builder (MFB) LLM client with a Vercel AI SDK client pointed at Pair Foundry's PX Engine (`engine.pair.gov.sg`). The single application-facing seam — `sendPromptToModel({ messages, options, formId })` — keeps its function signature, but its internals are fully rewritten on top of ai-sdk's `generateText` (using `@ai-sdk/openai`'s `createOpenAI` provider). The `Message` and options types exposed to callers become ai-sdk native (`CoreMessage` / `ModelMessage`).

Both MFB flows (text-prompt and vision-prompt) are switched over together because changing the exported `Message` type forces both callers to update in the same change. The vision flow rewrites its content parts from the OpenAI shape (`{ type: 'image_url', image_url: { url } }`) to ai-sdk's (`{ type: 'image', image: <dataURL> }`). JSON-mode is preserved per-call via `providerOptions.openai.responseFormat`, so downstream `JSON.parse` + zod validation in the assistance service is unchanged.

Connection settings (`providerName`, `apiKey`, `baseUrl`, `modelName`) are read from the existing `aisdkConfig` (env-var-driven, SSM-supplied in prod). The default model is `claude-x` — verified to support both image content parts and JSON mode on PX Engine — and serves both text and vision flows.

Errors from ai-sdk are mapped onto the existing `ModelGetClientFailureError` (provider/client construction failure) and `ModelResponseFailureError` (request failure or empty response) so that error-handling code paths in MFB controllers and the assistance service remain untouched. A null return for missing message content stays the contract for "model responded but produced nothing usable."

New unit tests for the wrapper cover message/options forwarding, JSON-mode plumbing, error mapping, and null-response handling. The wrapper mocks ai-sdk at the `generateText` boundary, not deeper. Existing `admin-form.assistance.service` tests continue to mock `sendPromptToModel` directly and remain valid through the swap.

The PR is structured as conventional commits (one logical step per commit: dependency add, wrapper rewrite, prompt rewrite, wrapper tests) so reviewers can step through it commit-by-commit, per the ADR's implementation considerations.

## Acceptance criteria

- [ ] `ai` package added to `apps/backend/package.json` and pnpm lockfile; `@ai-sdk/openai` already present.
- [ ] `ai-model.ts` no longer imports anything from the `openai` npm package; uses `createOpenAI` from `@ai-sdk/openai` plus ai-sdk's `generateText`.
- [ ] `ai-model.ts` reads `providerName`, `apiKey`, `baseUrl`, `modelName` from `aisdkConfig`; passes `providerName` as the provider `name`, `baseUrl` as `baseURL`, `apiKey` as `apiKey`, and `.chat(modelName)` selects the model.
- [ ] `sendPromptToModel({ messages, options, formId })` retains its three named parameters and its `ResultAsync<string | null, ModelGetClientFailureError | ModelResponseFailureError>` return type.
- [ ] `Message` re-exported by `ai-model.ts` is ai-sdk's `CoreMessage` (or `ModelMessage`); the `Role` enum is removed; callers in `admin-form.assistance.service.ts` are updated accordingly.
- [ ] JSON-mode (`response_format: { type: 'json_object' }`) is plumbed via `providerOptions: { openai: { responseFormat: { type: 'json_object' } } }` on each call from the text and vision prompt flows.
- [ ] Vision-flow content parts use ai-sdk's `{ type: 'image', image: <dataURL> }` shape; the `image_url` shape no longer appears in the prompt builders.
- [ ] ai-sdk client-construction failures surface as `ModelGetClientFailureError`; ai-sdk request failures surface as `ModelResponseFailureError`; empty/missing model responses return `null`.
- [ ] `temperature` is not pinned inside the wrapper; callers can still pass it via `options`.
- [ ] New unit tests added for the `ai-model` wrapper covering: happy-path forwarding of messages and `providerOptions.openai.responseFormat`; null/empty response → `null`; provider construction failure → `ModelGetClientFailureError`; ai-sdk request failure → `ModelResponseFailureError` with `formId` in the log meta; options pass-through (caller options layered correctly with the wrapper's own).
- [ ] Existing `admin-form.assistance.service.spec.ts` continues to pass without modification to its mocks.
- [ ] Backend type-checks, lints, and tests pass.
- [ ] Manual smoke: text-prompt MFB generates expected JSON form fields end-to-end against PX Engine; vision-prompt MFB does the same with an uploaded image.
- [ ] Commits follow conventional commits and are reviewable in sequence.

## Blocked by

None — can start immediately.
