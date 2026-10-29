# Datadog synthetic smoke tests

This folder contains definitions for the `ci:formsg-smoke` suite, managed as code. The tests run two ways:
1. **only via CI triggers** — the release gate (`release.yml` → `smoke-stg`, against stg, blocking all prod deploys)
2. **PR previews** (`render-preview.yml`, against the Render preview URL) — on demand: add the `preview-smoke` label to a PR that has a `render-preview` up; remove and re-add it to re-run.

Tests are kept `status: paused` in Datadog so they never run on a Datadog schedule or alert on their own.

## Layout

- `tests/*.json` — one Datadog Synthetics API test definition per file.
- `ids.json` — maps each file's basename to the `public_id` of the Datadog
  test it manages, so `sync.sh` can update tests in place. Triggering is
  separate: the smoke composite action (`.github/actions/synthetics-smoke`)
  runs whatever carries the `ci:formsg-smoke` tag in Datadog — tagging a
  test adds it to the gate (including the release gate, immediately, even
  for tests created from an unmerged PR).
- `sync.sh` — `push` creates/updates the tests in Datadog; `pull` overwrites
  the local files from the live definitions.

## Conventions

- Every request in a test routes through the `START_URL` variable
- CI overrides it per run with the environment under test
- Browser-test element locators use `userLocator` with stable CSS selectors
  (prefer `data-testid` / `id` / `name`), not recorded multi-locators.
- Tags: `team:formsg ci:formsg-smoke managed-by:formsg-repo`.

## Workflow

Editing an existing test: change its JSON, open a PR. On merge to develop,
`synthetics-sync.yml` pushes it to Datadog.

Adding a test: add the JSON, open a PR. The sync workflow runs on the PR,
creates the test in Datadog, and commits the new `ids.json` entry back to
the PR branch. Shake it down on the PR preview with the `preview-smoke`
label. Note the suite is tag-scoped, so a newly created `ci:formsg-smoke`
test joins the release gate as soon as sync creates it — before the PR
merges; if it's not ready to gate prod, leave the tag off until it is.
Duplication is prevented by name: before creating, `sync.sh push` adopts
any live test with the same `name`, so re-runs (or a lost ids.json entry)
update rather than duplicate. Keep test names unique. Abandoned PRs can
leave orphan paused tests in Datadog; delete them in the UI if they bother
you.

You can also run `sync.sh push` locally with your own
`DD_API_KEY`/`DD_APP_KEY` (needs `synthetics_read` + `synthetics_write`) —
e.g. to record placeholder steps in the UI before opening the PR.

Datadog UI edits are overwritten on the next sync — `sync.sh pull` first if
you prototyped a change in the UI and want to keep it.

## Journey tests: first-run shakedown

The email OTP extractions are authored in the definitions as
`extractFromEmailBody` steps (a failed extraction doubles as the
"email arrived" assertion). Their regexes are a first cut against the
current email copy — if a journey fails at an extraction step, fix the
regex in the Datadog UI, run `sync.sh pull`, and commit.

One step must still be recorded in the UI: `assertEmail` has no
API-authorable schema (the validator rejects every documented field
spelling). In `journey-core-cuj`, after "Submit form", record: respondent
copy email arrives (subject contains "[smoke] respondent copy") — arrival
proves SES + pdf-gen. Then `sync.sh pull` and commit the canonical JSON;
future pushes preserve it. Until recorded, the journey simply lacks that
one assertion — everything else runs.

The journeys log in as `internal-testing+cuj@` / `+mrf@open.gov.sg` (plus
addresses so concurrent tests don't fish out each other's OTPs). The login
OTP is fetched by a `runApiTest` step calling the `internal-testing-get-email-otp`
Lambda (formsg-private), which reads the shared Gmail inbox; its shared
secret lives in the `FORMSG_SYNTHETIC_OTP_LAMBDA_SECRET` Datadog global
variable — never inline in these definitions (public repo). Respondent-side
emails (verified email field, MRF step-2 invite) still use a per-run
Datadog `@synthetics.dtdg.co` mailbox, which needs no agency whitelisting.
Each run leaves its `[smoke]` form + submission behind in the account;
tolerated for now; add a cleanup job if it ever matters.

Trigger smoke only after the sync workflow finishes pushing changed
definitions — a `preview-smoke` label added mid-sync can hit half-updated
tests (`Unknown variable name` / `UnknownTestError`); re-add the label
before digging deeper.

Known flake surfaces: GrowthBook flags that reshape the create-form modal
and workflow builder (`mrfCutover`, `enablePaperTrackingSetUpPage`, workflow
redesign/guided mode) — flag-sensitive steps are `allowFailure: true` where
possible, but pinning these flags for the synthetics user is the robust fix
if they churn.
