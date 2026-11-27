# Always-editable Settings step login

Approved 2026-11-23. Supersedes accordion entry/collapse behavior in singpass-step-accordions.md for Settings only.

- Every workflow Settings login card stays editable. No collapsed state, pencil, Save or Cancel footer.
- Every card has a neutral border, no blue card-level focus outline. Individual controls retain focus styling.
- Login selections save on click or Enter/Space. Arrow keys move radio focus without saving.
- E-service IDs save trimmed on blur/Enter, using current validation; invalid/failed changes reset to saved values.
- Existing field-consequence warnings precede provider saves. Confirm applies; cancel keeps saved login and fields.
- Serialize saves across cards and retain expected_last_modified/deletion protections. Keep current saved snapshots after refetch, not mount-time snapshots.
- Save Step 1 restriction changes independently; failures must not undo or replay a saved login. Show errors and leave controls usable.
- Preserve public-form restrictions, login eligibility, legacy provider rules and flat settings without workflow.
- No backend changes, commit, push or deployment.

Status: implemented and agent-verified. 37 focused tests and frontend TypeScript passed. See implementation plan for evidence and limits.
