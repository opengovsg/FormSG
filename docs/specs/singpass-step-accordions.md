# Workflow step accordion exploration

Date: 2026-11-23. Status: approved for implementation on 2026-11-23.

## Pinned implementation decisions

1. Replace the workflow step editing tabs with accordion sections ordered **Assigned fields**, **Login**, **Approvals**.
2. Rename **Fields to fill** to **Assigned fields** across the admin workflow UI, including saved-card summaries.
3. When opening a workflow card for editing, open **Assigned fields** only. Start Login and Approvals collapsed.
4. Allow multiple accordion sections to remain open simultaneously. Opening one does not close another.

5. Show current-setup summaries on collapsed sections, including empty states such as **No fields assigned** and **No login required**.
6. On entry to **Settings → Login**, open Step 1 for editing. Do not automatically reopen it after Save, Cancel or manual collapse. Preserve existing save behaviour when switching or closing steps.

## Implementation location

- Source repository: `/Users/muhammadsufyanbselamet/Documents/GitHub/FormSG`.
- Requested base: `origin/stg-alt`. Cached ref inspected at `74b0fbf17e77d85f2d14f093c59323dd43e1c9cf`; refresh before branching.
- Earlier reference: `projects/formsg/singpass-all-steps-concepts/index.html`, expandable-sections concept. Its rerender behaviour is not the specification; follow the pinned independent-accordion behaviour above.
- Workflow editor: `EditStepBlock.tsx`; Settings editor list: `StepLoginAccordion.tsx`.

## Final approved implementation decisions

7. Preserve guided creation's existing progression, section locks and automatic opening. The Assigned-fields-only default applies to normal manual editing.
8. On validation failure, open the section containing the error and focus the invalid input without closing other sections or losing entered values.

## Execution

- User approved implementation and requested the local checkout use the new branch.
- Refreshed `origin/stg-alt` and checked out `codex/singpass-step-accordions` in the main local FormSG repository.
- Implementation and focused regression checks in progress. No push or deployment requested.

## Existing behaviour to preserve in the proposed implementation

- Step 1 has no Approvals section; current login eligibility remains unchanged.
- Accordion expansion is presentation state only; toggling sections does not reset draft values or save the step.
- Keep existing workflow save, navigation, login-change warnings and partial-failure handling.
- For Settings without workflow steps, retain the existing flat settings view.

## Evidence and rationale

This exploration follows the Singpass UT finding that Login and Fields to fill can look like alternatives instead of parts of setting up the same step. The researcher selected fields-first opening with independently expandable sections.

## Implementation interpretation

Display order is Assigned fields, Login, Approvals. Guided progression stays Name, People, Login, Assigned fields, Approvals. Existing flag-off stacked guidance remains. No backend, schema or authentication semantics changes.

## Updated base, 2026-11-23

At the user's request, the exploration is now based on `origin/develop` at `7e93bc663e`, replacing the original stg-alt base. Existing guided changes were retained; accordion edits remain uncommitted. See the implementation plan for rebase evidence and checks.

Settings behavior superseded on 2026-11-23 by [always-editable Settings step login](settings-step-login-autosave.md). The workflow editor accordions remain as specified here.
