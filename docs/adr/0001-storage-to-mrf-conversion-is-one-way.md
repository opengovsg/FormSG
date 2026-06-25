# 1. Storage-to-MRF conversion is one-way

Date: 2026-06-23

## Status

Accepted

## Context

We're adding a feature that lets a form admin convert a Storage-mode form (`responseMode: encrypt`) into a Multi-Respondent Form (`responseMode: multirespondent`) from the form's settings page. The conversion changes the discriminator, drops Encrypt-only fields (`payments_channel`, `payments_field`, `business`, `isForceConvertToStorageMode`), and populates MRF-required fields (`workflow`, `stepsToNotify`, `emails`).

The question was whether the conversion should be reversible — i.e., should MRFs that were converted from Storage be convertible back?

## Decision

**Conversion is one-way.** Once a Storage form has been converted to MRF, it cannot be converted back to Storage mode through the product. Admins who want a recoverable path must duplicate the form *before* converting; the confirm UX nudges them to do so.

## Consequences

**Accepted trade-offs:**

- Admins who convert by mistake have no in-product recovery. They must rebuild the form, or restore from a pre-conversion duplicate if they made one.
- Encrypt-only field values (`payments_channel`, `payments_field`, `business`) are dropped on conversion and not preserved in `metadata` — there is no rollback path that needs them.

**Why one-way over two-way:**

- Two-way creates a state-management nightmare for payments: a rolled-back form would need to re-attach to its Stripe account, which may have been disconnected or revoked between the convert and the rollback.
- Workflow steps configured in MRF mode would be silently lost on rollback, which is a footgun.
- The only existing analog in the codebase, `isForceConvertToStorageMode` (used for Email→Storage), is also conceptually one-way: the email-only fields are abandoned, not preserved.
- Simpler `metadata` history schema — we record "converted from X on Y" rather than a full audit trail with restorable snapshots.

**Mitigations for the loss of reversibility:**

- The confirm modal explicitly warns that conversion is irreversible.
- The modal suggests duplicating the form first as the recommended recovery pattern.
