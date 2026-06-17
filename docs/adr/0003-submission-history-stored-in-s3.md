# 3. `submission_history` snapshots are stored in S3, not a MongoDB collection

Date: 2026-06-17

## Status

Accepted (supersedes ADR-0002's storage *backend*; the reconstruction model is unchanged)

## Context

ADR-0002 introduced an append-only `submission_history` of one immutable snapshot per
MRF step, and placed it in a **MongoDB collection**. That choice was incidental to the
ADR's real subject (the row/snapshot reconstruction split); it picked Mongo because the
step submission already runs there and a snapshot could ride the same transaction.

Two facts now push the *backend* (not the model) off Mongo:

1. **Database size is a live blocker.** The form-key copy is a second at-rest copy of
   cumulative MRF content (O(steps × content)). Multiplying that across every step of
   every webhook form materially grows the Mongo working set and its index/storage cost.
   The snapshot is **write-once, read-rarely** (a retry, or a future audit read) — the
   canonical profile for object storage with lifecycle tiering, not a hot indexed store.

2. **The snapshot's access patterns are key-shaped, not query-shaped.**
   - *Webhook retry / reconstruction* — a point read by exact `{submissionId, submissionIndex}`.
   - *Future audit* — list the steps of one submission, **and** list the submissions of
     one form. Both are **prefix** reads, not arbitrary predicates.

   Neither needs a secondary index or ad-hoc query; both are satisfied by a deterministic
   object key. The `{formId, createdAt}` Mongo index ADR-0002 reserved for audit is not
   required — Mongo `ObjectId` is already time-ordered, and S3 returns keys in
   lexicographic (≈ chronological) order.

## Decision

Store each `submission_history` snapshot as a single immutable **S3 object**, not a Mongo
document. The snapshot **payload is unchanged** from ADR-0002 (`encryptedContent`,
`contentFormat`, optional `verifiedContent` / `attachmentMetadata`, plus `workflowStep`,
`formId`, `submissionId`, `submissionIndex`, `createdAt` carried in the object body). This
is the pattern FormSG already uses for attachments: encrypted blob in S3, the row carries
no copy.

### A dedicated bucket, not a prefix in an existing one

The snapshots live in their **own** S3 bucket (`SUBMISSION_HISTORY_S3_BUCKET`, wired like the
existing compulsory bucket vars — `IMAGE_S3_BUCKET`, `ATTACHMENT_S3_BUCKET`, …), not a prefix
inside the attachment bucket. FormSG already runs one bucket per data class; this extends that
pattern. The isolation is load-bearing, not cosmetic:

- **Distinct lifecycle.** Snapshots are write-once / read-rarely / long-retention. A dedicated
  bucket lets us tier them (Standard-IA, then Glacier for audit retention) without touching the
  attachment bucket's policy — this is where the database-size win is *converted* into a cheap
  store.
- **Distinct access surface.** A snapshot is a full form-key copy of a step's content. The
  attachment bucket has client-facing presigned-download flows; snapshots must be **server-read
  only** (webhook send, future audit). A separate bucket keeps that IAM boundary clean and the
  blast radius small.
- **WORM.** Audit-grade immutability (Object Lock) is a bucket-creation-time setting and is
  incompatible with a bucket that also holds deletable attachments. A dedicated bucket can be
  WORM; a shared one cannot.
- **Clean cost/request metrics** for the substrate.

Block all public access; encrypt at rest (SSE-S3, or SSE-KMS if per-key audit/rotation is
wanted — match the attachment bucket's choice). The application-layer form-key encryption is
the real confidentiality boundary; SSE is defense-in-depth.

### Object key layout (supports both audit axes + the point read)

```
{formId}/{submissionId}/{NNNNNN}/{format}.json   # NNNNNN = zero-padded submissionIndex; format = v1|v4
```

This follows the repo's existing attachment-key convention
(`submission.service.ts`: `uploadKey = formId + '/' + randomBytes(20) + '/' + sha256hash`,
i.e. `{formId}/{random}/{contentHash}`) — `formId`-first, `/`-delimited. Two principled
deviations: (1) attachments mint `randomBytes(20)` for uniqueness because they have no natural
id; we already have `submissionId` + monotonic `submissionIndex` as identity, and using them is
what makes the point-read deterministic. (2) attachments put the sha256 *in the key*
(content-addressing); we cannot (the key must be derivable for the point read), so we carry the
same integrity property by storing the content hash as object metadata
(`x-amz-checksum-sha256`) instead.

The bucket already namespaces the data, so the redundant `submission-history/` top-level prefix
is dropped. Rationale per segment:

- **`{formId}` first** — serves the per-form audit prefix scan (`ListObjectsV2` prefix
  `{formId}/`) and is a high-cardinality leading token (a 24-hex `ObjectId`), so S3's automatic
  prefix partitioning spreads load evenly with no hot partition. Also the natural per-form/agency
  IAM boundary if access is ever scoped.
- **`{submissionId}` second** — serves the per-submission audit prefix scan
  (`{formId}/{submissionId}/`) and groups a submission's steps together.
- **`{submissionIndex}` as the object name, raw (not zero-padded)** — the deterministic
  point-read key for the webhook retry, which is an exact-match `GET` and needs no ordering.
  We deliberately do **not** fixed-width pad. Padding would only buy lexicographic ordering for
  the audit `LIST` (without it `10.json` sorts before `2.json`), but it imposes a **hard step
  cap**: an index past the chosen width re-breaks the ordering it was meant to guarantee. Since a
  single submission has few steps, the audit reader instead lists the prefix and sorts in memory
  on the body's `submissionIndex` / `createdAt`. That yields ordered audit output with **no step
  limit**. The only thing forgone is index key-range (`StartAfter`) pagination, which the small
  per-submission set never needs. Note this is **not a global sort**: a per-form `LIST` already
  comes back in roughly submission-creation order because `submissionId` is a time-ordered
  `ObjectId` (the higher-order key segment), so the reader only sorts the handful of steps *within*
  each submission. Broad analytical queries (cross-submission strict time order, field filters,
  aggregation) are not an S3-`LIST` job at all — they belong to a future audit index and are out
  of scope here. (A very wide pad — e.g. 9 digits — would also work and keep
  listings pre-sorted, but it still has a cap; rejected for that reason.)
- **`{format}` (`v1`/`v4`) as the object name** — present **from slice 1**, even though only one
  format exists per form today. The send policy derives the wanted format from `webhookType`
  (plumber → `v4`), so it is **reader-known** and the retry `GET` builds the full key
  deterministically without listing. It is baked in now for the same reason as padding: the key
  is frozen at write time, and the flat `{NNNNNN}.json` → folder `{NNNNNN}/{format}.json` change
  is a *re-key migration* (the step leaf turns from a file into a folder). With the leaf present
  up front, a second format later is **purely additive** — a new `{NNNNNN}/v1.json` sibling, zero
  re-keying. `.json` body = the ADR-0002 fields.

A future audit *eventType* discriminator (deferred in ADR-0002) is **not** a new path segment —
adding one would split the per-form scan across prefixes. It becomes a field in the object body,
or a sibling bucket, when a non-step event actually exists.

`createdAt` stays in the object body for precise cross-submission ordering when prefix order is
insufficient.

### What may enter the key: reader-known, not object-discovered

A value belongs in the key iff the reader can reconstruct it **without** the object — because the
webhook point-read must build the key *before* it has the object. The line is reader-known vs
object-discovered, **not** identity vs descriptor:

- `formId`, `submissionId`, `submissionIndex` — on the queue message / live row → in the key.
- `format` (`v1`/`v4`) — **reader-known** (the send policy derives it from `webhookType`), so it is
  in the key. It is *also* kept in the body for self-description (redundant but cheap, and it makes
  each object independently interpretable). This is the one descriptor that is legitimately in the
  key, precisely because policy makes it reader-known.
- Envelope schema version `_v` — **object-discovered**: a reader cannot know it without reading the
  object, so it **stays in the body**. Evolution branches on the in-body `_v` (the same
  discriminator pattern the retry queue message uses, PRD M6); historical objects are never
  re-keyed. (Putting `_v` in the key would force re-keying every object on every bump.)
- `createdAt`, content checksum — object-discovered → body / object metadata.

No **date partition** (`YYYY/MM/DD/`) in the key either: a leading date would break the
`formId`-first per-form/per-submission scans, lifecycle tiering already keys off object age
automatically, and `createdAt` is in the body for ordering.

### Forward compatibility: multiple content formats per step

The `{format}` leaf is in the key **from slice 1**, where each step has one object
(`{NNNNNN}/v4.json` for plumber). If a step must later carry **both** a `v1` and a `v4` copy (e.g.
serving a generic and a privileged consumer from the same submission), it is **purely additive** —
write a second immutable object `{NNNNNN}/v1.json` alongside; nothing existing is re-keyed or
rewritten. One immutable object per `(step, format)`:

```
{formId}/{submissionId}/{NNNNNN}/{format}.json     # .../000003/v1.json, .../000003/v4.json
```

- **Retrieval is still a deterministic GET**: the send policy derives the desired `format` from
  `webhookType`, so the reader builds the full key without listing.
- **Preferred over one object holding both ciphertexts** (`encryptedContent: {v1, v4}`): separate
  objects keep each write **write-once** — a later format is a *new key*, never a rewrite of an
  existing object — which a both-in-one body would violate (it would need an overwrite/new version
  to add the second format, defeating Object Lock). Single-object-with-both is clean only if both
  formats are always produced atomically at submit and never backfilled.
- **Audit scans unchanged**: `.../{NNNNNN}/` lists a step's formats; `.../{submissionId}/` lists
  the submission.
- **Invariant**: the writer must produce *every* format the form's policy can request; a
  requested-but-absent format stays a fail-loud data-integrity error, never a silent
  cross-format fallback.

### Write semantics: versioning, not put-if-absent

S3-first ordering relies on a resubmitted step **overwriting** its orphan at the same key (same
`submissionIndex`). That rules out an `If-None-Match: *` put-if-absent write — it would reject
the healing overwrite. To get write-once immutability *and* keep the overwrite-heal, **enable
bucket versioning**:

- A resubmit writes a **new version** of the key; it does not destroy the orphan version, so it
  is WORM-compatible (Object Lock can pin every version).
- An unversioned `GET` returns the **latest** version — the real snapshot for a committed step.
- Orphan versions are never the latest for a real step, and the audit reconciliation rule
  (`submissionIndex < submittedSteps.length`) excludes abandoned ones. They are harmless.

Record an `x-amz-checksum-sha256` on PUT so tampering is detectable — cheap audit-integrity
insurance, and the analogue of the attachment key's in-key content hash.

**Plain overwrite (no versioning) is correctness-safe**, so versioning is an *audit*-grade
choice, not a functional one: once step *i* commits, `submittedSteps.length > i` and no future
step reuses index *i* (monotonic + append-only), so the only writes that ever collide on a key
are pre-commit retries of the same step, where last-write-wins *is* the heal. Forgoing
versioning therefore costs nothing on the webhook path; it costs, for the future audit consumer:
no Object Lock / WORM (immutability becomes convention-only, not provable), and no recovery from
a buggy or malicious overwrite/delete (no prior version to restore).

**The asymmetry that decides it now:** versioning, and especially Object Lock, are cheap to
enable **at bucket creation** and expensive to retrofit (Object Lock effectively cannot be turned
on after the fact). So the low-regret call is to **create the bucket with versioning enabled**
(Object Lock available, no default retention) even though the hot path operates by plain
overwrite — the door to audit-grade WORM stays open without a later bucket migration, at the cost
of one lifecycle rule to expire noncurrent (incl. orphan) versions.

### Persisted object schema

The S3 object body is the ADR-0002 snapshot fields, serialized as JSON, plus a `_v` schema
stamp. Validated with **zod** (the validator already used by the webhook module's queue-message
schema, `webhook.types.ts`), with the schema as the single source of truth and the TS types
inferred from it.

```jsonc
{
  "_v": 1,                       // schema version; readers branch on it (see "_v" note below)
  "formId": "<24-hex ObjectId>",
  "submissionId": "<24-hex ObjectId>",
  "submissionIndex": 3,          // raw integer, not zero-padded
  "workflowStep": 1,
  "encryptedContent": "<form-key ciphertext>",
  "contentFormat": "v4",         // equals the {contentFormat} key segment
  "verifiedContent": "<optional, form-key signed>",
  "attachmentMetadata": { "<fieldId>": "<s3 object key>" },  // optional; plain object, not Map
  "createdAt": "2026-06-17T08:30:00.000Z"                    // ISO 8601 string
}
```

Decisions baked into this shape:

- **`_v` is a body field, an integer literal** (`1` today). It is the discriminator for a zod
  discriminated union that grows as the shape evolves (`v1 | v2 | …`); old objects keep their
  `_v` forever and are never rewritten. Object-discovered, so never in the key.
- **IDs are strings, `createdAt` is an ISO string, `attachmentMetadata` is a plain object** —
  JSON has no `ObjectId` / `Date` / `Map`. (`Record<string,string>` matches the submission row's
  existing `attachmentMetadata` typing.)
- **Identity fields (`formId`/`submissionId`/`submissionIndex`) and `contentFormat` are kept in
  the body even though they are also in the key** — the object is self-describing for audit reads
  that hold the object but not the key. Invariant: body `contentFormat` equals the key's
  `{contentFormat}` segment.
- **Absent by design:** the webhook protocol `version` (derived at send from `contentFormat`), the
  wrapped submission secret key (gated, read from the live row at send), and the content checksum
  (carried as the S3 object's `x-amz-checksum-sha256` metadata, not in the body).
- **A single key-builder and a fail-loud parser** are the two shared helpers the writer and reader
  must go through, so the key cannot drift and a malformed object / unknown `_v` raises the same
  data-integrity error as a missing snapshot (never a silent fallback).

### Read consistency

S3 is strongly read-after-write consistent, so "make snapshot durable → enqueue →
retry reads it" is safe. The reconstruction contract from ADR-0002 is otherwise untouched:
a read **with** a `submissionIndex` requires the object to exist and **fails loud** if it
does not (a `NoSuchKey` is a data-integrity error, never a silent fallback to the live row);
a read **without** one keeps today's live-row path.

### Send ordering (locked)

`commit step txn → make snapshot durable → enqueue webhook`. The enqueue is **never**
inside the Mongo transaction (a queue is not a transaction participant); it runs only after
the step is committed and the snapshot is durable.

### Atomicity is an ordering property — S3-first

ADR-0002 wanted the snapshot to commit **in the same Mongo transaction** as the step. An
S3 object **cannot** join a Mongo transaction, so "the txn saves the submission_history" no
longer holds literally. The atomicity invariant — *a committed step always has its
snapshot* — is instead enforced by **ordering**:

```
PUT snapshot object → commit step txn → enqueue webhook
```

(**S3-first**.) A committed step is therefore guaranteed to already have its object, with no
Mongo-transaction change. The alternative, *commit-first* (`commit txn → PUT → enqueue`),
was rejected: a failed `PUT` would leave a committed step with **no** snapshot, breaking the
*guaranteed* webhook-retry path and tripping the fail-loud data-integrity error.

The cost of S3-first is an **orphan object** when the step txn aborts after the `PUT`. The
orphan is benign and self-healing for the webhook path:

- **Never read on the webhook path.** Read coordinates reach a consumer only via the
  enqueued message, and enqueue happens *after* commit — an aborted txn enqueues nothing.
- **Overwritten on resubmit.** An aborted txn rolls back the `submittedSteps` append, so a
  resubmission of that step computes the **same** `submissionIndex`, PUTs the **same** key,
  and replaces the orphan. An orphan survives only if the step is *abandoned*.

### Audit reconciliation rule (the row is the source of truth for *what happened*)

Because an abandoned-step orphan is a snapshot for an event the submission row never
recorded, an audit reader **must not trust an S3 prefix listing alone** — that would surface
a phantom step. The authoritative record of *what happened* is the live row; S3 stores only
*the payload of what happened*. Therefore:

> A snapshot at `submissionIndex i` is **real** only if `i < row.submittedSteps.length`.

Webhook reconstruction already enforces this implicitly (it slices `submittedSteps`); a
future audit consumer must apply it explicitly. An optional lifecycle/reaper for objects
with no backing committed step is a cost optimisation, not a correctness requirement (the
reconciliation rule already excludes orphans; orphan storage cost is negligible).

## Consequences

- **Mongo footprint drops** to the live submission rows only; the second content copy moves
  to cheaper, lifecycle-tierable object storage. This is the motivating win.
- **The reconstruction model is unchanged** — ADR-0002's row/snapshot split, byte-identical
  initial-vs-retry, `submissionIndex`-as-identity, and fail-loud-on-missing all still hold;
  only the snapshot's *physical store* changed.
- **Atomicity is now an ordering property, not a transaction property** — enforced by
  S3-first ordering; abandoned-step orphans are excluded by the audit reconciliation rule.
- **WORM available** — S3 Object Lock can make the audit trail provably immutable, which a
  Mongo collection cannot easily match.
- **No `submission_history` Mongo collection or model** is introduced; PR #9631's Mongo-doc
  implementation is replaced by the S3 writer/reader.

## Accepted non-issues

- **"Generic audit substrate" vs the write gate.** The slice-1 gate writes a snapshot only
  when the form has a webhook URL and retry is enabled, so non-webhook forms have no history
  document. This is accepted: the audit feature is **out of scope** and snapshots will be
  written **as needed when it is built**, not proactively. The substrate generalises by key
  layout; it does not need to be populated eagerly today.

## Alternatives considered

- **Keep the Mongo collection (ADR-0002 as written)** — rejected: it is the source of the
  database-size growth that motivated this ADR, for write-once/read-rarely data whose access
  is purely key-shaped.
- **Hybrid: Mongo pointer document + S3 blob** — rejected for now: it keeps a per-step Mongo
  document (so it only partly relieves database size) and reintroduces a dual-write to keep
  the pointer and blob consistent. Revisit only if an audit query needs richer predicates
  than prefix listing.
