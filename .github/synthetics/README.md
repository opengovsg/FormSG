# Datadog synthetic smoke tests

This folder contains definitions for the `ci:formsg-smoke` suite, managed as code. The tests run two ways:
1. **only via CI triggers** — the release gate (`release.yml` → `smoke-stg`, against stg, blocking all prod deploys)
2. **PR previews** (`render-preview.yml`, against the Render preview URL). 

Tests are kept `status: paused` in Datadog so they never run on a Datadog schedule or alert on their own.

## Layout

- `tests/*.json` — one Datadog Synthetics API test definition per file.
- `ids.json` — maps each file's basename to the `public_id` of the Datadog
  test it manages. The smoke composite action
  (`.github/actions/synthetics-smoke`) builds its trigger list from this file.
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
the PR branch — so the test can be shaken down on the PR preview before it
joins the release gate (the gate reads `ids.json` from develop, so new
tests only gate prod after merge). The commit-back doesn't re-trigger the
preview; re-run it (or push again) to exercise the new test. Duplication is
prevented by name: before creating, `sync.sh push` adopts any live test
with the same `name`, so re-runs (or a lost ids.json entry) update rather
than duplicate. Keep test names unique. Abandoned PRs can leave orphan
paused tests in Datadog; delete them in the UI if they bother you.

You can also run `sync.sh push` locally with your own
`DD_API_KEY`/`DD_APP_KEY` (needs `synthetics_read` + `synthetics_write`) —
e.g. to record placeholder steps in the UI before opening the PR.

Datadog UI edits are overwritten on the next sync — `sync.sh pull` first if
you prototyped a change in the UI and want to keep it.

## Journey tests: first-run shakedown

The email-assertion steps (`assertEmail`) have no public API schema, so the
journey definitions ship without them — the API rejects any hand-written
shape. Record them once in the Datadog UI (the test's email variable
`{{ EMAIL }}` provides the mailbox), run `sync.sh pull`, and commit the
canonical JSON. Until then the journeys fail at the first step that uses an
extracted variable (e.g. "Enter login OTP").

Steps to record, in test order:

- `journey-core-cuj`, before "Enter login OTP": login OTP email arrives,
  extract the 8-char code after the dash into `LOGIN_OTP` (subject:
  "One-Time Password (OTP) for FormSG"; body: "Your OTP is XXX-########").
- `journey-core-cuj`, before "Enter verification OTP": verification OTP
  email arrives, extract the code into `VERIFY_OTP` (subject: "Your
  One-Time Password (OTP) for submitting a form on FormSG"; body: "Your
  email OTP is XXX-<b>########</b>").
- `journey-core-cuj`, after submission: respondent copy email arrives
  (subject contains "[smoke] respondent copy") — arrival proves SES +
  pdf-gen.
- `journey-mrf-multistep`, before "Enter login OTP": same login OTP
  extraction as above.

The journeys log in as a fresh throwaway `@synthetics.dtdg.co` user per run
(the domain is whitelisted as an agency in stg only) and create their own
form, so every run leaves one orphan user + form + submission in the stg
database. Tolerated for now; add a cleanup job if it ever matters.

Known flake surfaces: GrowthBook flags that reshape the create-form modal
and workflow builder (`mrfCutover`, `enablePaperTrackingSetUpPage`, workflow
redesign/guided mode) — flag-sensitive steps are `allowFailure: true` where
possible, but pinning these flags for the synthetics user is the robust fix
if they churn.
