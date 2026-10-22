# Datadog synthetic smoke tests

Definitions for the `ci:formsg-smoke` suite, managed as code. The tests run
**only via CI triggers** — the release gate (`release.yml` → `smoke-stg`,
against stg, blocking all prod deploys) and PR previews
(`render-preview.yml`, against the Render preview URL). They are kept
`status: paused` in Datadog so they never run on a Datadog schedule or alert
on their own.

## Layout

- `tests/*.json` — one Datadog Synthetics API test definition per file.
- `ids.json` — maps each file's basename to the `public_id` of the Datadog
  test it manages. The smoke composite action
  (`.github/actions/synthetics-smoke`) builds its trigger list from this file.
- `sync.sh` — `push` creates/updates the tests in Datadog; `pull` overwrites
  the local files from the live definitions.

## Conventions

- Every request in a test routes through the `START_URL` variable; CI
  overrides it per run with the environment under test. Never hardcode an
  environment URL in a step.
- Browser-test element locators use `userLocator` with stable CSS selectors
  (prefer `data-testid` / `id` / `name`), not recorded multi-locators.
- Tags: `team:formsg ci:formsg-smoke managed-by:formsg-repo`.

## Workflow

Editing an existing test: change its JSON, open a PR. On merge to develop,
`synthetics-sync.yml` pushes it to Datadog.

Adding a test: add the JSON, run `sync.sh push` locally with your own
`DD_API_KEY`/`DD_APP_KEY` (needs `synthetics_read` + `synthetics_write`),
and commit the resulting `ids.json` entry in the same PR. The sync workflow
fails if a definition has no `ids.json` entry — it never creates tests, so
CI can't silently duplicate them.

Datadog UI edits are overwritten on the next sync — `sync.sh pull` first if
you prototyped a change in the UI and want to keep it.

## Journey tests: first-run shakedown

The two journey tests (`journey-core-cuj`, `journey-mrf-multistep`) carry
steps named `PLACEHOLDER record in UI: …`. Extracting an OTP from a received
email has no public API schema — record those steps once in the Datadog UI
(the test's email variable `{{ EMAIL }}` provides the mailbox), run
`sync.sh pull`, and commit the canonical JSON. Until then the journeys fail
at the first placeholder.

The journeys log in as a fresh throwaway `@synthetics.dtdg.co` user per run
(the domain is whitelisted as an agency in stg only) and create their own
form, so every run leaves one orphan user + form + submission in the stg
database. Tolerated for now; add a cleanup job if it ever matters.

Known flake surfaces: GrowthBook flags that reshape the create-form modal
and workflow builder (`mrfCutover`, `enablePaperTrackingSetUpPage`, workflow
redesign/guided mode) — flag-sensitive steps are `allowFailure: true` where
possible, but pinning these flags for the synthetics user is the robust fix
if they churn.
