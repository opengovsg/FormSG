# Revised step authentication implementation plan

**Goal:** Apply the approved provider-availability, guided deletion and navigation-save policy.
**Spec:** second-brain/projects/formsg/singpass-all-steps-proposed-changes.md, pinned decisions 1–16.
**Architecture:** Keep shared validators authoritative. Server mutations validate the resulting form and atomically apply confirmed deletions with existing stale-write guards. Frontend stages changes, confirms destructive effects, and saves before navigation.
**Execution:** Approved by the user. Backend, destructive UI and navigation saving are independent work areas; integrate before final verification.

## Global constraints
- One provider must exist for every authentication field, including unassigned fields.
- At most one matching owner per authentication field. Ordinary field sharing is unchanged.
- Missing-provider palette options disabled with existing Settings guidance.
- Historical response data stays intact.
- Save/Cancel remain; navigation stops for invalid input or save failure.

## Tasks
- [x] Shared/server: replace providerless-draft and mandatory-owner rules; test missing provider, optional ownership, duplicate/mismatched owners and live compatible additions.
- [x] Server: atomic workflow collapse/provider switch/step deletion with explicit confirmed deletion IDs, reference cleanup, retained provider configuration and restriction reset. Test stale writes, cancellation contract, public restrictions and mixed provider IDs.
- [x] UI: guided mixed-provider deletion and immediate switch confirmation using existing FormSG modal patterns; stage until save, refresh form/settings caches after destructive writes.
- [x] Palette: disable missing-provider options and remove enable/add-later modal; fix notice layout. Test compatible live additions and no provider-mutation side effects.
- [x] Navigation: save valid dirty cards/routes before leaving, retain invalid/failed drafts, beforeunload warning, explicit Cancel and no duplicate saves. Add integration checks.
- [x] Integration: shared/backend/frontend tests, type/lint checks, Storybook browser paths and independent security/spec review. Update canonical implementation doc with evidence.

## Review focus
- Concurrent field or authentication edits must invalidate the confirmed deletion set.
- Navigation must not discard invalid or failed saves.
- Routing/logic references to deleted fields must not survive.
- Multiple Corppass e-service IDs need explicit existing configuration selection.
- Step 1 identity restrictions survive only when the provider stays unchanged.
