# PRD: MRF v4 Webhooks — Option D (form-key copy)

**Design records:** `docs/adr/0001-mrf-webhook-form-key-copy.md`, `docs/adr/0002-mrf-submission-history-per-step-snapshots.md`
**Glossary:** `CONTEXT.md`
**Requirements:** `docs/requirements-mrf-webhook-v4-option-d.md`
**Background / alternatives:** `docs/mrf-webhook-submission-key-concerns.md`

## Problem Statement

As a form admin who runs a multirespondent form (MRF) with a webhook, I want my webhook consumer to be able to read every step's submission using only the form secret key I already hold — and I do **not** want every webhook delivery to hand that consumer a credential capable of advancing or forging my workflow.

Two facts about MRF make today's design unsafe and unreliable:

1. **The submission secret key is a write credential, not just a read key.** For an MRF, the raw submission secret key both decrypts the step content *and* authorises the next workflow step (the next-step route has no auth guard beyond rate limiting). The earlier webhook design shipped the wrapped submission secret key in every webhook body. Because a webhook consumer also holds the form secret key, it could unwrap that submission key and **advance or forge the workflow** — when all it needed to do was read.

2. **An MRF submission is one row mutated in place, so retries deliver the wrong event.** Every workflow step overwrites the same database row (content re-encrypted under a fresh submission keypair each step). A delayed retry of an earlier step re-reads the row and ships the **latest** step's state, not the state of the step that actually failed. A per-step consumer (e.g. plumber advancing the workflow) receives a different event under the same delivery slot.

Separately, V4 encryption (answer objects with provenance) was deliberately disabled for any form with a webhook URL, because consumers could not parse V4 payloads. plumber.gov.sg is today the only MRF webhook consumer; it currently receives V3 and is being migrated to V4.

## Solution

MRF webhooks ship a **form-key copy** of the submission — content, verified content, and attachments encrypted **directly to the form public key** (storage-mode style) — so any consumer reads everything with the **form secret key it already holds, and never needs the submission secret key to read**.

- A **generic** consumer decrypts the content on the exact storage-mode v2 path and gets a **full-parity V1 `FormField[]`** — byte-for-byte the shape a storage-mode form delivers. No submission secret key in the payload; attachments decrypt with the form secret key.
- A **plumber** (privileged) consumer additionally receives the content as a **form-key copy in V4 shape**, plus the wrapped submission secret key — but **only** to construct the next-step workflow link (advance the workflow), and **only** while it is still the live step's key.
- The form-key copies are **not** stored on the mutated submission row. Each step writes one immutable document to an append-only `submission_history` collection holding only the irreproducible per-step bits. The webhook payload is **reconstructed at send time from the live row + that step's snapshot**, so an initial send and any later retry are byte-identical and a retry re-delivers **the step that failed** — even across a loop-back workflow where the workflow-step number repeats.

The whole feature is gated behind the dormant `enable-mrf-webhooks` flag, so it can land incrementally without changing production behaviour until enabled.

## User Stories

1. As a form admin with an MRF webhook, I want my webhook consumer to decrypt each step's content with the form secret key I already hold, so that I never have to manage a separate per-submission key.
2. As a form admin, I want my generic webhook consumer to receive content in the identical shape a storage-mode form delivers, so that my existing storage-mode integration code works unchanged.
3. As a form admin, I want my webhook consumer to be read-only by default, so that a leaked or logged webhook body cannot be used to advance or forge my workflow.
4. As a generic webhook consumer, I want the submission content as a full-parity V1 `FormField[]` (form-definition order, synthesized empty entries, Statement/Image excluded, verified fields appended), so that I can parse it exactly as I parse a storage-mode submission.
5. As a generic webhook consumer, I want attachments delivered as form-key copies in S3, so that I can download and decrypt them with the form secret key.
6. As a generic webhook consumer, I want verified content (when present) to decrypt and verify on the storage-mode signing path, so that I can trust verified fields without new tooling.
7. As plumber (a privileged consumer), I want the step content as a form-key copy in V4 shape (`version 3`), so that I keep V4's answer-object provenance while still decrypting with the form secret key.
8. As plumber, I want the wrapped submission secret key delivered alongside the V4 content, so that I can construct the next-step workflow submission link and advance the workflow.
9. As plumber, I want the submission secret key delivered **only** for the latest step, so that I am never handed a key that has already been invalidated by a subsequent step.
10. As a form admin, I want MRF webhooks to fire only once the submission is V4-encrypted, so that consumers never receive a V4 payload they cannot parse — with the single exception that plumber keeps receiving its current V3 webhook until V4 is enabled for it.
11. As a form admin whose webhook delivery transiently failed, I want the retry to deliver the exact payload of the step that failed, so that my consumer processes the correct event and not whatever the submission has since become.
12. As plumber advancing a loop-back workflow (where the workflow-step number repeats), I want each retry resolved to the correct step submission by its monotonic position, so that loop-back steps are never confused with each other.
13. As a platform operator, I want each step submission to write exactly one immutable history document atomically with the step, so that a step and its webhook snapshot can never diverge.
14. As a platform operator, I want webhook retry queue messages that predate this change to still deliver (falling back to the live-row path), so that in-flight retries survive the deploy.
15. As a platform operator, I want the V4→V1 conversion to have a single shared source of truth across backend and frontend, so that the two producers cannot silently drift out of parity.
16. As a form admin, I want the internal next-step submission and edit flow to be completely unchanged, so that this webhook work introduces no regression to how respondents fill steps.
17. As a future platform engineer, I want `submission_history` to be a generic substrate (not webhook-specific), so that audit logs and other consumers can build on it later without a new collection.
18. As a future platform engineer, I want the privileged-consumer policy derived from a single classification of the webhook URL, so that adding a new privileged consumer requires no other code to branch on the URL.

