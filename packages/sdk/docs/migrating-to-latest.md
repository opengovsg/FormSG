# Migrating to the latest webhooks

This guide is for teams that decrypt FormSG webhooks with `formsg.crypto.decrypt` today. These are **legacy webhooks**; this guide moves you to the **latest webhooks**, decrypted with `formsg.cryptoV4`. Authentication does not change: your endpoint URL, the `X-FormSG-Signature` header, and `formsg.webhooks.authenticate` stay the same. Only decryption and how you read answers change.

Legacy and latest are webhook formats (`data.version` `2.1` and `4`), not SDK versions. Upgrading the SDK does not change what your form sends.

## Contents

- [What changes at a glance](#what-changes-at-a-glance)
- [See the difference](#see-the-difference)
- [Why switch](#why-switch)
- [Choose your migration path](#choose-your-migration-path)
- [Migrate step by step](#migrate-step-by-step)
- [Before and after, field by field](#before-and-after-field-by-field)
- [Gotchas](#gotchas)
- [Questions](#questions)

## What changes at a glance

|                              | Legacy                                                                                                          | Latest                                                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decrypt with                 | `formsg.crypto`                                                                                                 | `formsg.cryptoV4`                                                                                                                                                       |
| `data.version`               | `2.1`                                                                                                           | `4`                                                                                                                                                                     |
| `responses`                  | Array, in form order. For example, `[{ _id: '6a27…18', answer: 'Tan Ah Kow' }, { _id: '6a27…1a', answer: '' }]` | Object keyed by field ID. For example, `{ '6a27…18': { answer: { value: 'Tan Ah Kow' } } }`                                                                             |
| Each answer                  | `answer` string, such as `'Tan Ah Kow'`, or `answerArray`, such as `['Sports', 'Music']`                        | `answer` object, such as `{ value: 'Tan Ah Kow' }`. Its shape depends on `fieldType`. Refer to [Answer shapes by field type](../README.md#answer-shapes-by-field-type). |
| Unanswered fields            | Present, with `""` or `[]`                                                                                      | Absent                                                                                                                                                                  |
| Sections, statements, images | Sections present with `isHeader: true`                                                                          | Absent                                                                                                                                                                  |
| Whitespace in text answers   | Trimmed. See [Text answers](#text-answers) for the field types                                                  | Kept as the respondent typed it                                                                                                                                         |
| Myinfo questions             | Start with `[Myinfo] `                                                                                          | No added prefix                                                                                                                                                         |
| Keys in `verified`           | `uinFin`                                                                                                        | `uinFin (Step 1)`                                                                                                                                                       |
| Webhooks per submission      | One                                                                                                             | One per workflow step                                                                                                                                                   |
| Attachment encryption        | Form key                                                                                                        | Submission key                                                                                                                                                          |
| New payload keys             |                                                                                                                 | `encryptedSubmissionSecretKey`, `formFields`, `workflowContent`                                                                                                         |

## See the difference

The same submission, decrypted in each format. The form has a heading, a name, an optional phone number (left blank), a radio field (respondent picked **Others** and typed "Fax"), a checkbox, and an address. The respondent typed their name with a trailing space.

**Legacy:** `formsg.crypto.decrypt` returns an array in form order. Some keys are left out for clarity.

```json
{
  "responses": [
    {
      "_id": "6a27d7a5e1b2c3d4e5f60717",
      "fieldType": "section",
      "question": "About you",
      "answer": "",
      "isHeader": true
    },
    {
      "_id": "6a27d7a5e1b2c3d4e5f60718",
      "fieldType": "textfield",
      "question": "Your name",
      "answer": "Tan Ah Kow"
    },
    {
      "_id": "6a27d7a5e1b2c3d4e5f6071a",
      "fieldType": "mobile",
      "question": "Phone",
      "answer": ""
    },
    {
      "_id": "6a27d7a5e1b2c3d4e5f6071e",
      "fieldType": "radiobutton",
      "question": "Preferred contact",
      "answer": "Others: Fax"
    },
    {
      "_id": "6a27d7a5e1b2c3d4e5f6071c",
      "fieldType": "checkbox",
      "question": "Interests",
      "answerArray": ["Sports", "Music"]
    },
    {
      "_id": "6a27d7a5e1b2c3d4e5f6071b",
      "fieldType": "address",
      "question": "Home address",
      "answerArray": ["123", "Bishan Street 11", "", "05", "67", "570123"]
    }
  ]
}
```

**Latest:** `formsg.cryptoV4.decrypt` returns an object keyed by field ID.

```json
{
  "responses": {
    "6a27d7a5e1b2c3d4e5f60718": {
      "fieldType": "textfield",
      "question": "Your name",
      "answer": { "value": "Tan Ah Kow " },
      "provenance": {}
    },
    "6a27d7a5e1b2c3d4e5f6071e": {
      "fieldType": "radiobutton",
      "question": "Preferred contact",
      "answer": { "value": "Fax", "isOthersInput": true },
      "provenance": {}
    },
    "6a27d7a5e1b2c3d4e5f6071c": {
      "fieldType": "checkbox",
      "question": "Interests",
      "answer": { "value": ["Sports", "Music"] },
      "provenance": {}
    },
    "6a27d7a5e1b2c3d4e5f6071b": {
      "fieldType": "address",
      "question": "Home address",
      "answer": {
        "postalCode": { "value": "570123" },
        "blockNumber": { "value": "123" },
        "streetName": { "value": "Bishan Street 11" },
        "buildingName": { "value": "" },
        "levelNumber": { "value": "05" },
        "unitNumber": { "value": "67" }
      },
      "provenance": {}
    }
  },
  "submissionSecretKey": "<base64 submission secret key>"
}
```

Compare the two:

- The heading and the blank phone field appear only in the legacy payload.
- Legacy webhooks trimmed the name to `"Tan Ah Kow"`. Latest webhooks keep the trailing space.
- Legacy webhooks wrote the radio answer as `"Others: Fax"`. Latest webhooks give `"Fax"` and sets `isOthersInput` to `true`.
- Legacy webhooks gave the address as a list, in a fixed order. Latest webhooks name each part.

## Why switch

- **Multi-step workflows.** Legacy webhooks work only on forms with at most one workflow step. Latest webhooks send one after every step, so your system can act when a supervisor approves or a second respondent fills in their part.
- **Structured answers.** No more positional arrays or `"Others: "` prefixes. See [Before and after, field by field](#before-and-after-field-by-field).
- **One key per submission.** `decrypt` returns `submissionSecretKey`, which unlocks one submission only. Share it with another system instead of the form secret key.

## Choose your migration path

Open your form's **Settings > Webhooks** to see which kind of form you have.

|                | Form with a **Use legacy webhooks** toggle | Legacy form (previously known as Storage mode form)                                                                      |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| What you see   | A **Use legacy webhooks** toggle           | The message "This form uses legacy webhooks", and no toggle                                                              |
| How you switch | Turn off the toggle on the same form       | Duplicate the form to the latest version of FormSG, using the link in that message. The copy sends latest webhooks.      |
| Form ID        | Same                                       | **New**                                                                                                                  |
| Secret key     | Same                                       | **New.** Save the copy's secret key when you duplicate the form.                                                         |
| Field IDs      | Same                                       | Same, so your field mappings carry over                                                                                  |
| Endpoint       | Same                                       | Enter your endpoint in the copy's **Settings > Webhooks**                                                                |
| The old form   | Not applicable                             | Close it when the copy is live. Keep your legacy handler until the old form's last submission and retries are processed. |

## Migrate step by step

The plan is to make your endpoint accept both formats first, then switch the form. You never have a window in which a submission arrives in a format you cannot read.

### 1. Upgrade the SDK

```bash
npm install @opengovsg/formsg-sdk@^8.2.0
```

Your legacy code keeps working on this version.

### 2. Accept both formats

Route each payload on `data.version`. Keep your legacy handler as it is.

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
      await handleLatest(data, submission) // new code, see step 3
    } else {
      const submission = formsg.crypto.decrypt(formSecretKey, data)
      if (!submission) return res.status(400).send()
      await handleLegacy(data, submission) // your existing code
    }

    return res.status(200).send()
  }
)
```

Deploy this before you switch the form.

### 3. Port your field handling

First decide what `handleLatest` should save. You have two options.

| Option                                                              | Choose it when                                                                                      | What you change                                |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [A. Keep your current records](#option-a-keep-your-current-records) | Other systems read the records that your legacy code saves, and you do not want to change them yet. | Only the code that reads answers.              |
| [B. Save the latest answers](#option-b-save-the-latest-answers)     | You can change how you store submissions, or you are building something new.                        | The code that reads answers, and your storage. |

You do not have to copy every legacy behaviour. Legacy webhooks trimmed whitespace, wrote **Others** answers as `"Others: <text>"`, and moved **Others** to the end of checkbox lists. Reproduce only what your downstream systems depend on.

Field IDs are the same in both formats: a legacy entry's `_id` is the key in the latest `responses`. Use [Before and after, field by field](#before-and-after-field-by-field) for every field your code reads. If you download attachments, change the call to `formsg.cryptoV4.decryptWithAttachments`.

#### Option A: Keep your current records

`handleLatest` reads the latest answers and saves them in the same record type as `handleLegacy`. Nothing downstream changes.

```javascript
const NAME_FIELD_ID = '6a27d7a5e1b2c3d4e5f60718' // Short answer: "Your name"
const ADDRESS_FIELD_ID = '6a27d7a5e1b2c3d4e5f6071b' // Local address: "Home address"
const INTERESTS_FIELD_ID = '6a27d7a5e1b2c3d4e5f6071c' // Checkbox: "Interests"
```

Before, with legacy webhooks:

```javascript
function handleLegacy(data, submission) {
  // responses is an array, so search it for each field.
  const findField = (fieldId) =>
    submission.responses.find((response) => response._id === fieldId)

  const nameField = findField(NAME_FIELD_ID)
  // nameField.answer is 'Tan Ah Kow'

  const addressField = findField(ADDRESS_FIELD_ID)
  // addressField.answerArray is ['123', 'Bishan Street 11', '', '05', '67', '570123']
  // The postal code is always the 6th item.

  const interestsField = findField(INTERESTS_FIELD_ID)
  // interestsField.answerArray is ['Sports', 'Others: Chess']

  return saveApplication({
    submissionId: data.submissionId,
    name: nameField.answer,
    postalCode: addressField.answerArray[5],
    interests: interestsField.answerArray,
  })
}
```

After, with latest webhooks:

```javascript
const CHECKBOX_OTHERS = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

function handleLatest(data, submission) {
  // responses is an object keyed by field ID. Unanswered fields are absent,
  // so every lookup can be undefined.
  const nameField = submission.responses[NAME_FIELD_ID]
  // nameField.answer is { value: 'Tan Ah Kow' }

  const addressField = submission.responses[ADDRESS_FIELD_ID]
  // addressField.answer is { postalCode: { value: '570123' }, blockNumber: { value: '123' }, ... }

  const interestsField = submission.responses[INTERESTS_FIELD_ID]
  // interestsField.answer is { value: ['Sports', CHECKBOX_OTHERS], othersInput: 'Chess' }

  const interests = (interestsField?.answer.value ?? []).map((option) =>
    option === CHECKBOX_OTHERS ? interestsField.answer.othersInput : option
  )
  // interests is ['Sports', 'Chess']

  return saveApplication({
    submissionId: data.submissionId,
    name: nameField?.answer.value.trim() ?? '',
    postalCode: addressField?.answer.postalCode.value ?? '',
    interests,
  })
}
```

This version saves the **Others** text as `'Chess'`, not `'Others: Chess'`. If a downstream system expects the legacy `'Others: Chess'`, build that string instead.

#### Option B: Save the latest answers

`handleLatest` saves the responses as FormSG sent them. Your code reads fields by ID when it needs them.

```javascript
function handleLatest(data, submission) {
  return saveSubmission({
    submissionId: data.submissionId,
    workflowStep: data.workflowContent.workflowStep,
    // Keyed by field ID, for example:
    // { '6a27d7a5e1b2c3d4e5f60718': { fieldType: 'textfield', question: 'Your name', answer: { value: 'Tan Ah Kow' }, provenance: {} } }
    responses: submission.responses,
  })
}

// Later, wherever you need an answer:
const name = savedSubmission.responses[NAME_FIELD_ID]?.answer.value
```

Records that `handleLegacy` saved keep the legacy shape. Store the format with each record, such as `format: 'latest'`, or convert your old legacy records once, so the rest of your code reads one shape.

### 4. Test on a copy of the form

Switching the toggle affects live submissions at once, so test on a copy first.

1. Duplicate the form. The copy keeps the field IDs, so your field mappings work unchanged; only the form ID and secret key are new.
2. In the copy's **Settings > Webhooks**, enter your test endpoint and turn off **Use legacy webhooks**.
3. Submit the copy with answers that cover every field type you read. Include blank optional fields, leading and trailing spaces, checkbox **Others**, table rows, and attachments where applicable.
4. Check that `handleLatest` saves what you expect. With Option A, compare it with what `handleLegacy` saves for the same answers.
5. If you collect verified identity data, check the step-suffixed keys in `submission.verified`. Identify Myinfo-prefilled questions using field IDs, not the presence of `response.myInfo`.
6. If you use workflows, test an intermediate approval, early rejection, and the last step. Deliver a duplicate and an earlier step again to check your deduplication and ordering handling.

### 5. Switch the form to latest webhooks

In the live form, go to **Settings > Webhooks** and turn off **Use legacy webhooks**. The next submission arrives in the latest format.

### 6. Remove the legacy path after retries drain

If **Enable retries** is on, a delivery that failed before the switch is retried in its original legacy format for up to about 24 hours. Keep the legacy branch for at least 24 hours after the switch and confirm those deliveries have drained before deleting it. If the endpoint still serves other legacy forms, keep the branch for them.

### 7. Add workflow steps, if you need them

Your form can now have more than one workflow step. Update your handler before you add a step, because FormSG then sends **one webhook per step**, and each has the same `submissionId`.

[Handle multi-step workflows](../README.md#handle-multi-step-workflows) in the README shows how to:

- tell the deliveries for one submission apart, using `(submissionId, workflowStep)`;
- skip duplicate and out-of-order deliveries;
- detect when a workflow is complete or rejected.

## Before and after, field by field

Each example shows how you read one field type with legacy webhooks, then with latest webhooks. The examples use these lookups:

```javascript
// Legacy: responses is an array. Find a field by its ID.
const legacyResponses = formsg.crypto.decrypt(formSecretKey, data).responses
const findLegacyField = (fieldId) =>
  legacyResponses.find((response) => response._id === fieldId)

// Latest: responses is an object keyed by field ID.
const latestResponses = formsg.cryptoV4.decrypt(formSecretKey, data).responses
```

In the latest format, an unanswered field is absent, so the latest examples use `?.`. For every answer shape, refer to [Answer shapes by field type](../README.md#answer-shapes-by-field-type).

### Text answers

Short answer, Long answer, Number, Decimal, Dropdown, Rating, NRIC/FIN, UEN, Home number, Country/Region, and Yes/No. Their `fieldType` values are `textfield`, `textarea`, `number`, `decimal`, `dropdown`, `rating`, `nric`, `uen`, `homeno`, `country_region`, and `yes_no`.

```javascript
// Before: legacy
const textField = findLegacyField(TEXT_FIELD_ID)
textField.answer // 'Tan Ah Kow'. Spaces trimmed. '' if unanswered.

// After: latest
const textField = latestResponses[TEXT_FIELD_ID]
textField?.answer.value // 'Tan Ah Kow '. Spaces kept as typed. textField is undefined if unanswered.
```

Number, Decimal, and Rating answers are strings in both formats. Yes/No answers are `'Yes'` or `'No'`, and are not trimmed.

### Email and Mobile number (`email`, `mobile`)

```javascript
// Before: legacy
const emailField = findLegacyField(EMAIL_FIELD_ID)
emailField.answer // 'ahkow@example.com'
emailField.isUserVerified // true if the field requires OTP verification
emailField.signature // '<signature>', present if verified

// After: latest
const emailField = latestResponses[EMAIL_FIELD_ID]
emailField?.answer.value // 'ahkow@example.com'
emailField?.answer.signature // '<signature>', present if verified
```

### Date (`date`)

```javascript
// Before: legacy
const dateField = findLegacyField(DATE_FIELD_ID)
dateField.answer // '09 Sep 2026'

// After: latest
const dateField = latestResponses[DATE_FIELD_ID]
dateField?.answer.value // '09/09/2026', always dd/MM/yyyy
```

### Radio (`radiobutton`)

```javascript
// Before: legacy
const radioField = findLegacyField(RADIO_FIELD_ID)
radioField.answer // 'Email', or 'Others: Fax' if the respondent picked Others

// After: latest
const radioField = latestResponses[RADIO_FIELD_ID]
radioField?.answer.value // 'Email', or 'Fax' if the respondent picked Others
radioField?.answer.isOthersInput // false, or true if the respondent picked Others
```

### Checkbox (`checkbox`)

```javascript
// Before: legacy
const checkboxField = findLegacyField(CHECKBOX_FIELD_ID)
checkboxField.answerArray // ['Sports', 'Others: Chess']. Others is always last.

// After: latest
const CHECKBOX_OTHERS = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'
const checkboxField = latestResponses[CHECKBOX_FIELD_ID]
checkboxField?.answer.value // ['Sports', CHECKBOX_OTHERS]. Others stays where the respondent ticked it.
checkboxField?.answer.othersInput // 'Chess'
```

### Local address (`address`)

```javascript
// Before: legacy
const addressField = findLegacyField(ADDRESS_FIELD_ID)
addressField.answerArray
// ['123', 'Bishan Street 11', '', '05', '67', '570123']
// Always in this order: block, street, building, level, unit, postal code.

// After: latest
const addressField = latestResponses[ADDRESS_FIELD_ID]
addressField?.answer.blockNumber.value // '123'
addressField?.answer.streetName.value // 'Bishan Street 11'
addressField?.answer.buildingName.value // ''
addressField?.answer.levelNumber.value // '05'
addressField?.answer.unitNumber.value // '67'
addressField?.answer.postalCode.value // '570123'
```

### Table (`table`)

Legacy identifies columns by position. Latest identifies rows and columns by ID. Record the column IDs from a test submission.

```javascript
// Before: legacy
const tableField = findLegacyField(TABLE_FIELD_ID)
tableField.question // 'Household members (Name, Age)'. Column titles are in the question.
tableField.answerArray // [['Tan Ah Kow', '45'], ['Tan Ah Mei', '42']]

// After: latest
const NAME_COLUMN_ID = '6a27d7a5e1b2c3d4e5f60721'
const AGE_COLUMN_ID = '6a27d7a5e1b2c3d4e5f60722'

const tableField = latestResponses[TABLE_FIELD_ID]
tableField?.question // 'Household members'
tableField?.answer
// {
//   '<rowId>': { rowNum: 0, value: { [NAME_COLUMN_ID]: 'Tan Ah Kow', [AGE_COLUMN_ID]: '45' } },
//   '<rowId>': { rowNum: 1, value: { [NAME_COLUMN_ID]: 'Tan Ah Mei', [AGE_COLUMN_ID]: '42' } },
// }

// To get legacy-style rows:
const rows = Object.values(tableField?.answer ?? {})
  .sort((a, b) => a.rowNum - b.rowNum)
  .map((row) => [row.value[NAME_COLUMN_ID], row.value[AGE_COLUMN_ID]])
// [['Tan Ah Kow', '45'], ['Tan Ah Mei', '42']]
```

In the latest format, a table cell can be a string or a number.

### Attachment (`attachment`)

```javascript
// Before: legacy
const attachmentField = findLegacyField(ATTACHMENT_FIELD_ID)
attachmentField.answer // 'report.pdf'

// After: latest
const attachmentField = latestResponses[ATTACHMENT_FIELD_ID]
attachmentField?.answer.value // 'report.pdf'
attachmentField?.answer.hasBeenScanned // true if FormSG scanned the file
```

To download the file, use `formsg.cryptoV4.decryptWithAttachments`. See [Download attachments](../README.md#download-attachments).

### Signature (`signature`)

```javascript
// Before: legacy
const signatureField = findLegacyField(SIGNATURE_FIELD_ID)
signatureField.answerArray // ['draw', '[[[10,20,0.5],[11,21,0.5]]]']
JSON.parse(signatureField.answerArray[1]) // [[[10, 20, 0.5], [11, 21, 0.5]]]

// After: latest
const signatureField = latestResponses[SIGNATURE_FIELD_ID]
signatureField?.answer.value // [[[10, 20, 0.5], [11, 21, 0.5]]], already parsed
```

### Children (`children`)

Legacy webhooks split a children field into one entry per child per detail. Latest webhooks send one entry for the whole field.

In the latest format, each child sits under a `childKey`. FormSG generates these keys as `child0`, `child1`, and so on, in the order the respondent selected the children. A `childKey` is not a child's ID or birth certificate number, and the same child can get a different `childKey` in another submission. Each detail sits under its Myinfo attribute name (`attr`), such as `childname`.

```javascript
// Before: legacy
// Each entry's _id is 'childrenbirthrecords.<fieldId>.<attr>.<child index>'.
const childEntries = legacyResponses.filter((response) =>
  response._id.startsWith(`childrenbirthrecords.${CHILDREN_FIELD_ID}.`)
)
// [
//   { _id: 'childrenbirthrecords.<fieldId>.childname.0', answer: 'Tan Xiao Ming', ... },
//   { _id: 'childrenbirthrecords.<fieldId>.childname.1', answer: 'Tan Xiao Hua', ... },
// ]

// After: latest
const childrenField = latestResponses[CHILDREN_FIELD_ID]
childrenField?.answer
// {
//   child0: { value: { childname: { value: 'Tan Xiao Ming', myInfo: { attr: 'childname' } } } },
//   child1: { value: { childname: { value: 'Tan Xiao Hua', myInfo: { attr: 'childname' } } } },
// }
childrenField?.answer.child0.value.childname.value // 'Tan Xiao Ming'
```

See [Children fields](../README.md#children-fields) in the README.

### Heading, Paragraph, and Image (`section`, `statement`, `image`)

```javascript
// Before: legacy
findLegacyField(HEADING_FIELD_ID) // { fieldType: 'section', answer: '', isHeader: true, ... }
// Paragraph and Image fields are absent.

// After: latest
latestResponses[HEADING_FIELD_ID] // undefined. Heading, Paragraph, and Image fields are all absent.
```

## Gotchas

Most differences are covered field by field above. These ones are easy to miss:

**Field order.** Legacy arrays followed form order. Latest `responses` key order means nothing. If you need form order, iterate `data.formFields`, which follows it.

**Question text and Myinfo.** `question` has no `[Myinfo] ` prefix, and table questions no longer include column names. If you match fields on question text, update those strings. The latest format can omit `response.myInfo` even on Myinfo-prefilled fields.

**Verified data keys.** `verified.uinFin` becomes `verified['uinFin (Step 1)']`, and `cpUen` becomes `cpUen (Step 1)`. FormSG collects Singpass and Corppass data only on the first step, so the suffix is always `(Step 1)` today.

**Attachments.** The latest format encrypts attachments with the submission key. If you call `decryptFile` yourself, pass `submission.submissionSecretKey`, not the form secret key.

**Several webhooks per submission.** With more than one workflow step, each step sends a webhook with the same `submissionId`, and retries can arrive out of order. If `submissionId` is a unique key in your system, later steps get dropped or overwritten. See [Handle multi-step workflows](../README.md#handle-multi-step-workflows).

## Questions

**Can I switch back to legacy webhooks?**
Yes, while the form has at most one workflow step. Turn **Use legacy webhooks** back on. If you added more steps, remove them until one remains first.

Retries keep their original format, so keep your latest handler for about 24 hours after switching back.

**Does FormSG resend past submissions in the latest format?**
No. Only new submissions use it. Retries of earlier deliveries keep their original format.

**Do legacy webhooks stop working?**
Not yet. They are supported but receive no new features. We will announce any end-of-support date in advance.
