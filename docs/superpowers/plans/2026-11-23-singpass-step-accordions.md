# Singpass step accordions Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace workflow tabs with independent accordion sections and open Settings Step 1 on entry.

**Architecture:** Keep draft form and guided navigation state intact. Add separate expansion state, with guided navigation and validation adding sections to the open set. Settings initial expansion uses local initial state only.

**Tech Stack:** React, Chakra UI, react-hook-form, Vitest, Testing Library.

**Spec:** docs/specs/singpass-step-accordions.md

## Global Constraints

Pinned decisions 1–8 in the spec are binding. No backend/schema/authentication semantics changes. No commit, push or deployment requested.

## Review Focus

- Guided order differs from displayed order; preserve locks and auto-opening.
- Invalid collapsed controls must open and receive focus without closing other sections.
- Collapse must retain draft controls and values.
- Settings Save, Cancel and manual close must stay closed after rerender.
- Step 1 omits Approvals; login eligibility and flag-off stacked guidance remain.

## Task 1: Workflow editor

Files: EditStepBlock.tsx and its test; workflow/en-sg.ts.
Interface: existing EditLogicBlockProps and form draft unchanged.

- [x] Update tab tests for accordion buttons, fields-first default, independent expansion, summaries, validation focus and guided progression. Run Vitest and observe expected failures.
- [x] Implement independent expansion, preserve guidance and validation, copy existing StepLoginAccordion styling and EditStepBlockContainer spacing. Rename admin workflow copy.
- [x] Run focused editor tests; expected all pass.

## Task 2: Settings entry

Files: StepLoginAccordion.tsx and new focused StepLoginAccordion.test.tsx.
Interface: existing StepLoginAccordionProps unchanged.

- [x] Test initial Step 1 opening, Save/Cancel/manual-close persistence and switching.
- [x] Initialise openIndex to 0, retain existing navigation save flow.
- [x] Run focused Settings tests; expected all pass.

## Task 3: Verification

- [x] Run affected workflow/Settings suites, frontend TypeScript, touched-file ESLint and Prettier, git diff --check.
- [x] Update phase progress with exact commands, evidence and limits. Root conducts independent final review.

## Progress

2026-11-23: Read approved spec, root CLAUDE/domain context, current source and tests. Tasks 1–2 started. Ruling: execution is approved; skip redundant confirmation and commits. Root handles independent review. No shared interface changes between tasks.

2026-11-23 implementation: Independent expansion uses Chakra Accordion with allowMultiple/reduceMotion. Panels remain mounted to preserve draft controls. Guided order stays separate from displayed order. Settings uses useState(0), with no reopening effect. Copied AccordionButton text alignment, transparent hover, Stack summary spacing and body-2/secondary.400 from StepLoginAccordion; retained responsive 1.5rem/2rem EditStepBlockContainer gutters and 0.75rem control spacing.

Checks in progress: Initial editor regression run failed as expected (10 failures, 11 passes); initial Settings run failed all 4 new entry tests. Settings subsequently passed 4/4. A focused review regression reproduced collapsed Login remaining closed after invalid Continue; fixed by routing through openSection. Lint now has zero errors and one existing fast-refresh export warning. Existing mocked-network and Downshift warnings remain. Concurrent server/typecheck load caused 5-second test timeouts; final run uses one worker and a 30-second test limit. First TypeScript run read the translation interface before its update, so a fresh run is underway.

## Final verification, 2026-11-23

Performer: implementation agent. Independent review: root reviewer identified the collapsed invalid Continue case; reproduced by a failing test, then fixed. No commits, push or deployment.

- `pnpm --filter formsg-frontend exec vitest run --project=unit --maxWorkers=1 --testTimeout=30000 src/features/admin-form/create/workflow/components/WorkflowContent/EditStepBlock/EditStepBlock.test.tsx src/features/admin-form/settings/components/AuthSettingsSection/StepLoginAccordion.test.tsx src/features/admin-form/create/workflow/hooks/useGuidedStepNavigation.test.ts src/features/admin-form/create/workflow/adminWorkflowStore.test.ts src/features/admin-form/common/navigationSave.test.ts`: exit 0, 34 tests passed across 4 suites. The final navigationSave path matched no suite; navigation behavior is exercised by the Settings switching regression and existing editor tests. Evidence: `/tmp/accordion-final-green.log`.
- `pnpm --filter formsg-frontend exec tsc --noEmit`: exit 0. Evidence: `/tmp/accordion-types-final.log`.
- Touched-file ESLint: zero errors, one pre-existing `react-refresh/only-export-components` warning on EditStepBlock's shared export. Evidence: `/tmp/accordion-lint2.log`.
- Touched-file Prettier and `git diff --check`: passed. Evidence: `/tmp/accordion-format-final.log`.

Root browser checks passed: mixed-provider Step 1 opens Assigned fields only; later-step sections remain open independently; collapsing Assigned fields shows “2 fields assigned” while Login and Approvals stay open. Settings Step 1 opens initially; Cancel closes it and it stays closed. Existing fontFeatureSettings DOM-prop and Downshift ref warnings remain, with no fatal rendering error. These are agent checks, not human usability review.

Next action: user reviews the running local app/Storybook exploration. No known blocking implementation issue remains. Full repository suites and backend integration were not run; no backend/schema/authentication code changed.

## Rebase onto develop, 2026-11-23

User requested latest develop as the base. Root fetched develop at `7e93bc663e532831c3fcb3e27e347d9bee208639`, created `backup/singpass-step-accordions-before-develop-20261123` at `74b0fbf17`, and stashed uncommitted accordion edits including untracked files.

Performer: implementation agent. Evidence: develop squash `5b8107ecd` (#10588) includes all seven login commits through `aa21abcf1`, plus newer legacy-Singpass and eligibility fixes. Ruling: abort the initial conflicting rebase and use `git -c rebase.updateRefs=false rebase --onto origin/develop aa21abcf1 codex/singpass-step-accordions`. This avoids replaying obsolete login patches and protects backup/sibling refs. The three guided commits replayed cleanly as `8e235808b`, `42412d975`, and `1624d509a`.

Restored accordion work with `git stash apply stash@{0}` without conflicts. Stash and backup branch remain intact. Local upstream now tracks origin/develop; no push or accordion commit. Editor and Settings accordion content match the retained stash. Develop's added field-order story and authentication fixes remain.

Checks: 38/38 tests passed across six suites: EditStepBlock, StepLoginAccordion, useGuidedStepNavigation, adminWorkflowStore, login constants, and useStepEditorLogin. Command: `pnpm --filter formsg-frontend exec vitest run --project=unit --maxWorkers=1 --testTimeout=30000` followed by those six test file paths. Evidence: `/tmp/accordion-develop-tests.log`. Frontend `tsc --noEmit` exited 0 (`/tmp/accordion-develop-types.log`). `git diff --check` passed. Existing mocked-network warnings remain. No full repository test run. Next action: root final review, then user previews the develop-based exploration.
