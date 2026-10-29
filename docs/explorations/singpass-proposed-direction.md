# Singpass across workflow steps: implementation decisions

Status: implemented for discussion, reviewed for discussion, 29 October 2026.
Branch: codex/mrf-step-login-followups. This is a discussion implementation, not a claim of production readiness.

Sources: second-brain/projects/formsg/singpass-all-steps-proposed-changes.md and https://formsg-workflow-explorations.open-2538.chatgpt.site/proposed-direction.html.

## Self-grill and pinned decisions

The user requested self-grilling rather than another interview. These decisions preserve the agreed design and existing backend invariants.

1. What is being built? The proposed direction across Create Fields, Create Workflow, Settings Singpass and submitted activity items. Alternative explorations and future send-back actions are excluded.
2. What is a person? A step respondent source is either static emails, an Email field, or a routing Dropdown field. One searchable input selects these existing representations; no new schema. Keep conditional mapping configuration available.
3. What is a login-filled field? One field instance populated by Singpass/Corppass identity or Myinfo data. It has one owner. Ordinary field sharing remains unchanged. Separate instances of an attribute may have different owners.
4. What saves a workflow edit? Existing Save step and save-and-switch commit one draft containing respondent, fields, approval and login. Cancel discards that draft. A modal only changes the draft. This resolves the handoff's open save question by preserving current FormSG behaviour.
5. How is the card organised? Name and respondent input, then Fields to fill, Approvals, Singpass tabs. Fields is initially active. Step 1 has an enabled Approvals tab explaining that only Step 2 onwards can approve; it has no approval controls. Hide unconfigured sections in saved cards. Preserve existing feature-flag fallbacks and guided setup until enabled surfaces use the proposed direction.
6. What happens to an owned field? Show it disabled with Assigned to Step X. Never silently transfer it. Selecting an available field requiring login opens Enable [provider] and assign field. A provider conflict lists fields to unassign, says they remain in the form, changes provider and selects the requested field in the same draft. Preserve ordinary fields and approval state. Cancel does nothing.
7. What does field addition do? A matching provider anywhere permits ordinary addition. Otherwise offer direct enablement or Add without enabling yet. Closed drafts may keep providerless fields. Addition never assigns a field. A confirmed provider switch unassigns incompatible fields from the selected step and keeps their definitions; flat forms keep their fields for later setup. Failed authentication saves do not add a field. If login saves but field drafting fails, explain the partial outcome. Open MRF forms must be closed before adding an unassigned authentication field.
8. How do Settings cards work? All steps, number/name and chip or Login not enabled. Initially collapsed; arrows between cards. One global link to Create Workflow. Per-card Save/Cancel. Readonly names; no respondent/field/approval controls. Existing flat settings for non-workflow forms. Step 1 restrictions use existing persisted settings and appear only on Step 1, in Create's Singpass tab too. Avoid a redundant Login heading.
9. Which provider appears in activity? The provider actually used for that submitted step, from historical submission evidence. Never derive it from today's workflow settings. Tag submitted items Singpass or Corppass; omit unknown/unauthenticated history. Do not expose identity values in the tag. Keep old records compatible.
10. What is the palette? Basic / Singpass / Corppass. Identity NRIC/FIN uses existing BiIdCard, Name retains person icon. Match existing FormSG controls and theme tokens.
11. What proves completion? Focused tests for save/cancel, ownership/modal transitions, addition guards and historical activity tags; frontend typecheck; appropriate backend/shared checks if changed; browser/Storybook review of all proposed surfaces. Record limits and outstanding work below. No forced pushes, no touching unrelated untracked files.

## Verification and progress

Implemented on the current exploration branch. New surfaces follow the existing feature flags; guided setup and unavailable-login fallbacks stay intact.

| Requirement | Implementation evidence | Checks |
|---|---|---|
| Single respondent source and three editing tabs | SingleRespondentInput, EditStepBlock, ConditionalRoutingOption | Input, draft builder and existing editor tests; full-page browser check |
| Visible single ownership and enable/switch modal | QuestionsBlock, MultiDropdownItem ownershipTag | Ownership, cancellation and draft assignment tests |
| Saved cards omit unconfigured features | InactiveStepBlock | Full-page saved-card browser review |
| Focused Settings cards | StepLoginAccordion, StepAuthSettingsEditor | Collapsed/one-open/dirty guard/save/failure tests; private/public browser checks |
| Step 1 restrictions in both places | StepOneLoginRestrictions, LoginBlock | Shared draft integration; Settings restriction browser checks; partial-failure tests |
| Field builder direct-enable and unassigned addition | FieldLoginGate, FieldListOption, MyInfoPanel | 10 tests including any-step availability, cancellation, failure, conflicts, stale form, CP service ID and post-save draft failure; real palette browser checks |
| Singpass palette and NRIC/FIN icon | FieldListDrawer, LoginIdentityFieldOption | Actual palette browser review |
| Historical submitted event tags | SubmittedStep authType, submission schema/service/controller, WorkflowActivityLog | 155 backend tests, activity rendering tests and three browser story scenarios |

