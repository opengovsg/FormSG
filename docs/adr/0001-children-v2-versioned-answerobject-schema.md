# 1. MyInfo Children v2 ships as a versioned answerObject schema, not a new field type

Date: 2026-06-27

## Status

Accepted

## Context

MyInfo Children is a compound `BasicField.Children` field that prefills a
respondent's children's birth records from MyInfo. It has been in whitelisted
beta since 2023 and is used heavily (MOE MK registration, SG60 Baby Gift). The
v2 effort (see PRD *MyInfo Children v2*) addresses three gaps:

1. **Sponsored children** are not returned, so a meaningful slice of parents
   cannot find their child.
2. The response is stored in the **legacy "exploded" shape** — one response per
   child-subfield, keyed `childrenbirthrecords.<fieldId>.<subfield>.<childIdx>`,
   with `[MyInfo] Child 1 …` numbering baked into the question text. This does
   not fit Multi-Respondent Forms / unified modes, which are moving to the
   **answerObject v4** shape.
3. Two underused options (Secondary Race, Allow-Multiple) cause friction and an
   empty-mandatory-field error.

The platform already has answerObject v4 infrastructure in `packages/sdk`
(`types-v4.ts`, `adapt-v3-to-v4.ts`, `adapt-v4-to-v3.ts`), currently wired only
for MRF-without-webhook submissions. Crucially, the v4 children answer type
(`ChildrenFieldResponseV4`) is **already keyed to `fieldType: 'children'`**, and
`ChildEntryV4` already carries an optional `type` attribute (for
`nuclear`/`sponsored`).

The open question (flagged in the PRD): ship v2 as a **new `BasicField`
(`children_v2`)**, or as a **versioned schema on the existing `children`
field**?

## Decision

Ship v2 as a **versioned schema on the existing `BasicField.Children` field**.
The field type string stays `'children'`. A `version` discriminator on the
children field selects behaviour:

- **version 1 (legacy, default):** exploded v3 storage, Secondary Race and
  Allow-Multiple available, `[MyInfo] Child N …` numbering. Unchanged.
- **version 2:** answerObject v4 storage (`ChildrenAnswerV4`), single child per
  field, no Secondary Race, no Allow-Multiple, new field description, picker
  deduped by the unified identifier, per-child `type`. Whitelist-gated.

A children field's `version` is set once when created/configured by a
whitelisted admin, and stamped onto existing whitelisted forms' fields during
migration (preserving the field `_id`).

## Consequences

**Positive**

- The v4 `ChildrenFieldResponseV4` type already uses `'children'`, so no
  `FieldType` union change and no second code path in the v4 encrypt/decrypt
  plumbing.
- Reuses the existing builder (`EditMyInfoChildren`) and respondent
  (`ChildrenCompoundField`) components via version branching, rather than
  duplicating them as `…V2` siblings.
- Migration (PRD slice 06) is an in-place `version` bump that preserves field
  `_id`, so logic / webhook / CSV references survive.

**Negative / watch-outs**

- "Legacy frozen / decrypt-only" (PRD slice 05) is a *behaviour of version 1*
  rather than a separate type. Care is needed so version-1 responses keep
  decrypting after version 2 ships — covered by regression tests.
- Two behaviours now live in one field type and one set of components; the
  `version` branch must be explicit and well-tested to avoid leaking v2 rules
  (e.g. dropping Secondary Race) into version-1 forms.
- The PRD prose and the issues README originally described a *new field type*
  `children_v2`. That framing is superseded by this ADR; the README has been
  corrected. The `children_v2` label survives only as the **project/branch
  name**, not a `BasicField` value.

## Notes

This supersedes the placeholder filename `0001-children-v2-new-field-type.md`
referenced in early drafts of the issues README — the decision recorded here is
the opposite of "new field type".
