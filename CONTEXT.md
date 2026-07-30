# FormSG

FormSG lets Singapore government agencies build forms and collect responses from the public. This context covers the form-building and response-collection domain, currently focused on bringing payments to multi-respondent forms.

## Language

**Encrypt-mode form**:
A form whose responses are end-to-end encrypted and submitted once by a single respondent.
_Avoid_: storage-mode form

**Multi-respondent form (MRF)**:
A form whose submission may pass through an ordered series of respondents before it is complete.
_Avoid_: multirespondent workflow (the workflow is a property of the form, not a synonym for it)

**Workflow step**:
One position in an MRF's ordered series of respondents, defining who responds at that position and which fields they can edit.

**Zero-step MRF**:
An MRF whose workflow has no steps, so a single respondent's submission completes it.

**Payment-enabled form**:
A form whose payment field is switched on, so respondents are charged on submission.
_Avoid_: payment form (ambiguous — could mean merely Stripe-connected)

**Stripe-connected form**:
A form linked to an agency's Stripe account; inert until the form becomes payment-enabled.

**Variable payment**:
A payment whose amount the respondent enters themselves, within configured bounds.

**Products payment**:
A payment whose amount is derived from an itemised list of products/services the respondent selects.
_Avoid_: itemised payment

**Fixed payment** (deprecated):
A payment with an admin-set amount; legacy encrypt-mode forms only — not offered on new surfaces, including MRF.

**Pending submission**:
A submission held out of the admin's responses until its payment succeeds; promoted to a real submission on payment confirmation.
_Avoid_: draft submission, incomplete submission

**Step token**:
The secret that authorises writing the next workflow step of an MRF submission; nobody receives one for a zero-step MRF, so its submissions are immutable once created.

**Admin notification emails**:
The agency addresses notified when a response arrives; configured per form by the admin.
_Avoid_: confirmation emails (ambiguous — see Payment receipt email)

**Payment receipt email**:
The email the payer receives from the payments machinery when their payment succeeds; not configurable per form.
_Avoid_: confirmation email

## Relationships

- An **MRF** has zero or more **Workflow steps**
- A **Zero-step MRF** may be a **Payment-enabled form**; an MRF with one or more **Workflow steps** may not (bidirectional: enabling payments is blocked while steps exist, and adding a step is blocked while payments are enabled)
- Any MRF may be a **Stripe-connected form** regardless of workflow steps; the workflow-step gate binds only on becoming **Payment-enabled**
- A **Payment-enabled** MRF sends no form-configured emails at all — no **Admin notification emails** and no submitter response-received notification — and has no single-submission enforcement; the **Payment receipt email** is the only email sent (on encrypt-mode forms this restriction arms on mere Stripe connection; on MRF it arms only on becoming Payment-enabled)
- A **Payment-enabled form**'s submission starts as a **Pending submission** and becomes a real submission only when its payment succeeds — on encrypt-mode forms and zero-step MRFs alike
- A **Payment-enabled** Zero-step MRF supports **Variable payments** and **Products payments** only

## Example dialogue

> **Dev:** "Can I add a **Workflow step** to a **Payment-enabled** MRF?"
> **Domain expert:** "No — and the reverse is also blocked. You must remove the payment before adding a step, or remove all steps before enabling payments."

> **Dev:** "A respondent submitted a **Payment-enabled** form but abandoned the payment — does the admin get notified?"
> **Domain expert:** "No. It exists only as a **Pending submission**; nothing observable happens until the payment succeeds."

## Flagged ambiguities

- **Fixed payment** is deprecated per the team, but `PaymentType.Fixed` carries no `@deprecated` marker in `packages/shared/types/payment.ts` — the code does not yet record this.
- "confirmation emails" was used to mean both **Admin notification emails** and the **Payment receipt email** — resolved: these are distinct; payment forms block the former and always send the latter.
