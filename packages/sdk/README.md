_This is an SDK for receiving FormSG webhooks. It is **not** the FormSG system._

# FormSG JavaScript SDK

Use this SDK to receive FormSG submissions on your own server. It checks that each webhook came from FormSG, then decrypts the submission with your form's secret key.

```javascript
const formsg = require('@opengovsg/formsg-sdk')()

const submission = formsg.cryptoV4.decrypt(formSecretKey, req.body.data)
submission.responses['6a27d7a5e1b2c3d4e5f60718'].answer.value // 'Tan Ah Kow'
```

> **Already receiving webhooks with `formsg.crypto.decrypt`?** You are on the legacy V1 format. Read [Migrating from V1 to V4](./docs/migrating-from-v1.md) to see what you gain and how to switch.

Not using JavaScript? See [formsg-python-sdk](https://github.com/opengovsg/formsg-python-sdk).

## Contents

- [Before you begin](#before-you-begin)
- [Quickstart: receive your first submission](#quickstart-receive-your-first-submission)
- [Read the responses](#read-the-responses)
- [Handle multi-step workflows](#handle-multi-step-workflows)
- [Download attachments](#download-attachments)
- [Read verified Singpass and Corppass data](#read-verified-singpass-and-corppass-data)
- [Run a reliable endpoint](#run-a-reliable-endpoint)
- [Reference](#reference)
- [Verify signatures without the SDK](#verify-signatures-without-the-sdk)
- [Legacy V1 webhooks](#legacy-v1-webhooks)

## Before you begin

You need:

- A FormSG form and its **secret key**. FormSG gives you the secret key as a file when you create the form. FormSG does not keep a copy, so store it in a secret manager.
- An HTTPS endpoint that the internet can reach. If you restrict inbound traffic, allow the [FormSG webhook IP addresses](https://guide.form.gov.sg/user-guides/advanced-guide/webhooks).
- Node.js and `@opengovsg/formsg-sdk` version **8.2.0 or later**. Earlier versions cannot decrypt V4 attachments or fill in question text.

### Check which format your form sends

FormSG sends one of two payload formats. This guide covers V4, the current format.

| Your form                                                                | Format it sends | Decrypt with      |
| ------------------------------------------------------------------------ | --------------- | ----------------- |
| A form created in the current version of FormSG                          | **V4**          | `formsg.cryptoV4` |
| A form with **Use legacy webhooks** turned on in **Settings > Webhooks** | V1 (legacy)     | `formsg.crypto`   |
| A Storage mode form created in an earlier version of FormSG              | V1 (legacy)     | `formsg.crypto`   |

You can also check a payload you received. V4 payloads have `data.version` set to `4`. V1 payloads have `data.version` set to `2.1`.

## Quickstart: receive your first submission

In this section, you build an Express server that accepts a webhook, checks its signature, and prints the decrypted answers.

### 1. Install the SDK

```bash
npm install @opengovsg/formsg-sdk express
```

### 2. Write the webhook handler

Create `server.js`:

```javascript
const express = require('express')
const formsg = require('@opengovsg/formsg-sdk')({ mode: 'production' })

const app = express()

// The public URL of this endpoint. It must match the URL you enter in
// FormSG exactly, because the signature covers it.
const POST_URI = 'https://my-domain.com/submissions'

// The secret key that FormSG gave you when you created the form.
const formSecretKey = process.env.FORM_SECRET_KEY

app.post(
  '/submissions',
  // 1. Check that FormSG sent this request.
  (req, res, next) => {
    try {
      formsg.webhooks.authenticate(req.get('X-FormSG-Signature'), POST_URI)
      return next()
    } catch (e) {
      return res.status(401).send({ message: 'Unauthorized' })
    }
  },
  // 2. Parse the JSON body.
  express.json(),
  // 3. Decrypt the submission.
  (req, res) => {
    const submission = formsg.cryptoV4.decrypt(formSecretKey, req.body.data)

    if (!submission) {
      // Wrong secret key, or the payload is not V4.
      return res.status(400).send({ message: 'Could not decrypt' })
    }

    for (const [fieldId, response] of Object.entries(submission.responses)) {
      console.log(fieldId, response.question, response.answer)
    }

    return res.status(200).send({ message: 'OK' })
  }
)

app.listen(8080, () => console.log('Listening on port 8080'))
```

If you integrate with FormSG staging, set `mode: 'staging'`. The mode selects the public key that the SDK uses to check signatures.

### 3. Start the server

```bash
FORM_SECRET_KEY='<your secret key>' node server.js
```

Expose port 8080 at the HTTPS URL that you set as `POST_URI`.

### 4. Connect the form

1. In FormSG, open your form and go to **Settings > Webhooks**.
2. Enter your endpoint URL. Use the same value as `POST_URI`.
3. Make sure **Use legacy webhooks** is off.

### 5. Send a test submission

Open the form and submit it. Your server prints one line per answered field:

```text
6a27d7a5e1b2c3d4e5f60718 Your name { value: 'Tan Ah Kow' }
6a27d7a5e1b2c3d4e5f60719 Email { value: 'ahkow@example.com', signature: '...' }
```

If the server prints nothing, check these causes first:

- **You get a `401`.** `POST_URI` does not exactly match the URL in FormSG, or the server clock is more than 5 minutes off.
- **You get a `400`.** The secret key is for a different form, or the form sends V1. See [Check which format your form sends](#check-which-format-your-form-sends).

## Read the responses

`cryptoV4.decrypt` returns `null` if decryption fails. Otherwise it returns:

```typescript
{
  responses: Record<string, FieldResponseV4> // keyed by field ID
  verified?: Record<string, string>          // see "Read verified Singpass and Corppass data"
  submissionSecretKey: string                // this submission's own key
}
```

Each entry in `responses` looks like this:

```json
{
  "fieldType": "textfield",
  "question": "Your name",
  "answer": { "value": "Tan Ah Kow" },
  "provenance": {}
}
```

### Look up answers by field ID

Responses are keyed by field ID, so you read a field directly instead of searching a list. To find each field's ID, send one test submission and log `req.body.data.formFields`. It maps every field ID to its question.

```javascript
const NAME_FIELD = '6a27d7a5e1b2c3d4e5f60718'
const PHONE_FIELD = '6a27d7a5e1b2c3d4e5f6071a'

const name = submission.responses[NAME_FIELD]?.answer.value
const phone = submission.responses[PHONE_FIELD]?.answer.value // undefined if left blank
```

Field IDs stay the same when you edit a question's title, and when you duplicate the form. They change when you delete a field and add it again.

Three rules apply to every submission:

- **Unanswered fields are absent.** Use optional chaining (`?.`) for any field that is optional or hidden by logic.
- **Section headers, statements, and images are absent.** They have no answer.
- **Key order is not form order.** Use your own list of field IDs if order matters.

### Answer shapes by field type

Switch on `fieldType` to read `answer`. The TypeScript type `FormFieldV4` narrows `answer` for you when you check `fieldType`.

| `fieldType`                                                                                                   | `answer`                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `textfield`, `textarea`, `number`, `decimal`, `dropdown`, `rating`, `nric`, `uen`, `homeno`, `country_region` | `{ value: string }`                                                                                                                                                                  |
| `date`                                                                                                        | `{ value: '09/09/2026' }`, always `dd/MM/yyyy`                                                                                                                                       |
| `yes_no`                                                                                                      | `{ value: 'Yes' }` or `{ value: 'No' }`                                                                                                                                              |
| `email`, `mobile`                                                                                             | `{ value: string, signature?: string }`. `signature` is present when the respondent verified the value with an OTP.                                                                  |
| `radiobutton`                                                                                                 | `{ value: string, isOthersInput: boolean }`. If `isOthersInput` is `true`, `value` is the text the respondent typed in **Others**.                                                   |
| `checkbox`                                                                                                    | `{ value: string[], othersInput?: string }`. If the respondent ticked **Others**, `value` contains `'!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'` and `othersInput` holds their text. |
| `address`                                                                                                     | `{ postalCode, blockNumber, streetName, buildingName, levelNumber, unitNumber }`. Each part is `{ value: string }`.                                                                  |
| `table`                                                                                                       | `{ [rowId]: { rowNum: number, value: { [columnId]: string \| number } } }`. Sort rows by `rowNum`.                                                                                   |
| `attachment`                                                                                                  | `{ value: 'filename.pdf', hasBeenScanned: boolean, md5Hash?: string }`                                                                                                               |
| `signature`                                                                                                   | `{ type: 'draw', value: [x, y, t][][] }`. Each inner array is one pen stroke.                                                                                                        |
| `children`                                                                                                    | `{ [childKey]: { value: { [attr]: { value: string, myInfo?: { attr } } } } }`. One entry per child.                                                                                  |

Answers are stored as the respondent typed them. Trim whitespace yourself if your system needs it.

Example: read an address and a checkbox.

```javascript
const OTHERS = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

const address = submission.responses[ADDRESS_FIELD]?.answer
const postalCode = address?.postalCode.value

const checkbox = submission.responses[INTERESTS_FIELD]?.answer
const interests = (checkbox?.value ?? []).map((v) =>
  v === OTHERS ? checkbox.othersInput : v
)
```

### Question text

`response.question` holds the field title that the respondent saw. The SDK fills it in from `data.formFields` in the payload. Use the field ID, not the question text, to identify a field: an admin can edit a title at any time.

### Other properties

- `provenance` is always present. Today it is usually `{}`. On Myinfo children fields, `provenance.myinfoVerified` is `true` when FormSG checked the answer against Myinfo.
- `myInfo` is `{ attr }` when the field was prefilled from Myinfo.

## Handle multi-step workflows

A form can have a workflow with several steps, where different respondents fill in different fields. FormSG sends a webhook **after each step**.

Each delivery for the same submission:

- has the same `data.submissionId`;
- has `data.workflowContent.workflowStep` set to the step that was just completed, counting from `0`;
- contains **all** answers so far, not only the answers from that step.

```json
"workflowContent": {
  "workflowStep": 1,
  "workflow": [ { "_id": "...", "workflow_type": "static", "edit": ["<fieldId>"] }, "..." ],
  "submittedSteps": [
    { "isApproval": false, "submittedAt": "2026-10-01T03:00:00.000Z" },
    { "isApproval": true, "status": "APPROVED", "submittedAt": "2026-10-02T08:15:00.000Z" }
  ]
}
```

To process each step once, store the pair `(submissionId, workflowStep)` and skip a delivery you have already seen. To act only on the final result, check whether `workflowStep` is the last index of `workflow`, or check the approval `status` in `submittedSteps`.

## Download attachments

To download and decrypt uploaded files as well as the answers, call `decryptWithAttachments`:

```javascript
const result = await formsg.cryptoV4.decryptWithAttachments(
  formSecretKey,
  req.body.data
)

if (result) {
  const { content, attachments } = result
  for (const [fieldId, file] of Object.entries(attachments)) {
    // file.filename: string, file.content: Uint8Array
    await fs.promises.writeFile(
      path.join(UPLOAD_DIR, file.filename),
      file.content
    )
  }
}
```

- The download URLs in the payload expire **one hour** after FormSG sends the webhook. Call `decryptWithAttachments` within that hour.
- If any file fails to download or decrypt, the whole call returns `null`.
- `answer.hasBeenScanned` tells you whether FormSG scanned the file. Treat every file as untrusted input anyway.
- Use `path.basename` or your own naming scheme before you write `file.filename` to disk. The respondent chose the filename.

## Read verified Singpass and Corppass data

If the form collects the respondent's identity through Singpass or Corppass, `submission.verified` holds the values that FormSG signed. The SDK checks the signature for you and returns `null` if the check fails.

Keys carry the step that collected them:

```json
{ "uinFin (Step 1)": "S1234567D", "cpUen (Step 2)": "201912345A" }
```

Use `verified`, not the matching entry in `responses`, when you need a value that the respondent could not have edited.

## Run a reliable endpoint

**Respond within 10 seconds.** FormSG waits 10 seconds, follows no redirects, and counts only a `2xx` status as success. Queue slow work and respond first.

**Turn on retries.** In **Settings > Webhooks**, turn on **Enable retries**. FormSG then retries a failed delivery up to 6 more times over about 24 hours, at roughly 5 minutes, 1, 2, 4, 8, and 20 hours after the first attempt. Each retry has a new signature and new attachment URLs.

**Expect duplicates and out-of-order deliveries.** A retry can arrive after a later step's delivery. Use `(submissionId, workflowStep)` to drop duplicates, and use `workflowStep` to tell which delivery is newer.

**Check the form ID.** If one endpoint serves several forms, read `data.formId` and pick the matching secret key. Reject form IDs you do not expect.

**Keep your secret key secret.** Anyone with it can read every submission to the form. FormSG cannot recover a lost key.

## Reference

### SDK setup

```javascript
const formsg = require('@opengovsg/formsg-sdk')({ mode: 'production' })
// or: import formsgSdk from '@opengovsg/formsg-sdk'
```

| Option | Default        | Description                                          |
| ------ | -------------- | ---------------------------------------------------- |
| `mode` | `'production'` | Set to `'staging'` to integrate with FormSG staging. |

The returned object has these modules:

| Module     | Use it to                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------- |
| `webhooks` | Check the `X-FormSG-Signature` header.                                                       |
| `cryptoV4` | Decrypt V4 payloads.                                                                         |
| `crypto`   | Decrypt [legacy V1](./docs/legacy-v1.md) payloads.                                           |
| `cryptoV3` | Decrypt pre-2026 multi-respondent payloads (`version: 3`). Most integrations do not need it. |

### `webhooks.authenticate(header, uri)`

Throws `WebhookAuthenticateError` if the signature is invalid or more than 5 minutes old. Returns nothing on success.

### `cryptoV4.decrypt(formSecretKey, data)`

| Parameter       | Type              | Description                    |
| --------------- | ----------------- | ------------------------------ |
| `formSecretKey` | `string`          | The form's base64 secret key.  |
| `data`          | `DecryptParamsV4` | `req.body.data`, passed as is. |

Returns `DecryptedContentV4 | null`. Returns `null` if the key is wrong, the payload is not V4-compatible, or the verified-content signature is invalid.

### `cryptoV4.decryptWithAttachments(formSecretKey, data)`

Returns `Promise<{ content: DecryptedContentV4, attachments: Record<fieldId, { filename: string, content: Uint8Array }> } | null>`.

### Webhook request

FormSG sends a `POST` with the header `X-FormSG-Signature` and a JSON body of the form `{ "data": { ... } }`.

| Key in `data`                  | Type                            | Description                                                                                                             |
| ------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `formId`                       | string                          | The form ID.                                                                                                            |
| `submissionId`                 | string                          | The submission ID. Shown to respondents as **Response ID**. The same across all steps of a workflow.                    |
| `version`                      | number                          | `4`.                                                                                                                    |
| `created`                      | string                          | ISO 8601 creation time of the submission.                                                                               |
| `encryptedContent`             | string                          | The encrypted responses.                                                                                                |
| `encryptedSubmissionSecretKey` | string                          | The submission key, encrypted with the form key.                                                                        |
| `verifiedContent`              | string                          | Optional. The encrypted, signed Singpass or Corppass data.                                                              |
| `formFields`                   | `Record<fieldId, { question }>` | The field titles at submission time. The SDK uses these to fill in `question`.                                          |
| `attachmentDownloadUrls`       | `Record<fieldId, string>`       | URLs of encrypted attachments. Valid for one hour. `{}` if there are none.                                              |
| `paymentContent`               | object                          | Payment details. `{}` if the form has no payment. See [payment content](./docs/legacy-v1.md#format-of-payment-content). |
| `workflowContent`              | object                          | `{ workflow, workflowStep, submittedSteps }`. See [Handle multi-step workflows](#handle-multi-step-workflows).          |

### TypeScript types

The package exports types for every shape in this guide, including `DecryptedContentV4`, `FieldResponsesV4`, `FormFieldV4`, `AnswerV4`, and one type per answer shape, such as `AddressAnswerV4` and `TableAnswerV4`.

## Verify signatures without the SDK

We recommend the SDK. If you cannot use it, you can check the signature yourself.

The `X-FormSG-Signature` header looks like this. It is one line. The line breaks below are for clarity.

```text
X-FormSG-Signature: t=1582558358788,
  s=5e53ec96b10ee1010e00380b,
  f=5e4b8e3d1f61f00036c9937d,
  v1=rUAgQ9krNZspCrQtfSvRfjME6Nq4+I80apGXnCsNrwPbcq44SBNglWtA1MkpC/VhWtDeJfuV89uV2Aqi42UQBA==
```

`t` is the epoch time in milliseconds, `s` is the submission ID, and `f` is the form ID. `v1` is the signature. The `v1` label names the signature scheme. It is not related to the V1 payload format.

1. Split the header on `,`, then split each element on the first `=`.
2. Join the endpoint URL ([href](https://nodejs.org/api/url.html#url_url_href)), the submission ID, the form ID, and the epoch with `.`:

   ```text
   https://my-domain.com/submissions.5e53ec96b10ee1010e00380b.5e4b8e3d1f61f00036c9937d.1582558358788
   ```

3. Verify the `v1` value as an [ed25519](http://ed25519.cr.yp.to/) signature of that string, with the public key for your environment:

   | FormSG environment | Public key (base64)                            |
   | ------------------ | ---------------------------------------------- |
   | production         | `3Tt8VduXsjjd4IrpdCd7BAkdZl/vUCstu9UvTX84FWw=` |
   | staging            | `rjv41kYqZwcbe3r6ymMEEKQ+Vd+DPuogN+Gzq3lP2Og=` |

4. Reject the request if the epoch is more than 5 minutes old.
5. Check that the form ID is one you expect.

### Encryption

FormSG encrypts submissions end to end. FormSG servers cannot read submission data. The cryptosystem is `x25519-xsalsa20-poly1305`, implemented by [tweetnacl-js](https://github.com/dchest/tweetnacl-js), which [Cure53 audited](https://cure53.de/tweetnacl.pdf).

In V4, each submission has its own key pair. FormSG encrypts the answers and attachments with the submission key, then encrypts the submission secret key with your form's public key. Your form secret key unlocks the submission key, and the submission key unlocks the data.

## Legacy V1 webhooks

V1 is the format that `formsg.crypto.decrypt` reads. It is still supported, but new integrations should use V4.

- [Migrating from V1 to V4](./docs/migrating-from-v1.md): what changes and how to switch without downtime.
- [Legacy V1 webhook reference](./docs/legacy-v1.md): the V1 payload, decryption API, and field formats.

## About this package

This package used to live at [`opengovsg/formsg-javascript-sdk`](https://github.com/opengovsg/formsg-javascript-sdk). It is now developed in the FormSG monorepo under [`packages/sdk`](./) and published to npm as [`@opengovsg/formsg-sdk`](https://www.npmjs.com/package/@opengovsg/formsg-sdk).
