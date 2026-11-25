# FormSG load tests

k6 scenarios for FormSG's public form paths, run nightly against UAT on Fargate. The setup is ported from CalSG's `load-tests/`.

Background: [RFC: Improving reliability across FormSG, CalSG, Highway](https://app.notion.com/p/3cc77dbba7888029bc22de3a8e28715c).

## Scenarios

| File | Requests per iteration | Default rate |
| --- | --- | --- |
| `smoke.ts` | `GET /api/v3/client/env` | 20/s |
| `view-form.ts` | `GET /:formId`, then `client/env`, `feature-flags/enabled` and `GET /api/v3/forms/:formId` in parallel | 10 page loads/s |
| `submit-storage.ts` | the `view-form` page load, then `POST /api/v3/forms/:formId/submissions/storage` | 3 submissions/s |

Production peaks (Datadog APM, 30 days to Nov 2026) are about 6,000/min for each of the form page requests and 460/min for storage submissions, spread over 30 to 60 tasks. UAT runs 1 to 5 tasks, so the defaults are several times production's per-task peak, not its absolute peak.

## Fixtures

`apps/backend/src/scripts/seed-load-test-fixtures.ts` upserts the fixtures and is idempotent. It refuses to run in production.

| Fixture | Form ID | Fields |
| --- | --- | --- |
| `typical` | `6c6f61647465737400000011` | 10, override with `FIXTURE_TYPICAL_FIELD_COUNT` |
| `large` | `6c6f61647465737400000012` | 100, override with `FIXTURE_LARGE_FIELD_COUNT` |

Both are public storage-mode forms with captcha off, no notification emails, no webhook, no verified fields and no attachments. A submission therefore writes to Mongo and nothing else. UAT shares its SES and Lambda quotas with production, which is why these flows are excluded. The owner is `success@simulator.amazonses.com`, under its own agency.

Every seed run deletes the fixtures' submissions, so the data shape is the same each night.

## Running locally

```bash
brew install k6
pnpm --filter formsg-load-tests build
```

Seed the fixtures inside the backend container (the dev guard allows it locally):

```bash
docker exec formsg-backend-1 sh -c 'cd /opt/formsg/apps/backend && npx ts-node --transpile-only -r dotenv/config src/scripts/seed-load-test-fixtures.ts'
```

Then run a scenario. Locally the limits are low, so either raise `SUBMISSIONS_RATE_LIMIT` or set `LOAD_TEST_BYPASS_KEY` on the backend and pass the same value:

```bash
k6 run load-tests/build/scenarios/view-form.js \
  --env TARGET_URL=http://localhost:5001 --env LOAD_TEST_KEY=local-dev-key
```

Any 429 breaches `formsg_throttled` and aborts the run, so a misconfigured bypass shows up as a failure, not as a slow result.

## Parameters

Passed as `--env NAME=value`.

| Name | Default | Notes |
| --- | --- | --- |
| `TARGET_URL` | required | Must be in the allowlist in `src/lib/target.ts` |
| `LOAD_TEST_KEY` | none | Rate-limit bypass header |
| `VARIANT` | `load` | `load`, `stress` or `spike`. Only `load` gates |
| `RATE` | per scenario | Iterations per second |
| `FIXTURE` | `typical` | `typical` or `large` |
| `FORM_ID` | from `FIXTURE` | Overrides the fixture |
| `DURATION` | `60s` | `load` only |
| `P95_MS` | `5000` on `load` | `0` turns the gate off |
| `MAX_DROPPED` | `0` | `load` only |
| `PRE_ALLOCATED_VUS` / `MAX_VUS` | sized from the rate | |

## Nightly run

`.github/workflows/load-test-nightly.yml` runs at 02:00 SGT on weeknights, plus on `workflow_dispatch`. It:

1. Assumes `formsg-uat-load-test-github-oidc-role`. The role is trusted only for `refs/heads/develop` and scoped to the load-test resources.
2. Builds the k6 image and pushes it to `formsg-uat-load-tests`.
3. Seeds the fixtures on the exact task definition the UAT service is running. The app task family `formsg-app` is shared with production in the same account, so the step refuses any revision whose `SSM_ENV_SITE_NAME` is not read from `/uat/`.
4. Runs k6 on Fargate with a `dd-agent` sidecar. k6 sends OTLP to `localhost:4317` and the metrics land in Datadog as `k6.*`, tagged `task_family:formsg-uat-load-test-runner`.

Exit codes: 0 is a pass, 99 is a threshold breach (a finding), and anything else means the script broke.

The runner reaches `https://uat.form.gov.sg` through Cloudflare from the UAT NAT IP, and sends `x-formsg-iac: true` so that Cloudflare's load balancer always picks the ECS pool.

Repository variables `LOAD_TEST_SUBNET_IDS` and `LOAD_TEST_SECURITY_GROUP_ID` come from the formsg-infra `uat` stack outputs.
