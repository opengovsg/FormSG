# Paper Forms Tracking

How FormSG records whether a form replaced a paper (or other non-digital) process, and whether that form has become live, so the team can measure paper-to-digital conversion impact without manual stocktakes.

## Language

**Form Origin**:
The source(s) a form replaced, captured once during form creation. A form can have **one or more** origins (multi-select), each being paper or a specific digital medium.
_Avoid_: source, form type, `isFormOrigin` (misleading `is` prefix for a non-boolean).

**Paper form**:
A form whose **Form Origins** include paper — i.e. the admin indicated the process was (at least partly) on paper before FormSG. A paper form may *also* carry digital origins.
_Avoid_: physical form.

**Digital origin**:
A **Form Origin** that is not paper (new process, email, document, spreadsheet, other form builder, or other). In-house/vendor systems are intentionally not a separate option — admins are expected to capture them under "other".

**Liveliness**:
Whether a form is considered actively in use, derived automatically from submission volume rather than self-reported by the admin.
_Avoid_: active, published (publishing is a separate, admin-driven status).

## Relationships

- Every form created while paper tracking is enabled has **one or more Form Origins**, captured once (at set-up, or at publish in the publish-step experiment).
- **Paper** and **Digital** origins are **not** mutually exclusive — a single form can be tagged with both (e.g. paper + spreadsheet).
- **Liveliness** is independent of **Form Origin** — any form can become live; the team cares most about live **Paper forms**.

## Example dialogue

> **Dev:** "If the admin ticks both 'Paper form' and 'Spreadsheets', what's the **Form Origin**?"
> **PM:** "Both — it's multi-select. The form is a **Paper form** *and* carries a spreadsheet **Digital origin**. We count it as paper for conversion, and the spreadsheet tag lets us break impact down by medium."
> **Dev:** "And does choosing an origin make the form live?"
> **PM:** "No — **Liveliness** is separate. A form only counts as live once it crosses the submission threshold, regardless of origin."

## Flagged ambiguities

- **Storage location** — decided: **Form Origins** are stored in the form's `metadata` (as an array of origin entries), not as a top-level field. The team accepts the weaker query ergonomics (dashboards do array intersections) in exchange for not extending the core schema.
- **"Other" free text** — decided: embedded in its own `formOrigins` entry as `digital-others: <detail>`, following the platform's checkbox-Others convention ("Others: <text>"), instead of a companion field. Accepted trade-off: dashboards count "Other" selections by prefix match.
- **Mutual exclusivity** — earlier modelled as a single exclusive value; corrected to **multi-select**: paper and digital origins can co-exist on one form.
- **Duplication & templates** — decided (revised): **Form Origins** are never copied from a source form; **both** the "use template" and the duplicate flow **re-ask** the origin question and write the freshly captured origins to the new form's metadata. (Earlier the duplicate flow was deliberately left un-asked and carried no origins — overturned: a duplicate is a new form and should report its own origin.) Both flows reuse the shared origin step, gated by the same `enablePaperTrackingSetUpPage` flag.
- **Coupling to MRF cutover** — decided: the origin set-up step is gated by `enablePaperTrackingSetUpPage` **alone**, independent of `mrfCutover`. Decoupled so the page can roll out before cutover completes (cutover may slip), targeted by admin email domain via GrowthBook. Consequence: the origin step now fronts **both** storage- and multirespondent-mode creates, not just the post-cutover MRF flow.
- **Storage-mode capture** — decided: origins are captured for storage-mode (one-respondent) creates too, not only MRF. The backend `createForm` path already persists `metadata.formOrigins` for storage forms (part-1 widened the DTO), so this is frontend-only.
- **Escape-hatch gap** — known/accepted: post-cutover, the storage-mode *escape hatch* (`StorageModeDetails`) creates directly and bypasses the origin step, so those forms carry no origins. Pre-existing in the shipped flow; not closed in Part 2.
- **Email mode** — n/a: email-mode creation is no longer reachable in the create modal, so the origin step needs no email special-casing.

