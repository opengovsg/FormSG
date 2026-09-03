# FormSG

FormSG lets government agencies build and publish forms. This glossary currently covers the form-creation domain, starting with the "form origin" question asked when a form is created.

## Language

**Process**:
The underlying business activity or data-collection need a form serves (e.g. "processing leave applications"), independent of the medium used to run it.
_Avoid_: using "process" to mean the medium/format itself (e.g. "digital process" vs "paper process") — this is the exact confusion the origin question exists to resolve.

**Existing process**:
A **Process** for which the admin's agency was already collecting this data in some medium before creating this form (paper, email, spreadsheet, an online form such as FormSG or another form builder, etc).

**New process**:
A **Process** for which the admin's agency was not collecting this data in any medium before creating this form.

**Form origin**:
The record, on a form's metadata, of what **Process** and (if existing) what prior collection medium a form's data collection descends from. Stored as `metadata.formOrigins`.
_Avoid_: conflating this with the collection medium alone — origin captures both the process-newness answer and the medium.

## Flagged ambiguities

- "process" was observed being interpreted by admins as the medium/format ("this is a new *digital* process") rather than the underlying activity — resolved: **Process** is activity-based, not medium-based. See v2.0 research observations.
