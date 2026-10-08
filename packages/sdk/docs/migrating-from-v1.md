# Migrating from V1 to V4 webhooks

This guide is for teams that receive FormSG webhooks with `formsg.crypto.decrypt` today. It explains what V4 gives you, what changes in your code, and how to switch without losing a submission.

Your authentication code does not change. Your endpoint URL, the `X-FormSG-Signature` header, and `formsg.webhooks.authenticate` all stay the same. The work is in how you decrypt and read the answers.

## Contents

- [What you gain](#what-you-gain)
- [What changes at a glance](#what-changes-at-a-glance)
- [Choose your migration path](#choose-your-migration-path)
- [Migrate step by step](#migrate-step-by-step)
- [Translate each field type](#translate-each-field-type)
- [Gotchas](#gotchas)
- [Questions](#questions)

## What you gain

### Webhooks for multi-step workflows

V1 works only on forms with at most one workflow step. If you turn on **Use legacy webhooks**, FormSG blocks you from adding a second step.

V4 removes that limit. FormSG sends a webhook after every step, so your system can act when a supervisor approves, when a second respondent fills in their part, or when the workflow finishes. Each delivery tells you which step just finished, who was asked to fill in the next step, and how each approval step was decided.

### Look up answers by ID, not by position

V1 gives you an array, so you search it for the field you want:

```javascript
// V1
const name = submission.responses.find((r) => r._id === NAME_FIELD)?.answer
```

V4 gives you an object keyed by field ID:

```javascript
// V4
const name = submission.responses[NAME_FIELD]?.answer.value
```

### Structured answers, no string parsing

V1 packs structured answers into strings and positional arrays. V4 keeps their structure.

| You want                              | V1                                                                  | V4                                        |
| ------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| The postal code                       | `answerArray[5]`, and you must remember the order                   | `answer.postalCode.value`                 |
| Whether a radio answer was **Others** | Check whether `answer` starts with `"Others: "`, then strip it      | `answer.isOthersInput`                    |
| A date                                | Parse `"09 Sep 2026"`                                               | Parse `"09/09/2026"`, always `dd/MM/yyyy` |
| A table cell                          | `answerArray[row][col]`, with column names inside the question text | `answer[rowId].value[columnId]`           |
| A drawn signature                     | `JSON.parse(answerArray[1])`                                        | `answer.value`, already an array          |

### One key per submission

In V4, every submission has its own encryption key. `decrypt` returns it as `submissionSecretKey`. You can give that key to another system so it can read one submission, without giving it the form secret key that unlocks every submission.

### One format across FormSG

V4 is the format that Plumber receives, and the format in which FormSG stores multi-respondent submissions. V1 is produced by converting V4 at send time.

## What changes at a glance

|                                         | V1                                     | V4                                                              |
| --------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| SDK version                             | Any                                    | **8.2.0 or later**                                              |
| Decrypt with                            | `formsg.crypto`                        | `formsg.cryptoV4`                                               |
| `data.version`                          | `2.1`                                  | `4`                                                             |
| `responses`                             | Array, in form order                   | Object keyed by field ID                                        |
| Each answer                             | `answer` string or `answerArray`       | `answer` object, shape depends on `fieldType`                   |
| Unanswered fields                       | Present, with `""` or `[]`             | Absent                                                          |
| Sections, statements, images            | Sections present with `isHeader: true` | Absent                                                          |
| Whitespace                              | Trimmed                                | As typed                                                        |
| Myinfo questions                        | Start with `[Myinfo] `                 | No prefix. Use `response.myInfo`.                               |
| Keys in `verified`                      | `uinFin`                               | `uinFin (Step 1)`                                               |
| Webhooks per submission                 | One                                    | One per workflow step                                           |
| Attachment encryption                   | Form key                               | Submission key                                                  |
| New payload keys                        |                                        | `encryptedSubmissionSecretKey`, `formFields`, `workflowContent` |
| Signature header, retries, IP addresses |                                        | Unchanged                                                       |

## Choose your migration path

Your path depends on which kind of form you have.

**If your form has a Use legacy webhooks toggle** in **Settings > Webhooks**, you switch the same form to V4. The form ID, secret key, field IDs, and endpoint stay the same. Follow [Migrate step by step](#migrate-step-by-step).

**If your form is a Storage mode form from an earlier version of FormSG**, it always sends V1 and has no toggle. FormSG shows this message in **Settings > Webhooks**: "This form uses legacy webhooks." To move to V4:

1. Duplicate the form to the latest version of FormSG, using the link in that message.
2. Save the new form's secret key. The copy has a **new form ID and a new secret key**. It keeps the same field IDs, so your field mappings carry over.
3. Follow [Migrate step by step](#migrate-step-by-step) for the new form. Add its form ID and secret key to your configuration.
4. When the new form is live, close the old form. Your V1 handler keeps serving the old form until its last submission is processed.

## Migrate step by step

The plan is to make your endpoint accept both formats first, then switch the form. You never have a window in which a submission arrives in a format you cannot read.

### 1. Upgrade the SDK

```bash
npm install @opengovsg/formsg-sdk@^8.2.0
```

Version 8.2.0 is the first version that decrypts V4 attachments and fills in question text from the payload. Your V1 code keeps working on this version.

### 2. Accept both formats

Route each payload on `data.version`. Keep your V1 handler as it is.

```javascript
app.post(
  '/submissions',
  authenticate, // unchanged
  express.json(),
  async (req, res) => {
    const { data } = req.body

    if (data.version === 4) {
      const submission = formsg.cryptoV4.decrypt(formSecretKey, data)
      if (!submission) return res.status(400).send()
      await handleV4(data, submission)
    } else {
      const submission = formsg.crypto.decrypt(formSecretKey, data)
      if (!submission) return res.status(400).send()
      await handleV1(data, submission) // your existing code
    }

    return res.status(200).send()
  }
)
```

Deploy this before you switch the form.

### 3. Port your field handling

Write `handleV4` so that it produces the same records as your V1 code. Most integrations already map V1 answers into their own record type. Map V4 answers into the same type, so nothing downstream changes.

```javascript
// Before: V1
function handleV1(data, { responses }) {
  const byId = Object.fromEntries(responses.map((r) => [r._id, r]))
  return saveApplication({
    submissionId: data.submissionId,
    name: byId[NAME_FIELD].answer,
    postalCode: byId[ADDRESS_FIELD].answerArray[5],
    interests: byId[INTERESTS_FIELD].answerArray,
  })
}

// After: V4
const OTHERS = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

function handleV4(data, { responses }) {
  const interests = responses[INTERESTS_FIELD]?.answer
  return saveApplication({
    submissionId: data.submissionId,
    name: responses[NAME_FIELD]?.answer.value.trim() ?? '',
    postalCode: responses[ADDRESS_FIELD]?.answer.postalCode.value ?? '',
    interests: (interests?.value ?? []).map((v) =>
      v === OTHERS ? `Others: ${interests.othersInput}` : v
    ),
  })
}
```

Use [Translate each field type](#translate-each-field-type) for every field your code reads. If you download attachments, change the call to `formsg.cryptoV4.decryptWithAttachments`.

Two shortcuts do not work:

- **`adaptV4ToV3` is not a V4-to-V1 converter.** It produces the older keyed V3 shape, not the V1 array.
- **`formsg.crypto` cannot read V4.** It returns `null`.

### 4. Test on a copy of the form

Switching the toggle affects live submissions at once, so test on a copy first.

1. Duplicate the form. The copy has a new form ID and a new secret key.
2. In the copy's **Settings > Webhooks**, enter your test endpoint and turn off **Use legacy webhooks**.
3. Submit the copy with answers that cover every field type you read, including blank optional fields.
4. Check that `handleV4` produces the same records that `handleV1` produces for the same answers.

The copy keeps the original's field IDs, so your production field mappings work on it unchanged. Only the form ID and secret key differ.

### 5. Switch the form to V4

In the live form, go to **Settings > Webhooks** and turn off **Use legacy webhooks**. The next submission arrives as V4.

### 6. Remove the V1 path after retries drain

If **Enable retries** is on, a delivery that failed before the switch is retried in its original V1 format for up to about 24 hours. Keep the V1 branch for at least 24 hours after the switch. Then delete it, along with `handleV1`.

### 7. Add workflow steps, if you need them

Your form can now have more than one workflow step. Before you add a step, update your handler for the change that comes with it: FormSG sends **one webhook per step**, and each one has the same `submissionId`. See [Gotchas](#gotchas).

## Translate each field type

In this table, `r` is `responses[fieldId]`.

| `fieldType`                                                                                                   | V1                                                                                            | V4                                                                                     |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `textfield`, `textarea`, `number`, `decimal`, `dropdown`, `rating`, `nric`, `uen`, `homeno`, `country_region` | `r.answer`, trimmed                                                                           | `r.answer.value`, as typed                                                             |
| `yes_no`                                                                                                      | `r.answer`                                                                                    | `r.answer.value`                                                                       |
| `email`, `mobile`                                                                                             | `r.answer`. `r.isUserVerified` and `r.signature` if verified.                                 | `r.answer.value`. `r.answer.signature` if verified.                                    |
| `date`                                                                                                        | `r.answer`, `"09 Sep 2026"`                                                                   | `r.answer.value`, `"09/09/2026"`                                                       |
| `radiobutton`                                                                                                 | `r.answer`, or `"Others: text"`                                                               | `r.answer.value`. `r.answer.isOthersInput` is `true` for **Others**.                   |
| `checkbox`                                                                                                    | `r.answerArray`, with `"Others: text"` last                                                   | `r.answer.value`, with the **Others** marker in place. Text in `r.answer.othersInput`. |
| `address`                                                                                                     | `r.answerArray`: block, street, building, level, unit, postal                                 | `r.answer.blockNumber.value`, `r.answer.streetName.value`, and so on                   |
| `table`                                                                                                       | `r.answerArray[row][col]`. Column titles in `r.question`.                                     | `r.answer[rowId].value[columnId]`. Sort rows by `rowNum`.                              |
| `attachment`                                                                                                  | `r.answer` is the filename                                                                    | `r.answer.value` is the filename                                                       |
| `signature`                                                                                                   | `JSON.parse(r.answerArray[1])`                                                                | `r.answer.value`                                                                       |
| `children`                                                                                                    | One entry per child per attribute, with `_id` `childrenbirthrecords.<fieldId>.<attr>.<index>` | One entry per field. `r.answer[childKey].value[attr].value`.                           |
| `section`                                                                                                     | `r.isHeader` is `true`                                                                        | Absent                                                                                 |
| `statement`, `image`                                                                                          | Absent                                                                                        | Absent                                                                                 |

## Gotchas

**Missing keys.** V4 leaves out unanswered fields. Code such as `responses[FIELD].answer.value` throws on a blank optional field. Use `?.` and a default.

**Whitespace.** V1 trimmed answers. V4 does not. Trim values that you compare or store as keys.

**Field order.** V1 arrays followed form order. V4 key order means nothing. If you build a document or CSV in form order, keep your own list of field IDs.

**Question text.** `r.question` comes from the field titles at submission time. It never carries the `[Myinfo] ` prefix. Table questions no longer include column names. Match fields on ID, never on question text.

**Table columns.** V4 keys table cells by column ID, not by column title. Record the column IDs from a test submission, and map each one to your own column name.

**Checkbox Others marker.** When a respondent ticks **Others**, `answer.value` contains the literal string `!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!`. Replace it with `answer.othersInput` before you store the list.

**Verified data keys.** `submission.verified.uinFin` becomes `submission.verified['uinFin (Step 1)']`. The step number is the step that collected the value.

**Attachments.** V4 encrypts attachments with the submission key. Use `formsg.cryptoV4.decryptWithAttachments`. If you call `decryptFile` yourself, pass `submission.submissionSecretKey`, not the form secret key.

**More than one webhook per submission.** On a form with several steps, each step sends a webhook with the same `submissionId`. If your system uses `submissionId` as a unique key, it now drops or overwrites later steps. Use `(submissionId, data.workflowContent.workflowStep)` to tell deliveries apart. Every delivery carries all answers so far, so the latest step has the complete record.

**Retries out of order.** With retries on, the delivery for step 0 can arrive after the delivery for step 1. Do not overwrite a record with data from an earlier `workflowStep`.

## Questions

**Do I need a new secret key?**
No, if you switch with the toggle. Yes, if you duplicate a Storage mode form.

**Can I switch back to V1?**
Yes, while the form has at most one workflow step. Turn **Use legacy webhooks** back on. After you add a second step, you cannot turn it back on.

**Does FormSG resend past submissions in V4?**
No. Only new submissions use V4. Retries of earlier deliveries keep their original format.

**Does V1 stop working?**
Not yet. V1 is supported but receives no new features. We will announce any end-of-support date in advance.

**Does Plumber need any change?**
No. Plumber already receives V4.