Verification: frontend typecheck passed; 68 focused frontend tests passed across 11 files; 155 backend tests passed across 3 suites. Changed-file frontend lint has no errors (Fast Refresh helper-export warnings remain). Shared build and backend build-config typecheck passed. A separate broad backend typecheck (including test files) reports 134 test-file errors; it is not clean and is not represented as a passing check. git diff --check passed.

Discussion entry points on the running local Storybook (port 6006):
- Workflow: pages-adminformpage-create-workflowtab--proposed-direction
- Settings: pages-adminformpage-settings-authtab--private-mrf-step-login-accordion
- Fields: features-adminform-create-builder-and-design-builderanddesigndrawer-fieldlistdrawer--proposed-enable-in-modal
- Activity: features-adminform-responses-workflowactions-workflowactivitylog--mixed-providers

Browser evidence is in /private/tmp/formsg-proposed-full-workflow.png, /private/tmp/formsg-proposed-full-editor.png, /private/tmp/formsg-field-enable-modal.png, /private/tmp/formsg-settings-cards-collapsed.png and /private/tmp/activity-mixed-providers.png. These are local review captures, not production screenshots.

Limits: real Singpass/Corppass login was not exercised. Step 1 restrictions use separate existing endpoints after the step save; partial failures stay open with an explicit message and refresh saved data. Pre-save freshness checks do not replace server-side version checks, so cross-request concurrency remains a production follow-up. Existing records have no historical provider tag. Storybook AI commands were unavailable because addon-mcp is absent; existing stories and direct browser checks were used without adding tooling dependencies. Send-back and alternative exploration layouts are not part of the proposed direction.


## Independent review disposition

Review fixed point: c09fd82d8, feature branch head at implementation start. Four axes reviewed commit 17fde3a25.
- Standards: one component-consistency suggestion scored below the actionable threshold by an independent verifier (undocumented preference). The modal nevertheless now uses the existing FormSG SingleSelect and modal menu layer to keep the design-system treatment consistent.
- Spec: no findings.
- Architecture: fixed login-save outcome tracking in the field gate for workflow forms. The error stays visible if starting the field draft fails after authentication was saved; added a focused failure test.
- Divergent: no findings. Independent historical-provider review confirmed server provenance and admin-only visibility.

No review comments were posted externally. No real authentication or production deployment was performed.

## Superseding decision: incomplete drafts, validated publishing

Confirmed by the user on 29 October 2026. This replaces the earlier mandatory-enable and remove-fields-first rules above.

- Allow closed/private drafts to contain Singpass/Myinfo or Corppass fields before authentication is configured. Field addition offers Add without enabling yet alongside the direct-enable shortcut.
- Changing a step's provider or switching authentication off asks for confirmation when assigned fields become incompatible. List those fields, unassign them and change authentication together in the draft. Keep the field definitions in the form. Cancel changes nothing.
- Settings may update field assignments only for that explicitly confirmed unassignment. Save commits the resulting step; Cancel discards the draft.
- Publishing requires each login-filled field in an MRF form to have exactly one owner with the matching provider. For a form without workflow, its form-level provider must match its login-filled fields. Ordinary field sharing and unassigned-field behaviour are unchanged.
- Show actionable field-specific publication errors. Unconfigured draft fields remain discoverable and can use the enable-and-assign shortcut later.
- Preserve public-form editing restrictions and all respondent authentication enforcement. These are authoring/draft changes, not bypasses for responding to published forms.

Implemented for discussion. Existing published forms are not automatically closed or migrated. Reopening, or editing their workflow/field configuration, must satisfy the new authentication-field readiness rule.

Verification for this addendum:
- 52 focused frontend tests across 9 files, including draft-only addition, provider-switch confirmation/cancellation, field preservation, publish gating and stale-cache closing.
- 389 distinct backend tests across model, workflow, publication and settings services; 172 existing form/settings route tests. Real Mongo tests verify valid mixed-provider publishing, stale draft saves after publication, same-status public field/workflow races, repeated saves and legacy conversion.
- 41 shared validation tests; shared build; frontend and backend build-config typechecks; lint and whitespace checks.
- Browser checks cover blocked versus ready publishing, Add without enabling with zero authentication writes, desktop/mobile switch confirmation and the workflow tab/description refinements.

Independent safety review caught a same-status race between field-source changes and workflow reassignment. Field saves and query writes now compare the authentication configuration checked before mutation (provider, source attributes, ownership and status), and refuse stale writes. A real Mongo regression confirms the fix in both write orderings. The independent reviewer found no remaining security blocker. Runtime respondent authentication paths were not changed.


Verification note: one broad route-test attempt hit an HTTP parser error in an unchanged unauthenticated DELETE test; the clean rerun passed all 172 route tests. The earlier millisecond timestamp assertion also passed on rerun. Neither unrelated test was modified. Browser smoke checks used simulated authentication; real Singpass/Corppass was not exercised.
