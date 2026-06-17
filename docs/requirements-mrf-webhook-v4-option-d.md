# MRF v4 Webhooks — Option D (form-key copy) — Requirements

**Status:** Requirements settled; ready to break into a PRD and issues.
**Decision owner:** Kevin Foong.
**Design records:** `docs/adr/0001-mrf-webhook-form-key-copy.md` (form-key copy) +
`docs/adr/0002-mrf-submission-history-per-step-snapshots.md` (per-step storage & retry fidelity).
**Glossary:** `CONTEXT.md`.
**Background / alternatives:** `docs/mrf-webhook-submission-key-concerns.md`.

> This document captures **what** a successful implementation must deliver — the requirements,
> the context behind them, and the gates that govern behaviour. It deliberately omits the
> implementation breakdown (modules, files, sequencing); that is produced by `/to-prd` and
> `/to-issues`.

---

## 1. Context

An MRF (multirespondent form) submission is a **single database row updated in place** at each
workflow step; every step shares one `submissionId`, and the content is re-encrypted under a
**new** submission keypair each step. A webhook fires **once per step**.

Two properties of the current design motivate this work:

1. **The submission secret key is a write credential.** The raw submission secret key both
   decrypts a submission and authorises the next workflow step (the next-step route has no auth
   guard beyond rate limiting). Shipping it in every webhook body — as the earlier design did —
   hands every webhook consumer the ability to advance/forge the workflow, when consumers only
   need to read.

2. **In-place mutation breaks retries.** Because the row is overwritten each step, a delayed
   retry of an earlier step re-reads the row and delivers the **latest** step's state, not the
   state of the step that failed. A per-step consumer (e.g. plumber advancing the workflow) thus
   receives a different event under the same delivery slot.

V4 encryption (answer objects with provenance) was previously disabled for any form with a
webhook URL, because consumers could not parse V4 payloads. plumber.gov.sg is today the only MRF
webhook consumer and currently receives V3 payloads; it is being migrated to V4.

---

## 2. End goal

MRF webhooks ship a **form-key copy** of the submission — content, verified content, and
attachments encrypted **directly to the form public key** — so a consumer reads everything with
the **form secret key it already holds, and never needs the submission secret key to read**. The
raw submission key is shipped **only** to a whitelisted (privileged) consumer, **only** to let it
construct the next-step workflow submission link — never as a read credential.

After this work:

1. A **generic** consumer decrypts the content with the form secret key on the **exact
   storage-mode v2 path**, and the result is a **full-parity V1 `FormField[]`** (form-definition
   order, synthesized empty entries, Statement/Image excluded, verified fields appended) —
   byte-for-byte the shape a storage-mode form delivers. No submission secret key in the payload;
   attachments decrypt with the form secret key.
2. A **plumber** (privileged) consumer receives the content as a **form-key copy in V4 shape**,
   decryptable directly with the form secret key, **plus** the wrapped submission secret key to
   advance the workflow.
3. MRF webhooks fire **only when the submission is V4-encrypted**, with the single exception that
   **plumber keeps receiving its current V3 webhook** until V4 is enabled for it.
4. Webhook **retries reproduce the identical payload of the step that failed** — not the latest
   state.
5. The internal next-step submission/edit flow is **unchanged**.

---

## 3. Gates (the conditions that govern behaviour)

These are the decision gates a correct implementation must honour, independent of how it is built.

### 3.1 V4 encryption gate
A webhook form goes V4 only when the global V4 rollout **and** the (currently dormant)
`enable-mrf-webhooks` flag are both on:

```
useV4Encryption = answerObjectEncryption && (!hasWebhookUrl || enableMrfWebhooks)
```