## Implementation Decisions

### Modules

The implementation centers on six modules. The two purest (M1, M2) concentrate the correctness and are isolated for unit testing.

- **M1 — Webhook view reconstruction (deep).** A pure function `(liveRow, snapshot) → WebhookData`. Encapsulates the row/snapshot reconstruction split, the `submittedSteps.slice(0, submissionIndex + 1)` prefix reconstruction, the `contentFormat → version` derivation, and the two reconstruction branches: called **with** a `submissionIndex` (initial V4 send / new-type retry) the snapshot must exist and a missing one is a data-integrity error (fail loud, never silently fall back); called **without** one (V3 / plumber-today / legacy) it returns today's live-row payload. Initial send and retry both flow through this one function, which is what makes them byte-identical.
- **M2 — Send-time payload policy (deep).** A pure function `(webhookType, submissionIndex, submittedSteps.length) → { contentShape, includeSecretKey }`. The single place the two-dimension privileged-consumer decision lives; nothing else branches on the URL.
- **M3 — V4→V1 full-parity flatten (deep, pre-existing).** `flattenV4ToFormFields` becomes the **single shared** source of truth for producing the V1 `FormField[]` shape (answered fields → `adaptV4ToV1`; empty/unanswered fields → a shared synthesizer that the frontend `transformInputsToOutputs` empty branch also delegates to). No divergent copies.
- **M4 — `submission_history` persistence.** Append one immutable document; read by `{ submissionId, submissionIndex }`. Owns the append-only + unique-index invariant.
- **M5 — Form-key copy producer.** At submit time, encrypts content, verified content, and attachments to the form public key and assembles the snapshot fields.
- **M6 — Retry queue message (de)serialization.** Two message types discriminated by `_v`: the existing **legacy type** (current `QUEUE_MESSAGE_VERSION`, no `submissionIndex`) and a **new type** with `QUEUE_MESSAGE_VERSION` bumped and `submissionIndex` **required**. Deserialisation parses against both (a discriminated union on `_v`). The retry path is selected by message type: legacy ⇒ previous live-row mechanism; new ⇒ snapshot reconstruction. In-flight legacy messages still parse and fall back to the live-row path, so retries survive the deploy.

### Reconstruction split (the M1 contract)

| Payload field | Source |
|---|---|
| `formId`, `submissionId`, `created`, payment, workflow definition | live row |
| `encryptedContent`, `verifiedContent`, attachments | snapshot |
| `version` | **derived** at send from the snapshot's `contentFormat` (`'v4' → 3`, `'v1' → 2.1`) |
| `workflowStep` | snapshot |
| `submittedSteps` | reconstructed as `row.submittedSteps.slice(0, submissionIndex + 1)` |
| wrapped submission secret key | live row, gated (see policy) |

**Wire shape is unchanged from today.** The webhook payload (`WebhookData`) carries `version: number` and has **no** `contentFormat` field. `contentFormat` (`'v1'` \| `'v4'`) is a storage-only descriptor on the snapshot document: it is an *input* to reconstruction (so M1 knows how to interpret the stored `encryptedContent`), never shipped. `version` is the consumer-visible *output* derived from it. This preserves the existing contract — consumers continue to key off `version` to distinguish shape.

### Gates

These conditions govern behaviour independent of how the code is structured.

- **V4 encryption gate** — replaces today's `answerObjectEncryption && !hasWebhookUrl`:

  ```
  useV4Encryption = answerObjectEncryption && (!hasWebhookUrl || enableMrfWebhooks)
  ```

- **Send gate** — an MRF webhook is sent iff:

  ```
  mrfVersion === 2  ||  webhookType === 'plumber'
  ```

  → V4 ⇒ sent to every consumer; V3 ⇒ sent to **plumber only**; generic-V3 ⇒ nothing.

