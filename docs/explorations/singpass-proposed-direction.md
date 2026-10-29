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

Final review of implementation commit 2765abf33 against 269056103: Standards, Spec and Divergent reviews reported no actionable findings. Architecture/safety review independently confirmed the field/workflow race fix and found no remaining blocker. Review was read-only; automated and browser checks are recorded separately above.

## Revised implementation contract, 29 October 2026

## Pinned implementation decisions, 29 October 2026

These decisions supersede earlier draft-versus-publish rules and conflicting descriptions below. Implementation alignment is pending. The supplied transcript is a discussion summary, not evidence of current code behaviour.

1. **Adding authentication fields:** block addition unless the form already has the matching authentication provider. For workflow forms, at least one step must use that provider. A Singpass step does not enable Corppass fields, or vice versa. Remove the previously approved “Add without enabling yet” path.
2. **Assignment:** each individual Singpass/Corppass field may be assigned to at most one workflow step. This is per field instance, not per Myinfo attribute.
3. **Unassigned fields:** authentication fields may remain unassigned, including when publishing, provided at least one workflow step has their matching provider. Assignment and provider availability are separate constraints.
4. **Deleting a mixed-authentication workflow:** allow deletion through a guided confirmation. The admin chooses Singpass or Corppass, then reviews the fields of the other provider that will be deleted from the form. Confirming removes those fields and the workflow. “Delete fields” here means remove their form definitions, not merely unassign them. Cancellation must not apply the proposed changes.

5. **Last provider removed:** when changing or deleting the final step using a provider, confirm deletion of the form fields that depend on it. List the affected fields. Cancellation preserves the existing configuration and fields.
6. **Deleting a single-provider workflow:** retain its sole provider and all compatible fields as form-level settings, even if that provider was previously configured on a later step. Skip the provider picker. With no providers, retain no authentication.
7. **Navigation saving:** include saving when navigating away in this implementation. Exact navigation boundaries, failure handling and confirmation timing remain open below. This replaces the earlier recommendation to defer navigation saving.

8. **Navigation save boundaries and failures:** save valid edits when leaving a card, switching Create/Settings, or leaving the editor through application navigation. If saving fails, stop navigation and retain the edits with a visible error. Show saving progress. Browser/tab closure can warn about unsaved changes but cannot guarantee a completed save.
9. **Confirmation timing:** show destructive authentication-change confirmation immediately on selection. Confirmation stages the changes; Save or navigation commits them. Cancellation restores the prior selection. If another step still supplies the old provider, only unassign incompatible fields from the changed step, retaining their definitions.
10. **Live forms:** allow authentication-field additions when a matching provider already exists. Require form closure before whole-workflow deletion or an authentication change that deletes fields.
11. **Corppass configuration on workflow deletion:** reuse the existing e-service ID automatically if all retained Corppass steps share it. If IDs differ, ask the admin which existing configuration to retain.
12. **Deleted-field references:** list affected logic/routing rules in confirmation and clean up references using existing field-deletion behaviour. Historical responses remain untouched.

13. **Missing-provider palette behaviour:** follow the existing FormSG interaction rather than introducing an enable-and-add modal. Keep the provider tab accessible under its existing visibility rules; disable its field options when no matching provider exists. Show the existing guidance to enable the provider in Settings. For workflow forms, provider availability means any step uses it. There is no “Add without enabling yet” path.

### Code evidence for palette behaviour

Read-only inspection of cached `origin/develop` (`532bb4d19`, 27 October) and `origin/feat/mrf-step-login-all-steps` (`c09fd82d8`, 28 October) found that missing authentication disables the field options, not the provider tab. The tab itself is disabled only while loading. Corppass tab visibility additionally depends on its existing feature flag and supported form mode. Guidance says “Enable {Singpass/Corppass} in the Settings tab to access these fields.” These local refs do not establish the currently deployed UI.

The current follow-up branch intentionally removed that field-option gating and added `FieldLoginGate`; that behaviour must be revised to match the new decision.

14. **Save and Cancel remain:** keep both buttons alongside navigation saving. Invalid input stops navigation and highlights errors. Cancel discards the card draft, including staged field deletions. Failed saves preserve edits and prevent navigation.
15. **Step 1 restrictions when deleting a workflow:** retain the one-response limit and eligible-respondent list when the resulting form keeps the original Step 1 provider. If that provider changes, reset those restrictions and disclose the reset in the final confirmation.
16. **Superseded publication notice:** unassigned authentication fields alone must not trigger the old “Finish authentication setup before publishing” warning. Revise readiness validation to use provider availability and maximum-one matching assignment. Correct the notice layout wherever a legitimate remaining error still needs displaying.

### Implementation safeguards

- Commit workflow removal, chosen form-level authentication, incompatible-field deletion, reference cleanup and restriction resets together. A failed operation must not partially delete fields or leave authentication inconsistent.
- Retain existing stale-configuration protection: if another edit changes the configuration, report the conflict and require a refreshed confirmation rather than deleting a newly changed set of fields.
- Historical responses are never deleted by these configuration changes.

### Approval status

The user confirmed the full plan on 29 October 2026 and authorised implementation. Verification is in progress. This section supersedes conflicting historical descriptions below; those older sections are not the implementation contract.

## Final revised-policy verification, 29 October 2026

The implementation now follows the revised provider-availability policy, replacing the earlier incomplete-draft/mandatory-owner experiment. Latest UI refinements also supersede the older Step 1 Approvals explanation: Step 1 has only Fields to fill and Singpass tabs. Settings uses the workflow's exact LogicBadge for provider chips. Successful full settings saves show “Authentication settings saved.” for explicit and navigation saves; failures and partial restriction saves do not.

- Shared validation: 37 tests across step-login and login-identity suites.
- Backend: six model/service suites passed 399 cases; the final guided-deletion suite adds two further regression cases, bringing the distinct unit coverage to 401. Four route/validator suites passed 189 cases.
- Frontend: 58 focused tests across 11 files passed, covering field availability, optional ownership, destructive confirmation/cancellation, publication, navigation save/failure and success-toast suppression.
- Frontend typecheck and backend build-config typecheck passed. Changed-file lint has no errors; the two existing EditStepBlock Fast Refresh warnings remain.
- Browser checks: missing-provider palette options disabled with Settings guidance; matching later-provider fields available on a public form; unassigned fields publishable; warning contents stacked; mixed-provider deletion and CP configuration selection with Back and no writes before confirmation; desktop/mobile previews; Settings card navigation writes once and displays a success toast.
- Independent Standards review found no actionable issue. Spec/Divergent review identified legacy SP/MyInfo provider-family retention, fixed with regression coverage. Safety/Architecture recheck found no remaining actionable finding, including scalar stale-write guards and legacy records missing schema defaults.

Evidence: /private/tmp/revised-shared-tests-final.log, revised-backend-tests-complete.log, revised-backend-routes-complete.log, revised-frontend-complete.log, revised-frontend-complete-types.log, revised-palette-browser.log, revised-publish-browser.log, revised-deletion-browser.log and revised-settings-navigation-browser.log. Step 1 tab browser checks passed with exactly two tabs on Step 1 and three on later steps (revised-step1-tabs-browser.log); the 11 workflow regression tests passed again after this refinement (revised-step1-final-tests.log).

Limits: Storybook authentication is simulated; real Singpass/Corppass was not exercised. Browser close warns about unsaved edits but cannot guarantee an asynchronous save. Step 1 restriction saves still use existing separate endpoints and explicitly report partial failure. No production deployment or automatic migration of existing forms was performed. The broad backend test-file typecheck limitation recorded above remains separate from the passing build-config check.
