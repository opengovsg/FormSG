# Guided setup for the new step format

Presentation update, 2026-11-23: [Step accordions](singpass-step-accordions.md) replace tabs. Guided progression, eligibility, locks and save rules below remain applicable.

Status: implemented on codex/singpass-login-followup; review fixes verified on 2026-11-17. Awaiting human review.

## Pinned implementation decisions

### D1: Walk through every decision
Confirmed by Sufyan on 2026-11-16: guided mode walks the admin through every decision in a new workflow step. Continue moves the spotlight forward.

### D2: Guide through the tabbed editor
Confirmed by Sufyan on 2026-11-16: guided mode uses the same tabs as the normal step editor. Begin with Step name and Who fills this step, then Continue opens each relevant tab and spotlights its content. This teaches the layout used when editing later.

### D3: Follow the tab order
Confirmed by Sufyan on 2026-11-16: Step name → Who fills this step → Login → Fields to fill → Approvals → Save step. Skip sections that do not apply under existing rules, including Approvals for Step 1.

### D4: One spotlight for Login
Confirmed by Sufyan on 2026-11-16: spotlight the whole Login section. Selecting a provider reveals its relevant settings within that spotlight; these do not introduce additional Continue stages. Continue advances to Fields to fill.

### D5: Revisit reached decisions
Confirmed by Sufyan on 2026-11-16: already-reached tabs are available during guidance. Continue unlocks the next tab. Selecting an earlier tab moves the spotlight there; Back moves to the previous decision. Preserve all entered values when navigating.

### D7: Guide new steps only
Confirmed by Sufyan on 2026-11-16: editing a saved step does not restart guidance. All applicable tabs remain available as in the current editor.

### D6: Continue uses existing draft-save validation
Confirmed by Sufyan on 2026-11-16: Continue validates the current section using existing draft-save rules, without adding publish-time requirements. A blank Corppass e-service ID does not block Continue while drafting. Existing form-opening requirements remain unchanged. Save step still validates the whole step.

### D8: Route save errors to their section
Confirmed by Sufyan on 2026-11-16: when Save step finds an error in an earlier section, open that section, move the spotlight there and focus the invalid input. Preserve all answers and previously unlocked tabs.

### D9: Turning guidance off
Confirmed by Sufyan on 2026-11-16: retain the existing confirmation before turning guided mode off. Then show the normal editor with all applicable tabs available, preserve answers and retain the current tab where possible.

### D10: Preserve card-switch rules
Confirmed by Sufyan on 2026-11-16: retain the current card-switch rule. An unfinished guided step blocks switching cards before the final stage. At the final stage, switching attempts the existing save; validation failure must keep the current step open. Do not silently discard answers.

### D11: Reveal the tab navigation at Login
Confirmed by Sufyan on 2026-11-16: show applicable tab labels when guidance reaches Login. Future tabs are disabled until Continue unlocks them. Keep Step name and Who fills this step visible above the tabs and editable once revealed. Existing eligibility rules still determine which tabs apply.

### D12: Resume guidance within the current editor
Confirmed by Sufyan on 2026-11-16: turning guidance back on for the same unsaved step resumes its previous guided position, preserving answers and previously unlocked tabs. Guided progress lives only while the editor is open. Do not add draft recovery after refresh.

## Confirmation

All twelve decisions above are pinned. Sufyan confirmed the complete flow and authorised implementation on the current branch on 2026-11-16. Existing workflow behavior outside these decisions remains unchanged.

## Existing behavior (code inspection)

Guided creation stacks Name, Respondent, Login, Approvals, Fields. Step 1 omits Approvals; Login follows existing eligibility rules. Unguided tabs use Login, Fields to fill, Approvals. Continue reveals a section without validation; Done validates the entire step.

## Verification

- 40 focused tests across six suites passed, including guided editor navigation, draft Corppass validation, saved-step behavior, guidance preference and unchanged completion-email behavior.
- Browser checks confirmed blank Corppass ID advances, an ID containing an internal space blocks and receives focus (whitespace-only is treated as blank by existing validation), reached tabs remain available, and guidance off/on preserves the typed ID and guided position.
- At 390px viewport width, tabs wrap without horizontal page overflow.
- Read-only review found no blocking regression. The identified Step 1 restrictions-save failure path now returns the spotlight to Login and has regression coverage.
- Storybook previews: `pages-adminformpage-create-workflowtab--guided-login-tabs` and `--guided-fields-tab`.
- These are agent checks; human visual and usability review remains outstanding.

## Review follow-up

Review evidence: `/tmp/formsg-guided-tabs-fixes-handoff.md` (2026-11-16). Applying confirmed navigation, focus, keyboard accessibility and cleanup fixes. User confirmed keeping the existing stacked layout when the Singpass all-steps flag is off. Cosmetic observations are not approved changes.

Correction to earlier handoff: `useGuidedStepReveal` has no production callers after this change. Completion-email guidance does not use it; its behavior is covered separately.

### D13: Preserve flag-off guidance
Confirmed by Sufyan on 2026-11-16 after review: when the Singpass all-steps flag is off, keep the existing stacked guided layout instead of introducing guided tabs. Preserve the existing section order for that path. The new guided-tab layout is limited to the enabled experience; existing saved-step behavior is preserved. Compatibility: saved forms using step-level login can already show normal-editor login tabs with the flag off. Preserve that existing eligibility; the flag-off decision governs guided setup.

## Review-fix verification (2026-11-17)

All eight review items addressed, including named-section navigation, selected-tab click after Back, flag-off stacked layout, removal of unused reveal code, focus targeting, keyboard access to locked tabs and missing regressions. The disabled SpotlightGroup fallback remains necessary for the shared stacked layout and guided mode; section order is now defined once.

45 tests across six suites passed. Frontend TypeScript, formatting and diff checks passed. Lint has zero errors and one pre-existing fast-refresh warning. Existing mocked-network warnings remain in tests.

Browser checks passed for Back → Login → Continue, keyboard focus on unavailable tabs with Enter/Space unable to activate them, flag-off Approvals-before-Fields stacked flow, and 390px layout without horizontal overflow. Cosmetic observations from the review remain unchanged for human judgment. Existing whitespace-only ID behavior remains unchanged.

Evidence: `/tmp/guided-review-final-tests.log`, `/tmp/guided-review-types.log`, `/tmp/guided-review-lint.log`, `/tmp/guided-review-format.log`. Implementation commits: `35bf2f4b0` (named navigation) and `988590c6c` (guided editor, stories and regressions).
