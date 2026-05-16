# Remove orphaned Azure AI Foundry artifacts

**Type:** AFK
**Triage:** ready-for-agent

## Parent

PRD: `.scratch/migrate-pair-foundry/PRD.md`
ADR: `docs/adr/0001-pair-foundry-llm-provider.md`

## What to build

Once the Magic Form Builder LLM wrapper is fully migrated to Pair Foundry (slice 1), the Azure AI Foundry remnants are dead weight: the Azure-specific convict config, the `openai` npm package, and `AZURE_OPENAI_*` env-var references in the repo. This slice deletes them so SSM / IaC stops carrying ghost parameters and the lockfile stops carrying an unused dependency.

The scope is in-repo only. If FormSG's deployment-side IaC lives in a separate repository, those `AZURE_OPENAI_*` parameter definitions are out of scope for this slice and handled in a follow-up PR against that repo.

After this slice the only LLM config surface in the codebase is `aisdk.config.ts` and the `AI_SDK_*` env vars.

## Acceptance criteria

- [ ] `apps/backend/src/app/config/features/azureopenai.config.ts` is deleted.
- [ ] `openai` is removed from `apps/backend/package.json` dependencies; pnpm lockfile is regenerated and no longer contains the `openai` package.
- [ ] Repo-wide grep confirms no remaining imports from `'openai'`, `'openai/error'`, or `'openai/resources/...'` in `apps/backend/src`.
- [ ] Repo-wide grep confirms no remaining references to `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT_NAME`, `AZURE_OPENAI_API_VERSION`, or `AZURE_OPENAI_MODEL` in `.env` examples, docs, or in-repo IaC.
- [ ] Repo-wide grep confirms no remaining references to `azureOpenAIConfig` or `azureopenai.config`.
- [ ] Backend type-checks, lints, and tests pass.
- [ ] Manual smoke: text-prompt MFB and vision-prompt MFB continue to work end-to-end against PX Engine (regression check after dep removal).
- [ ] Commits follow conventional commits.

## Blocked by

- Slice 1: `.scratch/migrate-pair-foundry/01-ai-sdk-wrapper-migration.md` — the Azure config and `openai` package can only be safely removed once nothing imports them.
