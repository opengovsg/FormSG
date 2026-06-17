# 1. MRF webhooks ship a form-key copy, not the submission secret key

Date: 2026-06-15

## Status

Accepted

## Context

MRF (multirespondent form) submissions encrypt their content to a *per-submission*
keypair. The raw submission secret key both **decrypts** the content and **authorizes
the next workflow step** (the next-step `PUT` route has no auth guard beyond rate
limiting — possession of the key + submissionId is the authorization).

The earlier MRF webhook design shipped `encryptedSubmissionSecretKey` (the submission
key wrapped to the form public key). A webhook consumer also holds the form secret key,
so it could unwrap the submission key and thereby **forge/advance the next step** — not
just read. We want webhook consumers to be read-only by default.

Separately, V4 encryption (answer objects with provenance) was deliberately disabled for
any form with a webhook URL (PR #9577), because webhook consumers could not yet parse V4
payloads. plumber.gov.sg is today the only MRF webhook consumer and currently receives V3
payloads; it is being migrated to V4.

## Decision

The webhook ships a **form-key copy**: a copy of the submission content encrypted
directly to the **form public key** (storage-mode style), decryptable with the form
secret key the consumer already holds. The submission secret key is no longer a default
part of the payload.

Two independent, persisted, per-submission policy dimensions govern the payload, both
derived today from `getWebhookType(url) === 'plumber'` but designed to generalise to a
class of *privileged consumers*:

- `isV4EncryptedContent` — ship V4 content as-is (`version 3`) vs convert to the V1
  `FormField[]` shape (`version 2.1`, byte-for-byte storage-mode format).
- `isSubmissionSecretKeyIncluded` — *additively* include the wrapped
  `encryptedSubmissionSecretKey` in the payload (granting workflow-advance/write
  capability). It does **not** replace any form-key copy and is **off by default**:
  every consumer reads content + attachments via the form key; this flag only layers a
  write credential on top for privileged consumers. Independent of version — a future
  consumer may take V4 content yet still be denied the key. Its sole purpose is to let a
  whitelisted client construct the next-step workflow submission link (advance the
  workflow); it is never needed to read a payload.

The form-key copies of **content, verified content, and attachments are produced
unconditionally on the V4 path** for every consumer (attachments encrypted to the form
public key, uploaded to S3, with a parallel persisted metadata map). The submission key
is never required to *read* a webhook payload.

MRF webhooks fire only when the submission is V4-encrypted, **except** that a `plumber`
consumer continues to receive its existing V3 webhook until V4 is enabled for it.
A webhook form goes V4 when `answer-object-encryption && enable-mrf-webhooks`.

The form-key copies and their policy (`webhookEncryptedContent`, `webhookVerifiedContent`,
`webhookAttachmentMetadata`, `webhookVersion`, `isSubmissionSecretKeyIncluded`) are
**persisted on the submission row** so webhook retries — which re-run `getWebhookView()`
off the row — reproduce the identical payload (nacl uses a random nonce, so re-encryption
would not be byte-identical, and S3 URLs must point at the already-uploaded form-key
attachment objects).

## Consequences

- **Forge risk closed by default.** Generic consumers receive a read-only V1 form-key copy
  with no write credential. No new authz primitive, no client change, no write-path change.
- **Uniform consumer contract.** Generic MRF webhooks decrypt on the exact storage-mode v2
  path; no `adaptV4ToV1` or SDK-version coupling on the consumer side.
- **~2× content at rest.** A second encrypted copy (under the form key) is persisted per
  submission, required for retry fidelity.
- **`getWebhookView` is a pure row read** for V4 submissions; it falls back to the legacy
  submission-key fields when the `webhook*` fields are absent (V3 / plumber-today).
- **plumber** receives a V4 form-key copy plus the wrapped key (read directly with the form
  secret key; advance the workflow with the key) once `enable-mrf-webhooks` is on.
- The `version` field alone signals shape to consumers (`2.1` = V1, `3` = V4); FormSG's own
  `crypto.decrypt` ignores it. Plumber distinguishes V3/V4 content via `isFieldResponsesV4`.

## Parity risk (full-parity V1 copy)

Storage-mode `encryptedContent` is produced **client-side** (the backend never sees its
plaintext), so the generic V1 copy is recreated server-side via `flattenV4ToFormFields` — the
existing converter that already feeds V4 submissions into the storage-mode CSV/Response
pipeline. Flatten's parity has two layers: **empty/unanswered** fields reuse the same
`transformInputsToOutputs` storage mode uses (structurally identical), whereas **answered**
fields go through a separate per-field mapping (`adaptV4ToV1`). The answered path is therefore
parity *by convergence*, not by construction. Mitigations: (a) each concern has one source —
answered → `adaptV4ToV1`, empty → the shared synthesizer, with the frontend
`transformInputsToOutputs` empty branch delegating to that same synthesizer; (b) per-field-type
parity tests assert flatten output equals the storage-mode `FormField` for every type. Both are
required, not optional — without them the two producers can silently drift.

## Alternatives considered

- **Ship the submission key (document-and-ship / minimize-exposure)** — rejected: leaves a
  write credential in every webhook body.
- **Bearer step-token / identity-binding / asymmetric proof-of-possession** (options A/B/C in
  `docs/mrf-webhook-submission-key-concerns.md`) — rejected for now: each adds a new authz
  primitive to *safely ship a dangerous credential*, when consumers only need to read. These
  remain relevant only if a consumer ever needs a deliberate, separately-authenticated
  write capability.
