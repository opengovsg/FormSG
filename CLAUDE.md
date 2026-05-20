## Prototype build rules (workflow-v2)

Before building any new UI component in this repo, complete this checklist. Do not write code until done.

### 0. Build approach
- **One slice, feedback, then replicate.** When building N similar components (e.g. email field picker + dropdown field picker), build one end-to-end and show it for feedback first. Once the pattern is validated, replicate to the others. Do not build all N then show everything at once.
- **If two components share 80% of their UI, build the shared part first.** Extract the common pattern before duplicating across files (e.g. NewRespondentForm and EditRespondentForm share the same radio group with field pickers).

### 1. Component audit
Find 2-3 existing examples of the component type you're building. Use the codebase's own components, not Chakra primitives:
- `Button` from `~components/Button`
- `Toggle` from `~components/Toggle` (default import)
- `SingleSelect` from `~components/Dropdown` (requires `name` prop)
- `ModalCloseButton` from `~components/Modal`
- `InlineMessage` from `~components/InlineMessage`
- Modal footers use `ButtonGroup`, Cancel buttons use `variant="clear" colorScheme="secondary"`

### 2. Figma copy check
For every panel, form, card, or modal, check Figma for exact label text, button copy, descriptions, and placeholder text. Do not invent copy.

### 3. State combination table
For components with multiple visual states, write a table showing what each element renders in each state (visible, interactive, faded, hidden). Get confirmation before coding.

### 4. Real API for field creation
Fields created in the prototype must also be created via the real FormSG API (`createSingleFormField` from `UpdateFormFieldService`) so they appear in the Build tab. Wrap in try/catch.

---

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`opengovsg/FormSG`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Review prep

Commit style and breadcrumb convention for review-ready PRs. See `docs/agents/commit-style.md` and `docs/agents/decisions-breadcrumb.md`.
