# Login setup from Create fields

Approved 2026-11-23. Applies to Multirespondent forms where step login is available. Preserve rollout and legacy conversion restrictions.

- Missing-login identity and MyInfo choices open guidance and do not create fields.
- With zero workflow steps and no login, link to Login Settings.
- With an existing login or one or more steps, link to Workflow.
- Existing required login keeps normal field creation.
- Keep dragging disabled while login is missing. Preserve limits, loading restrictions, draft eligibility and unsaved-change protection.
- Never create workflow steps automatically. After setup, the admin returns to Create fields and clicks again.
- Banner: “These fields require Singpass login.” Use the corresponding provider name for Corppass.

## Local preview

Both frontend and backend need the flags for setup to work locally. These overrides force only `mrf-singpass-all-steps` and `is-nric-field-enabled`. They do not modify shared GrowthBook settings.

1. Add `VITE_ENABLE_STEP_LOGIN_PREVIEW=true` to ignored `apps/frontend/.env.local`. Restart Vite if it does not restart automatically.
2. Set `ENABLE_STEP_LOGIN_PREVIEW=true` on the local backend. For Docker Compose, use a local override file outside the repository:

```yaml
services:
  backend:
    environment:
      ENABLE_STEP_LOGIN_PREVIEW: "true"
```

```sh
docker compose -f docker-compose.yml -f /tmp/formsg-step-login-preview.override.yml up -d backend localstack mockpass
```

LocalStack and mockpass share the backend network namespace, so recreate them with the backend when applying the override.

Frontend overrides require Vite's `DEV` build flag. Backend overrides require the development environment. Production ignores these switches. To disable preview, remove the frontend setting and recreate the backend without the override file.

### Current local container workaround

The local Alpine image has Node 22.22.2. The repository's pnpm setting requests 22.23.5, whose automatic download fails with `ERR_PNPM_MUSL`. The temporary override also starts the existing backend dev command directly:

```yaml
    command: ["sh", "-c", "cd apps/backend && ./node_modules/.bin/tsnd --poll --respawn --transpile-only --inspect=0.0.0.0 --exit-child -r dotenv/config -- src/app/server.ts"]
```

This local workaround avoids pnpm's downloader. It does not update the container's Node version. After recreating LocalStack, run `docker exec formsg-backend-1 sh init-localstack.sh` once its service is ready to restore local queues and buckets.
