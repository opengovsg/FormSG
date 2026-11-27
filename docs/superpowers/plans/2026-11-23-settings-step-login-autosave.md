# Settings step login autosave Implementation Plan

> Use superpowers:executing-plans. User already approved implementation.

Goal: Always-visible neutral Settings cards using main Settings save interactions.
Architecture: Parent owns one navigation draft registration and shared save lock; keyed editor drafts cannot overwrite each other. Editor saves provider changes only after existing warning confirmation, and text on blur/Enter. Step 1 restrictions save independently. Shared StepLoginControls receives optional Settings autosave interactions, preserving Create behavior.
Spec: docs/specs/settings-step-login-autosave.md

- [x] Replace collapsed-card tests with always-visible, selection, text, cross-step freshness, failure/confirmation and keyboard regressions. Observe failing run.
- [x] Implement StepLoginAccordion parent coordination, StepAuthSettingsEditor autosave and optional StepLoginControls handlers. Keep existing backend/version checks.
- [x] Run focused tests, frontend TypeScript, touched-file lint/format and diff check. Record evidence and limits.

Progress: Read current parent/editor, StepLoginControls, SingpassAuthOptionsRadio, EsrvcIdBox, FormSingleSubmissionToggle, FormDetailsSection, warning hook and restrictions. Shared warning stays before mutation. Restriction saves will not bundle login, avoiding partial login replay. No new generic persistence framework.

## Completed implementation and verification

Performer: implementation agent. Changes: always-visible neutral cards; one keyed navigation registration and shared synchronous save lock; current form snapshots with expected_last_modified and deletion confirmation retained; provider saves after warning confirmation; text trims/saves on blur/Enter and restores saved values after invalid or failed changes; independent Step 1 restriction saves. All cards disable during saves; CSV parsing disables controls and blocks cross-card changes. Public and legacy eligibility behavior retained. Intro now says “Manage logins for each step in your workflow.”

Existing patterns used: main Settings provider activation semantics, FormDetailsSection blur/Enter handling, EsrvcIdBox trimming/reset, existing StepOneLoginRestrictions save helper. Ruling: intercept arrow keys for focus-only navigation and use ordinary radio change activation, supporting assistive-technology clicks without pointer coordinates. The existing flat Settings coordinate gate was not copied after review identified its accessibility gap.

Review fixes: workflow navigation intent survives a preceding blur save and waits for it. Failed saves keep the user in Settings. Both links had failing regression tests before the fix. Settings Storybook lacked the workflow PUT endpoint; added stateful workflow/settings/whitelist handlers with version checks so previews can actually save. This was a mock 404, not a backend route change.

Verification:
- Initial always-visible suite failed 7/7 against the old editor, as expected.
- Final command: `pnpm --filter formsg-frontend exec vitest run --project=unit --maxWorkers=1 --testTimeout=30000 src/features/admin-form/settings/components/AuthSettingsSection/StepLoginAccordion.test.tsx src/features/admin-form/create/workflow/components/WorkflowContent/EditStepBlock/EditStepBlock.test.tsx src/features/admin-form/settings/components/AuthSettingsSection/constants.test.ts`.
- Final result: 37/37 passed across 3 suites (Settings 13, workflow 22, constants 2). Evidence: `/tmp/settings-autosave-final-tests3.log`.
- Frontend `pnpm --filter formsg-frontend exec tsc --noEmit`: exit 0. `/tmp/settings-autosave-types-final.log`.
- Changed Settings files ESLint, Prettier and `git diff --check`: passed with no lint warnings. `/tmp/settings-autosave-lint-final.log`, `/tmp/settings-autosave-format.log`. Workflow test-only formatting/lint passed after adapting existing collapse/reopen tests to wait for the earlier animation change.
- Root browser check: all three cards visible, neutral borders, no Save/Cancel footer, corrected intro. Processing officer NIL → Singpass saved immediately and remained selected. Zero console errors; two framework warnings.

Limits: agent verification only, not human usability acceptance. The restriction UI is mocked in autosave unit tests, so real CSV parsing/upload integration was not exercised. Existing mocked-network warnings and jsdom's unsupported window.scrollTo warning during Framer measurement remain. No backend changes or full-repository test run. No commit, push or deployment.

Next action: user reviews the local Settings preview. No known blocking issue remains.

## Local blank Settings investigation, 2026-11-23

Performer: implementation agent, with root agent browser reproduction. The user video showed Settings disappearing while the top navigation and success toast remained. Root reproduced this on the local four-step form: cards remained in the DOM, but the outer Settings wrapper (`overflow: hidden`) had scrolled to 1079.5px, moving its entire Tabs layout above the viewport. This was a scroll containment failure, not missing query data or a React crash.

Changed only the Settings page shell to `overflow: clip`, which prevents programmatic scrolling while retaining the inner content pane's `overflowY: auto`. Added a containment regression: it failed against the original hidden overflow and passed after the change. Retained the diagnostic last-step save test with the real navigation guard. Focused Settings tests: 21/21 passed (`/tmp/settings-scroll-green.log`). Root browser verification: last-step Corppass → Singpass saved successfully with the full page still visible; outer wrapper stayed at scrollTop 0 and top 107px. Reverse Singpass → Corppass also saved successfully with its selected radio and e-service input visible, restoring the original setting. Browser screenshot: `/tmp/singpass-settings-fixed.jpg`. jsdom checks CSS semantics, not actual layout. Touched-file ESLint (zero warnings), Prettier and git diff --check passed. No backend changes, commit, push or deployment.