- **Per-consumer payload policy** (the M2 decision, two independent dimensions):
  - **Content shape** — privileged consumers receive the form-key copy in **V4 shape** (`contentFormat 'v4'`, protocol `version 3`); everyone else receives the **full-parity V1 `FormField[]`** (`contentFormat 'v1'`, protocol `version 2.1`). The protocol `version` is **derived** from `contentFormat`, never stored.
  - **Submission-secret-key inclusion** — the wrapped submission secret key is **additively** attached (write/advance credential only, never required to read) iff `webhookType === 'plumber' && submissionIndex === submittedSteps.length - 1`. Decided at send time, **not persisted**.

### Schema: `submission_history` (one immutable document per step submission)

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

Unique index `{ submissionId, submissionIndex }`; secondary `{ formId, createdAt }`. Documents are never updated in place. The submission row gains **no** webhook-specific fields.

### Atomicity

A step's snapshot must be written **atomically with the step submission** and be durable **before** the webhook is enqueued. (The transaction boundary is the one open architectural choice — a good HITL checkpoint during implementation.)

### Invariants the design relies on

- **Append-only `submittedSteps`.** Written in exactly one place (an append); per-entry approval status stamped at append time, never back-filled. The `slice(0, submissionIndex + 1)` reconstruction is correct only while this holds.
- **One source of truth for V4→V1 conversion** (M3) — shared by the backend producer and the frontend decrypt path.
- **`submissionIndex`, not `workflowStep`, is identity** — a workflow can loop back, so `workflowStep` repeats; only `submissionIndex` uniquely identifies a step submission.

## Testing Decisions

A good test here asserts **external behaviour** — the payload a consumer would receive, the documents written, the decisions made — never internal call sequencing. All four tested modules below have pure or near-pure interfaces, which makes behavioural assertions clean.

- **M1 — reconstruction.** Given a live row and a snapshot, assert the reconstructed payload. Key cases: initial send vs retry produce a **byte-identical** payload; a retry of an earlier step in a workflow that returns to an earlier step (where `workflowStep` repeats) reproduces that step's payload, not the latest; a call **without** a `submissionIndex` (legacy) falls back to today's live-row payload unchanged; a call **with** a `submissionIndex` whose snapshot is missing fails loud (data-integrity error) rather than falling back.
- **M2 — policy.** A decision-table test over `(webhookType, submissionIndex, submittedSteps.length)`: secret key attached iff plumber **and** latest step; content shape `v4`/`version 3` for plumber, `v1`/`version 2.1` otherwise; a non-latest-step retry carries no key.
- **M3 — flatten parity.** Per-field-type tests asserting `flattenV4ToFormFields` output equals the storage-mode `FormField` for every field type (ADR-0001 marks these **required**, not optional — without them the backend and frontend producers can silently drift). Prior art: existing storage-mode CSV/Response pipeline conversion tests that already exercise `flattenV4ToFormFields`/`adaptV4ToV1`.
- **M4 — history persistence.** Assert exactly one immutable document is written per step, `{ submissionId, submissionIndex }` uniqueness is enforced, and the write is atomic with the step submission (a failed step writes no snapshot). Prior art: existing submission-model persistence tests in the multirespondent-submission module.
- **M5 — form-key copy producer.** Assert **round-trip decryptability**: content, verified content, and attachments encrypted to the form public key decrypt back to the original plaintext with the form secret key. nacl uses a random nonce, so the assertion is round-trip recovery (the external behaviour a consumer depends on), not byte-equality. This is the only module whose tests prove the snapshot's `encryptedContent` is actually form-key-decryptable — M1's tests assume a correct snapshot. Prior art: existing storage-mode encrypt/decrypt round-trip tests.

## Out of Scope

- Anti-forge options A/B/C (bearer step-token / identity-binding / proof-of-possession) — unneeded; Option D never exposes a write credential by default (ADR-0001 / concerns doc).
- A deliberate, separately-authenticated "advance workflow via API" capability beyond the whitelisted submission-secret-key grant.
- A webhook signature covering the body (today covers URI + submissionId + formId + epoch) — pre-existing, storage-mode-wide.
- Audit-log consumers of `submission_history` and an `eventType` discriminator — the collection is shaped to generalise, but only the webhook reconstruction consumer is built here; deferred until a non-step event exists.
- Generalising the privileged-consumer whitelist beyond plumber (a future consumer-onboarding mechanism).

## Further Notes

- The feature lands behind the dormant `enable-mrf-webhooks` flag, so every slice is safely mergeable AFK without changing production behaviour until the flag is turned on.
- `/to-prd` synthesized this PRD from the settled requirements doc and ADRs; the vertical-slice issue breakdown is produced by `/to-issues`.
- The atomicity transaction boundary (§ Atomicity) is the single open architectural question and should be a human-in-the-loop checkpoint.