---

# MRF Workflow

How a Multi-Respondent Form (MRF) routes a single submission through an ordered sequence of respondents, each editing or approving a defined set of fields, until the submission is complete.

## Language

**Workflow**:
The ordered sequence of steps an MRF submission passes through. A form may have **zero** steps (no routing) or many. It is positional — a step's position *is* its number.
_Avoid_: "process", "flow" (overloaded with conditional-logic routing within a single page).

**Workflow step**:
One stage of the workflow. Identifies its **respondent** (a fixed email, an email read from a form field, or an email chosen by a dropdown mapping), the **field assignments** it may edit, an optional **approval field**, and an optional name.

**Step 1 / First step**:
The initial respondent — the person who opens the form link and starts the submission. It is special: it may **not** be an approval step, it is the **only** step allowed to edit MyInfo fields, and it sources the **respondent-copy email**. Position-based: whichever step sits at the front is "step 1".
_Avoid_: "the creator", "the owner" (the first respondent is whoever fills the form, not the admin).

**Step promotion**:
When step 1 is deleted while later steps remain, the next step slides forward to **become** the new step 1 and inherits step-1 rules. Deleting a step is the only way steps renumber.

**Empty workflow**:
A valid end-state with zero steps, reachable by deleting the last (step 1) step. The form still works: the first (only) respondent may edit **all** fields and submit — no routing, no approvers. Used when an admin trialled a workflow and decided they don't need one.
_Avoid_: "deleted form", "disabled workflow" — the form is unchanged; only its routing is gone.

**Field assignment**:
The set of fields a step's respondent may edit (its "edit set"). Deleting a step **drops** its assignments — those fields become editable in no step (locked/uncollected) until the admin re-assigns them. Assignments are never auto-migrated between steps.

**Respondent-copy email**:
The email field, collected in step 1, used to send the first respondent a copy of their submission (`stepOneEmailNotificationFieldId`). Cleared automatically if step-1 deletion leaves no step collecting that field.

## Relationships

- A **workflow** is an ordered list of **workflow steps**; **step 1** is simply the step at position 0.
- Submissions store a **snapshot** of the workflow at creation, so editing or emptying a form's workflow never disturbs in-progress submissions — only new ones.
- **Step promotion** is the only renumbering event; appending a new step never reorders existing ones.
- An **empty workflow** is independent of form status — a public form may have its workflow emptied; the change applies to new responses immediately.

## Flagged ambiguities

- **"Delete step 1" intent** — decided: serves **both** "fully remove an accidentally-created workflow" (delete down to empty) and "delete a wrongly-configured first step, keep the rest" (promote step 2). Not a mode switch — the form stays in Multirespondent mode.
- **Empty-workflow validity** — decided: an MRF form with zero steps is **valid and publishable**, behaving like a one-respondent form. Matches existing code (first respondent edits all fields); no publish-time guard added.
- **Promotion auto-fix** — decided: promoting a step to step 1 auto-strips its **approval field**, clears the **respondent-copy email** if the field is no longer collected, and prunes the deleted step from notifications — all surfaced in the delete-confirmation modal. Field/MyInfo assignments are deliberately **not** auto-migrated (admin re-assigns).
- **Live-form editing** — decided: step-1 deletion is allowed while the form is public, consistent with existing workflow edits. Blocking the builder for published forms is deferred, not part of this work.
- **Backend already permits it** — known: the `DELETE /workflow/:stepNumber` endpoint already deletes any step (including step 1) and already allows an empty workflow; the only block today is the frontend hiding step 1's delete button. This work adds the auto-fix semantics and unhides the button.

---

# MyInfo Children

How FormSG prefills a respondent's children's birth records from MyInfo into a single compound field, and how v2 widens that to sponsored children while moving storage to the answerObject v4 shape.

## Language

