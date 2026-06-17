# Context Glossary

Canonical terms for the FormSG domain. Glossary only — no implementation details.

## Submission encryption

- **Form keypair** — the asymmetric keypair for a form. The **form public key** is held by FormSG to encrypt; the **form secret key** is held only by the form admin (and their integrations, e.g. a webhook consumer) to decrypt. FormSG never stores the form secret key.

- **Submission secret key** — a *per-submission* secret key, freshly generated for every submission (and re-generated on every workflow step). The raw form of this key can decrypt that submission's `encryptedContent`. It is NOT the form secret key.

- **encryptedSubmissionSecretKey** — the submission secret key wrapped with the **form public key**. Recovering the raw submission secret key from it requires the **form secret key**. Stored per submission row.

- **encryptedContent** — the submission responses, encrypted with the *submission* public key (for v3/MRF). Decryptable only with the raw submission secret key — NOT directly with the form secret key (this differs from v2 storage-mode forms, where the form secret key decrypts content directly).

## Multirespondent form (MRF)

- **MRF submission** — a *single* database row that is **updated in place** at each workflow step (not a new row per step). At each step the full accumulated content is re-decrypted (using the previous step's submission secret key) and re-encrypted under a **new** submission keypair, so `submissionPublicKey` / `encryptedSubmissionSecretKey` / `encryptedContent` are replaced each step.

- **Workflow step** — one stage of an MRF. The next respondent is sent an edit URL containing the raw submission secret key as a `?key=` query parameter. Possessing that key (plus the submissionId) is what lets the next step be decrypted and submitted; the next-step PUT route has no auth guard beyond rate limiting (step-specific SingPass/MyInfo auth, if any, is enforced inside the controller by the step's authType).

- **mrfVersion** — `1` = v3-encrypted responses; `2` = v4-encrypted responses (answer objects with provenance). Decrypted v4 content is shaped differently from v1 `FormField[]`; `adaptV4ToV1` converts it.

## Webhooks

- **Webhook view** — the payload POSTed to a form's configured webhook URL. Fires once per step. For MRF the content, verified content, and attachments shipped are **form-key copies**: copies encrypted directly to the **form public key** (storage-mode style), so a consumer reads everything with the **form secret key** it already holds — never the submission secret key. The form-key copies are the universal read path, produced unconditionally on the V4 path for every consumer. For MRF (V4 path) the view is **reconstructed at send time** from the live submission row plus the step's **submission history** document, so initial sends and retries are byte-identical and a retry re-delivers the step that failed (see ADR-0002).

- **Submission history** — an append-only store holding one immutable **submission snapshot** per MRF step submission. Each snapshot stores only the irreproducible per-step bits (the form-key `encryptedContent` + its `contentFormat`, and optional `verifiedContent` / `attachmentMetadata`); everything stable or reconstructible (formId, created, workflow, `submittedSteps` prefix, payment) is read from the live submission row. Snapshots are persisted as **S3 objects** in a dedicated bucket, keyed `{formId}/{submissionId}/{submissionIndex}/{format}.json` (raw index, not zero-padded, so there is no step-count cap; audit listings sort in the reader) (format = `v1`|`v4`, in the key from slice 1 so a second format is purely additive; not a Mongo collection — see ADR-0003), which serves the point read (webhook retry) and both audit prefix scans (per-submission, per-form). A generic substrate intended to also serve audit logs; webhook payload reconstruction is its first consumer.

- **submissionIndex** — the zero-based position of a step submission in the order submitted (its index in `submittedSteps`). Strictly monotonic, so it uniquely identifies a snapshot even when a workflow **loops back** and `workflowStep` repeats. It is the snapshot's identity (`{submissionId, submissionIndex}` is unique), the bound for reconstructing `submittedSteps` (`submittedSteps.slice(0, submissionIndex + 1)`, valid because `submittedSteps` is append-only), and the pointer the webhook retry queue message carries to resolve the right snapshot.

- **contentFormat** — the shape of a submission snapshot's `encryptedContent`: `'v4'` (native answer objects, no translation) or `'v1'` (translated to the classic `FormField[]` storage-mode shape via `flattenV4ToFormFields`). Decided at submit time by consumer policy (privileged → `'v4'`, generic → `'v1'`). The webhook *protocol* `version` is **derived** from it at send (`'v4' → 3`, `'v1' → 2.1`); the protocol number is not stored in the generic collection.

- **Webhook type** — a classification of a form's webhook URL: `plumber` (matches `https://plumber.gov.sg/webhooks/`), `zapier`, or `generic`. Derived by `getWebhookType`. It is the single source from which the webhook payload policy is derived; no other code branches on the URL.

- **Privileged webhook consumer** — a consumer privilege class (today derived from `getWebhookType === 'plumber'`, designed so more consumers can join later). It governs two things: the snapshot's `contentFormat` (privileged → `'v4'` native shape; unprivileged → `'v1'` `FormField[]` shape), and whether the wrapped submission secret key is *additively* attached to the payload. The submission-secret-key inclusion is **decided at send time, not persisted**: it is attached only when the consumer is privileged **and** the snapshot is the current latest step (`submissionIndex === submittedSteps.length - 1`), because the key is invalidated once the next step is submitted. It is never required to read; its sole purpose is to let a whitelisted client construct the next-step workflow submission link (advance the workflow). Plumber is the first member, not a special case. An unprivileged consumer reads the V1 form-key copy and never receives a write credential.

- **MRF webhook enablement** — MRF webhooks fire **only** when the submission was V4-encrypted (a webhook form goes V4 when `answer-object-encryption` **and** `enable-mrf-webhooks` are both on), **with one exception**: a `plumber` consumer continues to receive its existing V3 webhook today even before V4 is enabled. Equivalently: `mrfVersion === 2 || webhookType === 'plumber'`. A generic consumer receives nothing until the form is V4.
