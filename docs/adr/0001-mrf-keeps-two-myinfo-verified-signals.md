# MRF keeps two Myinfo verified-ness signals

An MRF submission records which answers were verified against Myinfo (or the Singpass/Corppass login) in two places: `myInfoReadOnlyFields`, a plaintext field-id list on the submission document, and `provenance.myinfoVerified`, a per-response stamp living inside the encrypted V4 content. We considered consolidating on provenance and decided to keep both.

Provenance cannot serve the read-time surfaces: the backend prefixes `form_fields` titles for the individual response view, the CSV download stream, and the V1 webhook copy without ever being able to decrypt stored content, so it must read the plaintext list. Consolidation also cannot be completed retroactively — provenance sits inside `encryptedContent`, which the server cannot decrypt, so historical submissions can never be backfilled and every reader would need a permanent `myInfoReadOnlyFields` fallback anyway. The "consolidated" end state would therefore carry more code than the status quo, or silently drop `[Myinfo]` markers from past submissions.

The two signals are derived from the same verification results (`checkMyInfoHashes` / `checkLoginIdentityAnswers`) in the same middleware pass, so they cannot disagree in practice. Which surfaces read which:

- `myInfoReadOnlyFields` → DTO/stream `form_fields` title prefixing (individual response view, CSV export) and the V1 webhook copy. Survives workflow steps by never being touched on update.
- `provenance.myinfoVerified` → email/PDF question-answer pairs and the V4 payload consumers see. Survives workflow steps only via the non-editable-field carry-forward in the update middleware, because `encryptedContent` is replaced wholesale each step.

Do not "clean this up" by deleting either signal.
