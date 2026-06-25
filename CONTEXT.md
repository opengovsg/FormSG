# Context

Glossary of canonical terms used in FormSG. Update inline as terms crystallise — this is a glossary, not a spec.

## Form types

- **Form** — the top-level document. Stored in the `forms` collection with Mongoose discriminator key `responseMode`.
- **`responseMode`** — the discriminator field that distinguishes between form types. Canonical values: `email`, `encrypt`, `multirespondent`. Casual references to "formType" mean this field.
- **Storage mode form** — a form with `responseMode: encrypt`. Responses are end-to-end encrypted using the form's `publicKey`.
- **MRF / Multi-Respondent Form** — a form with `responseMode: multirespondent`. Supports a `workflow` of sequenced respondent steps. Encrypted like Storage mode (also uses `publicKey`).
- **Email mode form** — a form with `responseMode: email`. Responses emailed to admins.

## Conversion

- **Storage-to-MRF conversion** — a one-way transformation of a Storage form into an MRF. The form's `responseMode` is mutated from `encrypt` to `multirespondent`, encrypt-only fields are dropped, MRF-required fields are populated, and a history entry is appended to `form.metadata`. The original form is **not** recoverable post-conversion.
