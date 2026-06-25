# 3. Storage-to-MRF conversion is owner-only

Date: 2026-06-25

## Status

Accepted

## Context

The Convert button on a Storage form's settings page changes the form's `responseMode` from `encrypt` to `multirespondent` (see ADR 0001 for one-way semantics, ADR 0002 for state preconditions). The remaining gating decision was permission level: which collaborator role can trigger conversion?

FormSG defines three levels (admin-form.controller.ts):

- `PermissionLevel.Read` — view form & responses.
- `PermissionLevel.Write` — edit fields, logic, most settings.
- `PermissionLevel.Delete` — owner-only; used for archive and transfer-ownership.

## Decision

**Conversion requires `PermissionLevel.Delete` — owner-only.**

The convert action's backend handler uses the same permission check as `archiveForm` and `transferFormOwnership`. Collaborators with Write access see the Convert button as disabled with a tooltip explaining ownership is required.

## Consequences

**Accepted trade-offs:**

- A collaborator who wants the conversion done must ask the form owner to do it. Mild friction, but it's also a natural moment for the conversation to happen before an irreversible change.

**Why owner-only over Write:**

- Pattern-matches existing owner-only operations (archive, transfer ownership) — both are structural / irreversible actions on the form's identity.
- ADR 0001 makes conversion one-way. The same irreversibility profile as archive justifies the same permission profile.
- ADR 0002 requires disconnecting Stripe payments before convert — payments are an owner-level concern (billing identity), so the action that consumes that pre-condition should also be owner-level.
- A collaborator structurally re-typing another admin's form without consultation is the kind of cross-team incident that's easy to prevent at the permission gate and painful to clean up after the fact.