(Replaces today's `answerObjectEncryption && !hasWebhookUrl`.)

### 3.2 Send gate
An MRF webhook is sent iff:

```
mrfVersion === 2  ||  webhookType === 'plumber'
```

→ V4 ⇒ sent to every consumer; V3 ⇒ sent to **plumber only**; generic-V3 ⇒ **nothing**.

### 3.3 Per-consumer payload policy (two independent dimensions)
Both derived today from the privileged-consumer class (`webhookType === 'plumber'`), designed so
the privilege class can grow without any other code branching on the URL:

- **Content shape** — privileged consumers receive the form-key copy in **V4 shape**
  (`contentFormat 'v4'`, webhook protocol `version 3`); everyone else receives the **full-parity
  V1 `FormField[]`** shape (`contentFormat 'v1'`, webhook protocol `version 2.1`). The protocol
  `version` is **derived** from `contentFormat`, never stored.

- **Submission-secret-key inclusion** — the wrapped submission secret key is **additively**
  attached (a write/advance credential only, never required to read) iff:

  ```
  webhookType === 'plumber'                              // privileged
  && submissionIndex === submittedSteps.length - 1       // latest step only
  ```

  It is **decided at send time, not persisted**: the key is invalidated once the next step is
  submitted, so it is shipped only while it is still the live row's current-step key.

---

## 4. Storage & reconstruction requirements

### 4.1 Per-step snapshots (ADR-0002)
The form-key copies are **not persisted on the submission row**. They live in an append-only
`submission_history` collection — **one immutable document per step submission** — storing only
the irreproducible per-step bits:

```
submissionId        ref + lookup key
formId              denormalized for history/audit queries
submissionIndex     zero-based position of this step in the order submitted
                    (= index in submittedSteps); strictly monotonic
workflowStep        workflow-definition position — contextual, NOT a key
encryptedContent    form-public-key copy of the step content (required)
contentFormat       'v1' | 'v4' — shape of encryptedContent (required)
verifiedContent     form-public-key, signed (optional — only when present)
attachmentMetadata  form-public-key attachment S3 keys (optional — only when present)
createdAt
```

Unique index `{ submissionId, submissionIndex }`; secondary `{ formId, createdAt }`. Documents
are **never updated in place**. The submission row gains **no** webhook-specific fields.

### 4.2 Reconstruction at send time
The webhook payload is **reconstructed from the live row + the step's snapshot**, so initial sends
and retries are byte-identical. The split:

| Payload field | Source |
|---|---|
| `formId`, `submissionId`, `created`, payment, workflow definition | live row |
| `encryptedContent`, `verifiedContent`, attachments | snapshot |
| `version` | **derived** at send from the snapshot's `contentFormat` (`'v4' → 3`, `'v1' → 2.1`) |
| `workflowStep` | snapshot |
| `submittedSteps` | reconstructed as `row.submittedSteps.slice(0, submissionIndex + 1)` |
| wrapped submission secret key | live row, gated (§3.3) |

The on-the-wire payload (`WebhookData`) carries `version: number` and **no** `contentFormat` field —
unchanged from today's contract. `contentFormat` (`'v1'` \| `'v4'`) is a storage-only descriptor on the
snapshot: an **input** to reconstruction, never shipped. `version` is the consumer-visible **output**
derived from it.

The legacy path (V3 / plumber-today, where no snapshot exists) returns **exactly today's
payload** — no behaviour change.

### 4.3 Retry resolution
The webhook retry queue message must carry `submissionIndex` alongside `submissionId` so a retry
resolves the **correct step's snapshot**. The message version is bumped; deserialisation tolerates
the absence of `submissionIndex` (in-flight legacy messages) and falls back to the live-row path,
so queued retries survive deploy.

### 4.4 Atomicity
A step's snapshot must be written **atomically with the step submission** and be durable **before**
the webhook is enqueued.

---

## 5. Invariants the design relies on

- **Append-only `submittedSteps`.** `submittedSteps` is written in exactly one place (an append),
  and per-entry approval status is stamped at append time, never back-filled. The
  `slice(0, submissionIndex + 1)` reconstruction is correct **only** while this holds — any future
  code that mutates a prior `submittedSteps` entry breaks history fidelity and must instead append
  a new event.

- **One source of truth for V4→V1 conversion.** The full-parity flatten (answered-field mapping +
  empty-entry synthesis + form-definition ordering + verified-append) must exist in exactly one
  place, shared by the backend producer and the frontend decrypt path — no divergent copies.

- **`submissionIndex`, not `workflowStep`, is identity.** A workflow can loop back, so
  `workflowStep` repeats; only `submissionIndex` uniquely identifies a step submission.

---

## 6. Acceptance criteria

- [ ] A generic MRF webhook's content decrypts via the storage-mode path to a **full-parity V1
      `FormField[]`** (form order, empty entries, headers excluded, verified appended); the payload
      contains **no** submission secret key.
- [ ] A plumber MRF webhook ships **V4** content (`version 3`) decryptable with the form secret key
      **and** the wrapped submission secret key.
- [ ] Attachments are decryptable with the form secret key for every consumer.
- [ ] `verifiedContent`, when present, decrypts and verifies on the storage-mode signing path.
- [ ] MRF webhooks fire iff `mrfVersion === 2 || webhookType === 'plumber'`.
- [ ] Webhook retries reproduce the identical payload **of the step that failed**, verified across
      a **loop-back workflow** (where `workflowStep` repeats).
- [ ] Each step submission writes exactly one immutable `submission_history` document
      (`{submissionId, submissionIndex}` unique), atomically with the step submission.
- [ ] The submission secret key ships only to a privileged consumer **and** only for the latest
      step; a non-latest-step retry carries none.
- [ ] A legacy queue message (no `submissionIndex`) falls back to the live-row path.
- [ ] The V4→V1 conversion has a single shared source of truth; no duplicate copy remains.
- [ ] The internal next-step submission/decryption flow is unchanged (existing tests pass).

---

## 7. Out of scope / follow-ups

- Anti-forge options A/B/C (token / identity-binding / proof-of-possession) — unneeded; Option D
  never exposes a write credential by default (see ADR-0001 / concerns doc).
- A deliberate, separately-authenticated "advance workflow via API" capability beyond the
  whitelisted submission-secret-key grant.
- Webhook signature covering the body (today covers URI + submissionId + formId + epoch) —
  pre-existing, storage-mode-wide.
- Audit-log consumers of `submission_history` (the collection is shaped to generalise, but only the
  webhook reconstruction consumer is built here), and an `eventType` discriminator — deferred until
  a non-step event exists.
- Generalising the privileged-consumer whitelist beyond plumber (a future consumer onboarding
  mechanism).
