# 2. MyInfo Children v2: sponsored support via a unified identifier + record type

Date: 2026-06-28

## Status

Accepted

## Context

MyInfo returns a respondent's children in two separate scopes:

- `childrenbirthrecords` — **local** registered birth records, identified by
  `birthcertno`.
- `sponsoredchildrenrecords` — **sponsored** children (typically born
  overseas), identified by `nric`, plus immigration fields (`residentialstatus`,
  `nationality`, `scprgrantdate`, `birthcountry`).

Today FormSG only reads `childrenbirthrecords`, so sponsored children never
appear — the headline gap for ~5–20% of parents (PRD slice 03). The two record
types share the common sub-fields v2 surfaces (name, sex, race, dob, vaxx) but
differ in their identifier and carry different extra fields.

## Decision

1. **Merge both scopes into one children list**, local records first then
   sponsored, in `MyInfoData.getChildrenBirthRecords`.
2. **Unified identifier = the existing `childbirthcertno` sub-field.** For a
   sponsored record it is populated from `nric`; for a local record from
   `birthcertno`. No new sub-field/attribute is introduced — the existing
   identifier slot resolves to whichever applies. (The field label may later
   read "Birth certificate no. / NRIC"; copy-only, deferred with the picker.)
3. **Record type** is exposed as a parallel `type` array on `MyInfoChildData`
   (`'nuclear'` | `'sponsored'`, see `ChildRecordType`), and threaded into
   `ChildEntryV4.type` on submission (the v4 slot already exists). It surfaces
   as its own response/CSV column.
4. **Sponsored-only immigration fields are not surfaced** in v2.0
   (`nationality`, `residentialstatus`, `scprgrantdate`, `birthcountry`) — they
   are simply never mapped into `MyInfoChildData`.

## Consequences

**Positive**

- Sponsored children appear alongside local ones with no empty-mandatory error
  (the identifier is always populated). Reuses the existing sub-field plumbing.
- `type` rides the answerObject v4 slot that already existed, so it flips on
  with storage-mode v4 like the rest of v2.

**Negative / watch-outs / deferred**

- **Scope request gating**: MyInfo must be asked for the
  `sponsoredchildrenrecords` scope, and only for v2 (version-2) fields — legacy
  forms must not start fetching sponsored data. Wiring this into the
  redirect-URL scope builder with version awareness is follow-up plumbing; the
  adapter merge itself is version-agnostic (it merges whatever scopes returned).
- **Dedup by identifier (FE picker)**: the picker must key on the unified
  identifier (not name) so same-named children — and a local + sponsored record
  for the same child — are distinguishable and de-duplicated. This is the
  respondent-side rework deferred from slice 02; it lands with the picker visual
  cycle.
- **Type column rendering** in the individual response view + CSV depends on the
  storage-mode v4 rollout (deferred, ADR-0001) to actually persist
  `ChildEntryV4.type`.
