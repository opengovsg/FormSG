# 2. Per-step submission snapshots in a `submission_history` collection

Date: 2026-06-16

## Status

Accepted (extends, and partially supersedes, ADR-0001)

## Context

ADR-0001 decided MRF webhooks ship a **form-key copy** and persisted those copies
(`webhookEncryptedContent`, `webhookVerifiedContent`, `webhookAttachmentMetadata`,
`webhookVersion`, `isSubmissionSecretKeyIncluded`) **on the submission row** so retries,
which re-run `getWebhookView()` off the row, reproduce the payload.

An MRF submission is a *single row updated in place* per step (see CONTEXT.md). Persisting
the webhook copies on that row inherits the same in-place mutation: a webhook fires per step,
but a **delayed retry of an earlier step re-reads the row and sends the latest step's state**,
not the state at the step that failed. ADR-0001 accepted this staleness as pre-existing.

Two forces make that no longer acceptable:

1. **Per-step retry fidelity.** A retry should re-deliver *the step that failed*, not whatever
   the submission has since become. For a consumer that acts per step (e.g. plumber advancing
   the workflow), latest-wins retries deliver a different event under the same delivery slot.
2. **A general submission-history substrate.** We want an append-only record of submission
   state over time — confirmed as a precursor to audit logs before FormSG enters maintenance.
   Webhook payload reconstruction is simply its first consumer.

Storing one snapshot per step on the row is impossible (in-place mutation) and embedding an
array on the row risks the **16 MB BSON document limit** — MRF content is *cumulative* (each
step encrypts all answers so far), so per-step copies grow roughly O(steps × content).

## Decision

Introduce a generic, append-only **`submission_history`** collection: **one immutable document
per step submission**. The webhook payload is **reconstructed at send time from the live
submission row + the relevant history document** — the history document stores only the
**irreproducible per-step bits**; everything stable or reconstructible is read from the row.

This **supersedes** ADR-0001's "persisted on the submission row" storage location for the
form-key copies. The form-key-copy *concept*, the privileged-consumer policy, and the V4 gating
from ADR-0001 are unchanged; only *where* the copies live (and *when* the secret key is decided)
change.

### Schema (per document)

```
submissionId        ref + lookup key
formId              denormalized for history/audit queries
submissionIndex     zero-based position of this step submission in the order submitted
                    (= index in submission.submittedSteps)
workflowStep        workflow-definition position — contextual value, NOT a key
encryptedContent    form-public-key copy of the step content (required)
contentFormat       'v1' | 'v4' — shape of encryptedContent (required)
verifiedContent     form-public-key, signed (optional — only when verified content exists)
attachmentMetadata  form-public-key attachment S3 keys (optional — only when attachments exist)
createdAt
```

Unique index `{ submissionId: 1, submissionIndex: 1 }`; `{ formId: 1, createdAt: -1 }` for
history/audit queries.

### Why `submissionIndex`, not `workflowStep`

A workflow can **loop back** to an earlier step, so `workflowStep` repeats and cannot uniquely
identify an event. `submissionIndex` is strictly monotonic. It therefore serves three roles:
the **unique identity** of a snapshot, the **slice bound** for reconstructing `submittedSteps`,
and the **resolution pointer** carried by the webhook retry queue message.

### Why these fields are the minimum (the reconstruction split)

| Payload field | Source | Why |
|---|---|---|
| `formId`, `submissionId`, `created` | live row | immutable |
| `workflowContent.workflow` | live row | workflow definition on the row, stable |
| `workflowContent.workflowStep` | history | this event's workflow position |
| `workflowContent.submittedSteps` | **reconstructed** | `row.submittedSteps.slice(0, submissionIndex + 1)` — append-only, so the prefix *is* the historical state |
| `paymentContent` | live row | populate `row.paymentId` |
| `encryptedContent` / `contentFormat` | history | form-key copy — producible **only at submit time** (plaintext is server-side only then) |
| `verifiedContent`, `attachmentMetadata` | history | same, when present |
| `encryptedSubmissionSecretKey` | **live row, gated** | see below |

**`contentFormat` vs the webhook `version`.** History records the content *shape*
(`'v1'` = translated to classic `FormField[]`; `'v4'` = native answer objects), decided at
submit time by consumer policy (privileged → `'v4'`, generic → `'v1'`). The webhook *protocol*
version is **derived** at send: `'v4' → 3`, `'v1' → 2.1`. The protocol number never enters the
generic collection.

### The submission secret key is decided at send, not stored

`isSubmissionSecretKeyIncluded` is **no longer persisted** (removing it from ADR-0001). The raw
submission secret key is **invalidated once the next step is submitted** (each step re-mints the
keypair), so it is shipped only when the snapshot is the **current latest step**:

```
includeSubmissionSecretKey = (submissionIndex === row.submittedSteps.length - 1)  // latest step
                          && (getWebhookType(form.webhook.url) === 'plumber')      // privileged
```

When that is true, `submissionIndex` is the latest, so the **live row's**
`encryptedSubmissionSecretKey` already holds exactly that step's key — hence it is reconstructed
from the row and never stored in history (a stored key would only ever be the stale, never-shipped
kind).

### Resolution flow

- **Initial send** and **retry** both build the payload through the same reconstruction
  (`getWebhookView(historyDoc)`), so they are byte-identical.
- The webhook **queue message carries `submissionIndex`** (in addition to `submissionId`). The
  queue message version is bumped; deserialisation tolerates the absence of `submissionIndex`
  (in-flight legacy messages) and falls back to the live-row path, so queued retries survive deploy.

### Scope boundary

History snapshots are written **only on the V4 / Option D path**, where the form-key copies
exist. Legacy `plumber`-V3 webhooks retain today's live-row behaviour until V4 is enabled for
plumber.

## Consequences

- **Per-step retry fidelity.** A retry re-delivers the exact step that failed. This is the
  property ADR-0001 listed as pre-existing/out-of-scope; it is now resolved.
- **No 16 MB risk.** Cumulative per-step content lives in separate documents, not an array on
  one row.
- **A reusable history substrate** for audit logs and other consumers; webhook reconstruction is
  the first consumer, not a special case.
- **An extra write per step** (the history insert) and an extra read at send. The insert must be
  durable **before** the webhook is enqueued, and should commit in the same transaction as the
  step submission so a step and its snapshot are atomic.
- **Storage cost is unchanged in kind** from ADR-0001 (~the form-key copy per step) but now lives
  in `submission_history` rather than on the row; the row no longer carries `webhook*` fields.
- **Relies on the append-only invariant**: `submittedSteps` is written in exactly one place
  (an append), and per-entry approval status is stamped at append time, never back-filled. The
  `.slice()` reconstruction is correct only while this holds — any future code that mutates a
  prior `submittedSteps` entry breaks history fidelity and must instead append a new event.

## Alternatives considered

- **Keep form-key copies on the submission row (ADR-0001 as written)** — rejected: inherits
  in-place staleness (no per-step retry fidelity) and offers no audit substrate.
- **Embed a per-step array on the submission row** — rejected: cumulative MRF content makes the
  array grow O(steps × content), risking the 16 MB document limit.
- **A webhook-specific collection (e.g. `webhook_history`)** — rejected: narrower than the audit
  use case it must also serve. The collection is named and shaped for submission history in
  general; the webhook fields are the storage-mode submission shape, readable by any form-secret-key
  holder.
- **A discriminator field (`eventType`) now** — deferred: every document currently represents an
  MRF step submission. A discriminator can be added with a default later (one-line migration) if a
  non-step audit event is introduced.
