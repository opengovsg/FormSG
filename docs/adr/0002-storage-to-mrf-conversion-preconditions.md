# 2. Storage-to-MRF conversion requires Private status and disconnected payments

Date: 2026-06-25

## Status

Accepted

## Context

The Convert button on a Storage form's settings page must decide when conversion is eligible. Two state dimensions on the source Storage form warranted gating:

- **Form status** — `Public` (accepting submissions) vs `Private`.
- **Payments** — `payments_channel.channel` (Stripe connection state) and `payments_field.enabled` (payment widget on the public form). MRF has no payment fields on its schema; these would be dropped on conversion.

We considered three alternatives:

1. Allow conversion in any state, silently drop incompatible config.
2. Allow conversion in any state, prompt the admin to confirm each silent drop in the convert modal.
3. Block conversion unless the form is in a "clean" state — Private, payments off.

## Decision

**Conversion is blocked unless both conditions hold:**

1. `status === FormStatus.Private`
2. `payments_channel.channel === PaymentChannel.Unconnected` **AND** `payments_field.enabled === false`

When either fails, the Convert button is disabled with a tooltip explaining which precondition is unmet ("Close the form to convert", "Disconnect payments to convert").

## Consequences

**Accepted trade-offs:**

- Admins who want to convert a payment-collecting public form must take three discrete actions (close form → disconnect Stripe & disable payment field → convert) rather than one. The friction is the point.
- We don't write a "payment cleanup on convert" code path — the admin handles cleanup explicitly through the existing payment-settings UI.

**Why this over the alternatives:**

- **Public-status gate**: in-flight submissions during a `responseMode` change risk validation drift (Storage submission schema vs MRF submission schema). Forcing Private eliminates the race entirely.
- **Payments gate**: silently dropping a Stripe channel link is a relationship to an external system that the admin should knowingly sever. The connection has billing implications; admins need to see it disappear from settings, not from a converter.
- **Reading the room**: matches the precedent of `isForceConvertToStorageMode` (admin-form.service.ts:1936), where Email→Storage conversion blocks publication until the conversion is acknowledged — gates on state, doesn't auto-resolve.

**What is *not* gated** (these carry over without admin action):

- Webhook URLs and settings (base schema).
- MyInfo / Singpass authType (base schema).
- `whitelistedSubmitterIds` (both schemas).
- `emails` (notification emails) — carries over, but becomes required in MRF; see follow-up decision on required-field handling.
- Form fields, logic, end-page configuration — unaffected by conversion at the schema level.

**Encrypt-only fields dropped on conversion** (acceptable because of ADR 0001 one-way decision):

- `payments_channel`, `payments_field`, `business`, `isForceConvertToStorageMode`.