**Children field**:
The compound `BasicField.Children` field that prefills children's birth records from MyInfo. One field configures a set of **child sub-fields** and produces, per child, a value for each. It is whitelist-gated and Encrypt-mode only.
_Avoid_: "children_v2" as a field type — v2 is a **version** of this field, not a new type (see ADR-0001). `children_v2` is only the project/branch name.

**Children version**:
A discriminator on the **Children field** selecting its behaviour. **Version 1** (legacy) stores responses in the exploded v3 shape, offers Secondary Race + Allow-Multiple, and numbers children (`[MyInfo] Child 1 …`). **Version 2** stores the **answerObject v4** shape, is single-child, drops Secondary Race + Allow-Multiple, carries a new description, dedups by the **unified identifier**, and stamps each child's **record type**.
_Avoid_: "new field type", "children_v2 field".

**Child sub-field**:
One MyInfo attribute collected per child (e.g. `childname`, `childdateofbirth`, `childgender`, `childvaxxstatus`). Version 2 exposes the common-denominator set plus the **unified identifier** and omits Secondary Race.

**Local registered birth record**:
A child whose birth is registered in Singapore (born here, or re-registered after a Singapore court adoption order). Identified by `birthcertno`. Re-registered adopted children appear here, **not** as sponsored.
_Avoid_: "nuclear child" in prose — though `nuclear` is the stored **record type** value for these (see below).

**Sponsored child record**:
A child born overseas and sponsored by the parents. Identified by `nric` (not a birth certificate number). Not returned by today's field — the headline v2 gap (PRD slice 03).

**Unified identifier**:
The single sub-field that resolves to `birthcertno` for a **local registered birth record** or `nric` for a **sponsored child record**, so both kinds appear and validate without an empty-mandatory error. The picker dedups by this, **not** by name.
_Avoid_: deduping by child name (the legacy behaviour).

**Record type**:
The per-child attribute (`nuclear` for local, `sponsored`) stamped onto each answer and surfaced as its own output column. Stored as `ChildEntryV4.type`.

**answerObject v4**:
The nested, normalised submission shape (`packages/sdk/types-v4.ts`) replacing the legacy exploded responses. For children: field → `answer` → `child0` → `value` → `{ sub-field: { value, myInfo } }`, plus `type`. No `child-1/child-2` numbering. Version-2 Children fields write this; version 1 stays exploded.

## Relationships

- A **Children field** is either version 1 or version 2; **version 2** is whitelist-gated and writes **answerObject v4**, version 1 writes exploded v3.
- Each child carries exactly one **unified identifier** and one **record type**; the picker dedups by the identifier.
- **Local registered birth record** ↔ `nuclear` / `birthcertno`; **sponsored child record** ↔ `sponsored` / `nric`.
- Migration bumps an existing whitelisted form's Children field from version 1 to version 2 **in place**, preserving the field `_id`.

## Flagged ambiguities

- **v2 representation** — decided (ADR-0001): a **version discriminator on the existing `children` field**, not a new `BasicField`. The PRD's "after" JSON (`fieldType: "children"`) reflects this; the PRD prose / early README calling it a "new field type" is superseded.
- **Legacy responses** — decided: version-1 (exploded) responses remain **decrypt-only** and must keep rendering after v2 ships (PRD slice 05); no server-side mutation of past encrypted responses.
- **Edge cases (provisional, gated by PRD slice 01)** — deceased (`lifestatus = DECEASED`) and ≥21 children are filtered out of the picker by default; if Singpass compliance forbids hiding, switch to shown-disabled. An empty sub-field renders blank and never blocks submission.
- **Sponsored-only fields** — decided: v2.0 surfaces only the common-denominator sub-fields + unified identifier + record type. Sponsored-only immigration fields (`nationality`, `residentialstatus`, `scprgrantdate`, `birthcountry`) are **not** exposed.
- **Provenance / verified-vs-unverified** — out of scope: a separate platform PRD across all MyInfo fields. Children v2 consumes the answerObject slot; does not block on it.
