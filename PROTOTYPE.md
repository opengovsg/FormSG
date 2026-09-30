# Workflow actions exploration

For a fresh checkout, use the repository's Node and pnpm versions, then run:

```sh
pnpm install --frozen-lockfile
pnpm build:shared
pnpm build:sdk
pnpm prototype
```

For later runs, use `pnpm prototype`. Then open http://127.0.0.1:4181/dashboard. Open **Workflow actions demo**, select **Results → Responses**, and open a sample row.

This mode uses the actual FormSG dashboard and Responses drawer. The newer dashboard is always enabled in prototype mode, with no delightful-dashboard flag setup required. Five synthetic responses share in-memory state. Actions and Activity survive navigation; refresh or Reset demo restores the fixtures. No backend, login credentials or secret key is required. API requests outside the mock reads are blocked. No notifications are sent.

Date-range filtering is not simulated; the response adapter always supplies the five sample records.

Normal `pnpm dev:frontend` behaviour is unchanged. Do not use this mode with real data.

## Artifact map

| Artifact | Purpose |
| --- | --- |
| `apps/frontend/src/features/admin-form/responses/prototype/ResponseDrawerExploration.tsx` | Action buttons, modals and activity timeline. |
| `apps/frontend/src/features/admin-form/responses/prototype/WorkflowStatusOverview.tsx` | Plain-text workflow status in the response overview. |
| `apps/frontend/src/features/admin-form/responses/prototype/model.ts` | Five sample responses, action rules and history snapshots. |
| `apps/frontend/src/features/admin-form/responses/prototype/PrototypeProvider.tsx` and `context.ts` | Shared local state across table and drawer. |
| `apps/frontend/src/features/admin-form/responses/prototype/bootstrap.ts` and `adapters.ts` | Mock API startup and dashboard/response data. |
| `apps/frontend/src/features/admin-form/responses/prototype/config.ts` | Prototype-only mode switch. |
| `apps/frontend/src/features/admin-form/responses/prototype/model.test.ts` and `adapters.test.ts` | Action and data adapter checks. |
| `apps/frontend/src/features/admin-form/responses/FeedbackPage/FeedbackTable.test.tsx` | Regression check for the missing-feedback render loop. |
| [Activity log comparison](docs/workflow-prototype/activity-log-options/compare.html) | Three static design variations, preserved from the temporary preview. Open locally or serve this folder with a static web server. |

The comparison folder includes `option-1.html`, `option-2.html`, `option-3.html` and their screenshots. Option 1 was selected; the running prototype contains later wording and recipient-display refinements. These are historical design references, not a second app entry point.
