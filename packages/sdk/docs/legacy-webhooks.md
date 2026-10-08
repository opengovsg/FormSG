# Legacy webhook reference

> FormSG still delivers legacy webhooks, but new integrations should use the [latest format](../README.md). If you receive legacy webhooks today, read [Migrating to the latest webhooks](./migrating-to-latest.md).

This page describes the legacy payload and the `formsg.crypto` module that decrypts it. Authentication is the same for legacy and latest webhooks. See [the README](../README.md#quickstart-receive-your-first-submission).

## Which forms send legacy webhooks

- Legacy forms (previously known as Storage mode forms). These forms always send legacy webhooks.
- Forms with **Use legacy webhooks** turned on in **Settings > Webhooks**. Legacy webhooks work only on forms whose workflow has at most one step.

A legacy payload has `data.version` set to `2.1`, and has no `encryptedSubmissionSecretKey`.

## Decrypt a legacy submission

```javascript
const formsg = require('@opengovsg/formsg-sdk')()

// Without attachments
const submission = formsg.crypto.decrypt(formSecretKey, req.body.data)

// With attachments
const result = await formsg.crypto.decryptWithAttachments(
  formSecretKey,
  req.body.data
)
```

Both return `null` if decryption or validation fails.

## Format of the webhook request

| Key                      | Type                     | Description                                                                                                  |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `formId`                 | string                   | The form ID.                                                                                                 |
| `submissionId`           | string                   | The submission ID, shown to respondents as **Response ID**.                                                  |
| `encryptedContent`       | string                   | The encrypted submission in base64.                                                                          |
| `verifiedContent`        | string                   | Optional. The encrypted, signed Singpass or Corppass data.                                                   |
| `version`                | number                   | `2.1`.                                                                                                       |
| `created`                | string                   | Creation timestamp.                                                                                          |
| `attachmentDownloadUrls` | `Record<string, string>` | Field IDs mapped to URLs of encrypted attachments.                                                           |
| `paymentContent`         | `Record<string, string>` | Payment details for forms with payments. `{}` otherwise. The deprecated Fixed Payment type is not supported. |

## Format of decrypted submissions

`formsg.crypto.decrypt(formSecretKey, decryptParams)` returns:

```typescript
{
  responses: FormField[] // see src/types.ts
  verified?: Record<string, any>
}
```

`responses` is an array in form order. Each entry has this shape:

| Key           | Type                       | Description                                                                  |
| ------------- | -------------------------- | ---------------------------------------------------------------------------- |
| `question`    | string                     | The question on the form. Read-only Myinfo questions start with `[Myinfo] `. |
| `answer`      | string                     | The answer. Either this key or `answerArray` exists.                         |
| `answerArray` | `string[]` or `string[][]` | The answer, for checkbox, table, address, and signature fields.              |
| `fieldType`   | string                     | The field type.                                                              |
| `_id`         | string                     | The field ID. It changes when a field is deleted and added again.            |

Legacy entries can also carry `isHeader`, `isUserVerified`, `isVisible`, `signature`, and `myInfo`. FormSG may add internal fields from time to time. Do not reject a webhook because it has keys you do not expect.

`decrypt` [validates](../src/util/validate.ts) the decrypted content and returns `null` if any entry lacks the keys above.

If `verifiedContent` exists, the SDK decrypts it, checks its signature with the FormSG signing key in [`signing-keys.ts`](../src/resource/signing-keys.ts), and returns the result as `verified`. **If the check fails, `decrypt` returns `null`, even when `encryptedContent` decrypted correctly.** Keys in `verified` are flat, such as `uinFin` and `cpUen`.

### Field formats

| Field type       | Legacy representation                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Most text fields | `answer: "text"`, trimmed.                                                                                         |
| `date`           | `answer: "09 Sep 2026"`.                                                                                           |
| `radiobutton`    | `answer: "Option"`, or `answer: "Others: <text>"`.                                                                 |
| `checkbox`       | `answerArray: ["a", "b", "Others: <text>"]`.                                                                       |
| `table`          | `answerArray: [["row1col1", "row1col2"], ...]`. `question` is `"Title (Col A, Col B)"`.                            |
| `address`        | `answerArray: [blockNumber, streetName, buildingName, levelNumber, unitNumber, postalCode]`, always in this order. |
| `signature`      | `answerArray: ["draw", "<JSON of strokes>"]`.                                                                      |
| `section`        | `answer: ""`, `isHeader: true`.                                                                                    |

Unanswered fields appear with `answer: ""` or an empty `answerArray`.

## Process attachments

`formsg.crypto.decryptWithAttachments(formSecretKey, decryptParams)` returns `Promise<DecryptedContentAndAttachments | null>`:

- `content`: the same value that `decrypt` returns.
- `attachments`: field IDs mapped to `{ filename, content: Uint8Array }`.

The call returns `null` if any file fails to decrypt, or if the attachments and the submission do not match.

Attachment URLs expire **one hour** after FormSG sends the webhook. Treat every file as untrusted input.

## Format of payment content

Legacy and latest webhooks share the same `data.paymentContent` format. See [Payment content in the SDK reference](../README.md#payment-content).
