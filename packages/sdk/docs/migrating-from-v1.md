# Migrating from V1 to V4 webhooks

This guide is for teams that receive FormSG webhooks with `formsg.crypto.decrypt` today. It explains what V4 gives you, what changes in your code, and how to switch without losing a submission.

Your authentication code does not change. Your endpoint URL, the `X-FormSG-Signature` header, and `formsg.webhooks.authenticate` all stay the same. The work is in how you decrypt and read the answers.

**Version terminology:** V1 and V4 name webhook formats. Their wire values are `data.version: 2.1` and `data.version: 4`. The npm package has a separate version, such as `8.2.0`. Installing a newer SDK does not switch your form's webhook format.

## Contents

- [What changes at a glance](#what-changes-at-a-glance)
- [See the difference](#see-the-difference)
- [What you gain](#what-you-gain)
- [Choose your migration path](#choose-your-migration-path)
- [Migrate step by step](#migrate-step-by-step)
- [Before and after, field by field](#before-and-after-field-by-field)
- [Gotchas](#gotchas)
- [Questions](#questions)

## What changes at a glance

|                                         | V1                                                                                                                           | V4                                                                                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK version                             | Your current V1-capable version                                                                                              | **8.2.0 or later**                                                                                                                                                      |
| Decrypt with                            | `formsg.crypto`                                                                                                              | `formsg.cryptoV4`                                                                                                                                                       |
| `data.version`                          | `2.1`                                                                                                                        | `4`                                                                                                                                                                     |
| `responses`                             | Array, in form order. For example, `[{ _id: '6a27…18', answer: 'Tan Ah Kow' }, { _id: '6a27…1a', answer: '' }]`              | Object keyed by field ID. For example, `{ '6a27…18': { answer: { value: 'Tan Ah Kow' } } }`                                                                             |
| Each answer                             | `answer` string, such as `'Tan Ah Kow'`, or `answerArray`, such as `['Sports', 'Music']`                                     | `answer` object, such as `{ value: 'Tan Ah Kow' }`. Its shape depends on `fieldType`. Refer to [Answer shapes by field type](../README.md#answer-shapes-by-field-type). |
| Unanswered fields                       | Present, with `""` or `[]`                                                                                                   | Absent                                                                                                                                                                  |
| Sections, statements, images            | Sections present with `isHeader: true`                                                                                       | Absent                                                                                                                                                                  |
| Whitespace in text answers              | Trimmed. Applies to Short answer, Long answer, Number, Decimal, Dropdown, Rating, NRIC/FIN, UEN, Home number, Country/Region | Kept as the respondent typed it                                                                                                                                         |
| Myinfo questions                        | Start with `[Myinfo] `                                                                                                       | No added prefix. Identify fields using your configured IDs.                                                                                                             |
| Keys in `verified`                      | `uinFin`                                                                                                                     | `uinFin (Step 1)`                                                                                                                                                       |
| Webhooks per submission                 | One                                                                                                                          | One per workflow step                                                                                                                                                   |
| Attachment encryption                   | Form key                                                                                                                     | Submission key                                                                                                                                                          |
| New payload keys                        |                                                                                                                              | `encryptedSubmissionSecretKey`, `formFields`, `workflowContent`                                                                                                         |
| Signature header, retries, IP addresses |                                                                                                                              | Unchanged                                                                                                                                                               |

## See the difference

Here is one submission, decrypted in each format. The form has a heading and five fields. The respondent typed their name with a trailing space, picked **Others** in a radio field and typed "Fax", and left the optional phone field blank.

| Field ID | Form builder field | Question          | Respondent's answer                      |
| -------- | ------------------ | ----------------- | ---------------------------------------- |
| `…60717` | Heading            | About you         |                                          |
| `…60718` | Short answer       | Your name         | `Tan Ah Kow ` (with a trailing space)    |
| `…6071a` | Mobile number      | Phone             | Left blank                               |
| `…6071e` | Radio              | Preferred contact | **Others**, with "Fax" typed in          |
| `…6071c` | Checkbox           | Interests         | Sports, Music                            |
| `…6071b` | Local address      | Home address      | Blk 123 Bishan Street 11, #05-67, 570123 |

**V1:** `formsg.crypto.decrypt` returns an array in form order. Some keys are left out for clarity.

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

**V4:** `formsg.cryptoV4.decrypt` returns an object keyed by field ID.

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

- The heading and the blank phone field are in V1 but not in V4.
- V1 trimmed the name to `"Tan Ah Kow"`. V4 keeps the trailing space.
- V1 wrote the radio answer as `"Others: Fax"`. V4 gives `"Fax"` and sets `isOthersInput` to `true`.
- V1 gave the address as a list, in a fixed order. V4 names each part.

## What you gain

### Webhooks for multi-step workflows

V1 works only on forms with at most one workflow step. If you turn on **Use legacy webhooks**, FormSG blocks you from adding a second step.

V4 removes that limit. FormSG sends a webhook after every step, so your system can act when a supervisor approves, when a second respondent fills in their part, or when the workflow finishes. Each delivery tells you which step just finished, who was asked to fill in the next step, and how each approval step was decided.

### Look up answers by ID, not by position

V1 gives you an array, so you search it for the field you want:

```javascript
// V1
const nameField = submission.responses.find((r) => r._id === NAME_FIELD_ID)
const name = nameField?.answer
```

V4 gives you an object keyed by field ID:

```javascript
// V4
const nameField = submission.responses[NAME_FIELD_ID]
const name = nameField?.answer.value
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

## Choose your migration path

Open your form's **Settings > Webhooks** to see which kind of form you have.

|                    | Form with a **Use legacy webhooks** toggle    | Storage mode form from an earlier version of FormSG                                                                  |
| ------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| What you see       | A **Use legacy webhooks** toggle              | The message "This form uses legacy webhooks", and no toggle                                                          |
| How you move to V4 | Turn off the toggle on the same form          | Duplicate the form to the latest version of FormSG, using the link in that message. The copy sends V4.               |
| Form ID            | Same                                          | **New**                                                                                                              |
| Secret key         | Same                                          | **New.** Save the copy's secret key when you duplicate the form.                                                     |
| Field IDs          | Same                                          | Same, so your field mappings carry over                                                                              |
| Endpoint           | Same                                          | Enter your endpoint in the copy's **Settings > Webhooks**                                                            |
| Your configuration | No change                                     | Add the copy's form ID and secret key                                                                                |
| The old form       | Not applicable                                | Close it when the copy is live. Keep your V1 handler until the old form's last submission and retries are processed. |
| Next               | [Migrate step by step](#migrate-step-by-step) | [Migrate step by step](#migrate-step-by-step), using the copy's form ID and secret key                               |

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
      await handleV4(data, submission) // new code, see step 3
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

First decide what `handleV4` should save. You have two options.

| Option                                                              | Choose it when                                                                                  | What you change                                |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [A. Keep your current records](#option-a-keep-your-current-records) | Other systems read the records that your V1 code saves, and you do not want to change them yet. | Only the code that reads answers.              |
| [B. Save the V4 answers](#option-b-save-the-v4-answers)             | You can change how you store submissions, or you are building something new.                    | The code that reads answers, and your storage. |

You do not have to copy every V1 behaviour. V1 trimmed whitespace, wrote **Others** answers as `"Others: <text>"`, and moved **Others** to the end of checkbox lists. Reproduce only what your downstream systems depend on.

Use [Before and after, field by field](#before-and-after-field-by-field) for every field your code reads. If you download attachments, change the call to `formsg.cryptoV4.decryptWithAttachments`.

`formsg.crypto` cannot read V4. It returns `null`, so you need a separate V4 path.

#### Option A: Keep your current records

`handleV4` reads the V4 answers and saves them in the same record type as `handleV1`. Nothing downstream changes.

This example form has three fields:

```javascript
const NAME_FIELD_ID = '6a27d7a5e1b2c3d4e5f60718' // Short answer: "Your name"
const ADDRESS_FIELD_ID = '6a27d7a5e1b2c3d4e5f6071b' // Local address: "Home address"
const INTERESTS_FIELD_ID = '6a27d7a5e1b2c3d4e5f6071c' // Checkbox: "Interests"
```

Before, in V1:

```javascript
function handleV1(data, submission) {
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

After, in V4:

```javascript
const CHECKBOX_OTHERS = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

function handleV4(data, submission) {
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

This version saves the **Others** text as `'Chess'`, not `'Others: Chess'`. If a downstream system expects V1's `'Others: Chess'`, build that string instead.

#### Option B: Save the V4 answers

`handleV4` saves the responses as FormSG sent them. Your code reads fields by ID when it needs them.

```javascript
function handleV4(data, submission) {
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

Records that `handleV1` saved keep the V1 shape. Store the format with each record, such as `format: 'v4'`, or convert your old V1 records once, so the rest of your code reads one shape.

### 4. Test on a copy of the form

Switching the toggle affects live submissions at once, so test on a copy first.

1. Duplicate the form. The copy has a new form ID and a new secret key.
2. In the copy's **Settings > Webhooks**, enter your test endpoint and turn off **Use legacy webhooks**.
3. Submit the copy with answers that cover every field type you read. Include blank optional fields, leading and trailing spaces, checkbox **Others**, table rows, and attachments where applicable.
4. Check that `handleV4` saves what you expect. With Option A, compare it with what `handleV1` saves for the same answers.
5. If you collect verified identity data, check the step-suffixed keys in `submission.verified`. Identify Myinfo-prefilled questions using field IDs, not the presence of `response.myInfo`.
6. If you use workflows, test an intermediate approval, early rejection, and the last step. Deliver a duplicate and an earlier step again to check your deduplication and ordering handling.

The copy keeps the original's field IDs, so your production field mappings work on it unchanged. Only the form ID and secret key differ.

### 5. Switch the form to V4

In the live form, go to **Settings > Webhooks** and turn off **Use legacy webhooks**. The next submission arrives as V4.

### 6. Remove the V1 path after retries drain

If **Enable retries** is on, a delivery that failed before the switch is retried in its original V1 format for up to about 24 hours. Keep the V1 branch for at least 24 hours after the switch and confirm those deliveries have drained before deleting it. If the endpoint still serves other V1 forms, keep the branch for them.

### 7. Add workflow steps, if you need them

Your form can now have more than one workflow step. Update your handler before you add a step, because FormSG then sends **one webhook per step**, and each has the same `submissionId`.

[Handle multi-step workflows](../README.md#handle-multi-step-workflows) in the README shows how to:

- tell the deliveries for one submission apart, using `(submissionId, workflowStep)`;
- skip duplicate and out-of-order deliveries;
- detect when a workflow is complete or rejected.

## Before and after, field by field

Each example shows how you read one field type in V1, then in V4. The examples use these lookups:

```javascript
// V1: responses is an array. Find a field by its ID.
const v1Responses = formsg.crypto.decrypt(formSecretKey, data).responses
const findV1Field = (fieldId) =>
  v1Responses.find((response) => response._id === fieldId)

// V4: responses is an object keyed by field ID.
const v4Responses = formsg.cryptoV4.decrypt(formSecretKey, data).responses
```

In V4, an unanswered field is absent, so the V4 examples use `?.`. For every V4 answer shape, refer to [Answer shapes by field type](../README.md#answer-shapes-by-field-type).

### Text answers

Short answer, Long answer, Number, Decimal, Dropdown, Rating, NRIC/FIN, UEN, Home number, and Country/Region. Their `fieldType` values are `textfield`, `textarea`, `number`, `decimal`, `dropdown`, `rating`, `nric`, `uen`, `homeno`, and `country_region`.

```javascript
// Before: V1
const textField = findV1Field(TEXT_FIELD_ID)
textField.answer // 'Tan Ah Kow'. Spaces trimmed. '' if unanswered.

// After: V4
const textField = v4Responses[TEXT_FIELD_ID]
textField?.answer.value // 'Tan Ah Kow '. Spaces kept as typed. textField is undefined if unanswered.
```

Number, Decimal, and Rating answers are strings in both formats.

### Yes/No (`yes_no`)

```javascript
// Before: V1
const yesNoField = findV1Field(YES_NO_FIELD_ID)
yesNoField.answer // 'Yes' or 'No'

// After: V4
const yesNoField = v4Responses[YES_NO_FIELD_ID]
yesNoField?.answer.value // 'Yes' or 'No'
```

### Email and Mobile number (`email`, `mobile`)

```javascript
// Before: V1
const emailField = findV1Field(EMAIL_FIELD_ID)
emailField.answer // 'ahkow@example.com'
emailField.isUserVerified // true if the field requires OTP verification
emailField.signature // '<signature>', present if verified

// After: V4
const emailField = v4Responses[EMAIL_FIELD_ID]
emailField?.answer.value // 'ahkow@example.com'
emailField?.answer.signature // '<signature>', present if verified
```

### Date (`date`)

```javascript
// Before: V1
const dateField = findV1Field(DATE_FIELD_ID)
dateField.answer // '09 Sep 2026'

// After: V4
const dateField = v4Responses[DATE_FIELD_ID]
dateField?.answer.value // '09/09/2026', always dd/MM/yyyy
```

### Radio (`radiobutton`)

```javascript
// Before: V1
const radioField = findV1Field(RADIO_FIELD_ID)
radioField.answer // 'Email', or 'Others: Fax' if the respondent picked Others

// After: V4
const radioField = v4Responses[RADIO_FIELD_ID]
radioField?.answer.value // 'Email', or 'Fax' if the respondent picked Others
radioField?.answer.isOthersInput // false, or true if the respondent picked Others
```

### Checkbox (`checkbox`)

```javascript
// Before: V1
const checkboxField = findV1Field(CHECKBOX_FIELD_ID)
checkboxField.answerArray // ['Sports', 'Others: Chess']. Others is always last.

// After: V4
const CHECKBOX_OTHERS = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'
const checkboxField = v4Responses[CHECKBOX_FIELD_ID]
checkboxField?.answer.value // ['Sports', CHECKBOX_OTHERS]. Others stays where the respondent ticked it.
checkboxField?.answer.othersInput // 'Chess'
```

### Local address (`address`)

```javascript
// Before: V1
const addressField = findV1Field(ADDRESS_FIELD_ID)
addressField.answerArray
// ['123', 'Bishan Street 11', '', '05', '67', '570123']
// Always in this order: block, street, building, level, unit, postal code.

// After: V4
const addressField = v4Responses[ADDRESS_FIELD_ID]
addressField?.answer.blockNumber.value // '123'
addressField?.answer.streetName.value // 'Bishan Street 11'
addressField?.answer.buildingName.value // ''
addressField?.answer.levelNumber.value // '05'
addressField?.answer.unitNumber.value // '67'
addressField?.answer.postalCode.value // '570123'
```

### Table (`table`)

V1 identifies columns by position. V4 identifies rows and columns by ID. Record the column IDs from a test submission.

```javascript
// Before: V1
const tableField = findV1Field(TABLE_FIELD_ID)
tableField.question // 'Household members (Name, Age)'. Column titles are in the question.
tableField.answerArray // [['Tan Ah Kow', '45'], ['Tan Ah Mei', '42']]

// After: V4
const NAME_COLUMN_ID = '6a27d7a5e1b2c3d4e5f60721'
const AGE_COLUMN_ID = '6a27d7a5e1b2c3d4e5f60722'

const tableField = v4Responses[TABLE_FIELD_ID]
tableField?.question // 'Household members'
tableField?.answer
// {
//   '<rowId>': { rowNum: 0, value: { [NAME_COLUMN_ID]: 'Tan Ah Kow', [AGE_COLUMN_ID]: '45' } },
//   '<rowId>': { rowNum: 1, value: { [NAME_COLUMN_ID]: 'Tan Ah Mei', [AGE_COLUMN_ID]: '42' } },
// }

// To get V1-style rows:
const rows = Object.values(tableField?.answer ?? {})
  .sort((a, b) => a.rowNum - b.rowNum)
  .map((row) => [row.value[NAME_COLUMN_ID], row.value[AGE_COLUMN_ID]])
// [['Tan Ah Kow', '45'], ['Tan Ah Mei', '42']]
```

A V4 cell can be a string or a number.

### Attachment (`attachment`)

```javascript
// Before: V1
const attachmentField = findV1Field(ATTACHMENT_FIELD_ID)
attachmentField.answer // 'report.pdf'

// After: V4
const attachmentField = v4Responses[ATTACHMENT_FIELD_ID]
attachmentField?.answer.value // 'report.pdf'
attachmentField?.answer.hasBeenScanned // true if FormSG scanned the file
```

To download the file, use `formsg.cryptoV4.decryptWithAttachments`. See [Download attachments](../README.md#download-attachments).

### Signature (`signature`)

```javascript
// Before: V1
const signatureField = findV1Field(SIGNATURE_FIELD_ID)
signatureField.answerArray // ['draw', '[[[10,20,0.5],[11,21,0.5]]]']
JSON.parse(signatureField.answerArray[1]) // [[[10, 20, 0.5], [11, 21, 0.5]]]

// After: V4
const signatureField = v4Responses[SIGNATURE_FIELD_ID]
signatureField?.answer.value // [[[10, 20, 0.5], [11, 21, 0.5]]], already parsed
```

### Children (`children`)

V1 splits a children field into one entry per child per detail. V4 sends one entry for the whole field.

In V4, each child sits under a `childKey`. FormSG generates these keys as `child0`, `child1`, and so on, in the order the respondent selected the children. A `childKey` is not a child's ID or birth certificate number, and the same child can get a different `childKey` in another submission. Each detail sits under its Myinfo attribute name (`attr`), such as `childname`.

```javascript
// Before: V1
// Each entry's _id is 'childrenbirthrecords.<fieldId>.<attr>.<child index>'.
const childEntries = v1Responses.filter((response) =>
  response._id.startsWith(`childrenbirthrecords.${CHILDREN_FIELD_ID}.`)
)
// [
//   { _id: 'childrenbirthrecords.<fieldId>.childname.0', answer: 'Tan Xiao Ming', ... },
//   { _id: 'childrenbirthrecords.<fieldId>.childname.1', answer: 'Tan Xiao Hua', ... },
// ]

// After: V4
const childrenField = v4Responses[CHILDREN_FIELD_ID]
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
// Before: V1
findV1Field(HEADING_FIELD_ID) // { fieldType: 'section', answer: '', isHeader: true, ... }
// Paragraph and Image fields are absent.

// After: V4
v4Responses[HEADING_FIELD_ID] // undefined. Heading, Paragraph, and Image fields are all absent.
```

## Gotchas

**Missing keys.** V4 leaves out unanswered fields. Code such as `responses[FIELD_ID].answer.value` throws on a blank optional field. Use `?.` and a default.

**Whitespace.** V1 trimmed text answers, such as Short answer and Long answer. V4 keeps the spaces the respondent typed. Trim values that you compare or store as keys.

**Field order.** V1 arrays followed form order. V4 key order means nothing. If you build a document or CSV in form order, keep your own list of field IDs.

**Question text and Myinfo.** `response.question` comes from the field titles at submission time, without an added `[Myinfo] ` prefix. Table questions no longer include column names. Current V4 submissions can omit top-level `response.myInfo` even for Myinfo-prefilled fields, so keep a field-ID mapping for those questions. Nested children metadata is separate from top-level field metadata. Match fields on ID, never on question text.

**Table columns.** V4 keys table cells by column ID, not by column title. Record the column IDs from a test submission, and map each one to your own column name.

**Checkbox Others marker.** When a respondent ticks **Others**, `answer.value` contains the literal string `!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!`. Replace it with `answer.othersInput` before you store the list.

**Verified data keys.** `submission.verified.uinFin` becomes `submission.verified['uinFin (Step 1)']`, and `cpUen` becomes `cpUen (Step 1)`. FormSG collects Singpass and Corppass data only on the first step, so the suffix is always `(Step 1)` today.

**Attachments.** V4 encrypts attachments with the submission key. Use `formsg.cryptoV4.decryptWithAttachments`. If you call `decryptFile` yourself, pass `submission.submissionSecretKey`, not the form secret key.

**More than one webhook per submission.** On a form with several steps, each step sends a webhook with the same `submissionId`. If your system uses `submissionId` as a unique key, it now drops or overwrites later steps. Use `(submissionId, data.workflowContent.workflowStep)` to tell deliveries apart. Every delivery carries all answers so far, so the latest step has the complete record.

**Workflow completion.** An intermediate `APPROVED` step can have further steps remaining. A `REJECTED` step ends the workflow early. See the [completion example in the README](../README.md#handle-multi-step-workflows) to handle rejection, the last step, and forms with no workflow.

**Retries out of order.** With retries on, the delivery for step 0 can arrive after the delivery for step 1. Do not overwrite a record with data from an earlier `workflowStep`.

## Questions

**Do I need a new secret key?**
No, if you switch with the toggle. Yes, if you duplicate a Storage mode form.

**Can I switch back to V1?**
Yes, while the form has at most one workflow step. Turn **Use legacy webhooks** back on. After you add a second step, you cannot turn it back on.

Keep accepting both formats during rollback. Failed V4 deliveries keep their V4 format when retried, just as failed V1 deliveries do after switching to V4. Keep the V4 handler through the retry window and confirm outstanding V4 deliveries have drained before removing it.

**Does FormSG resend past submissions in V4?**
No. Only new submissions use V4. Retries of earlier deliveries keep their original format.

**Does V1 stop working?**
Not yet. V1 is supported but receives no new features. We will announce any end-of-support date in advance.

**Does Plumber need any change?**
No. Plumber already receives V4.
