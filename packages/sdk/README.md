_Please note that this is an SDK for webhooks integration, and_ **_not_** _the FormSG system._

# FormSG JavaScript SDK

This SDK provides convenient utilities for verifying FormSG webhooks and decrypting submissions in JavaScript and Node.js.

This package used to live at [`opengovsg/formsg-javascript-sdk`](https://github.com/opengovsg/formsg-javascript-sdk) and is now developed in the main FormSG monorepo under [`packages/sdk`](./). It is still published to npm as [`@opengovsg/formsg-sdk`](https://www.npmjs.com/package/@opengovsg/formsg-sdk); starting with this migration the major version is bumped to `v7` to track the FormSG monorepo.

Not using JavaScript? Check out our sister SDKs:
- [formsg-python-sdk](https://github.com/opengovsg/formsg-python-sdk)

## Installation

Install the package with

```bash
npm install @opengovsg/formsg-sdk --save
```

## Configuration

```javascript
const formsg = require('@opengovsg/formsg-sdk')({
  mode: 'production',
})
```

| Option | Default      | Description                                                     |
| ------ | ------------ | --------------------------------------------------------------- |
| mode   | 'production' | Set to 'staging' if integrating against FormSG staging servers. |

## Usage

### Webhook Authentication and Decrypting Submissions

```javascript
// This example uses Express to receive webhooks
const express = require('express')
const app = express()

// Instantiating formsg-sdk without parameters default to using the package's
// production public signing key.
const formsg = require('@opengovsg/formsg-sdk')()

// This is where your domain is hosted, and should match
// the URI supplied to FormSG in the form dashboard
const POST_URI = 'https://my-domain.com/submissions'

// Your form's secret key downloaded from FormSG upon form creation
const formSecretKey = process.env.FORM_SECRET_KEY

// Set to true if you need to download and decrypt attachments from submissions
const HAS_ATTACHMENTS = false

app.post(
  '/submissions',
  // Endpoint authentication by verifying signatures
  function (req, res, next) {
    try {
      formsg.webhooks.authenticate(req.get('X-FormSG-Signature'), POST_URI)
      // Continue processing the POST body
      return next()
    } catch (e) {
      return res.status(401).send({ message: 'Unauthorized' })
    }
  },
  // Parse JSON from raw request body
  express.json(),
  // Decrypt the submission
  async function (req, res, next) {
    // If `verifiedContent` is provided in `req.body.data`, the return object
    // will include a verified key.
    const submission = HAS_ATTACHMENTS
      ? await formsg.crypto.decryptWithAttachments(formSecretKey, req.body.data)
      : formsg.crypto.decrypt(formSecretKey, req.body.data)

    // If the decryption failed, submission will be `null`.
    if (submission) {
      // Continue processing the submission
    } else {
      // Could not decrypt the submission
    }
  }
)

app.listen(8080, () => console.log('Running on port 8080'))
```

## End-to-end Encryption

FormSG uses _end-to-end encryption_ with _elliptic curve cryptography_ to protect submission data and ensure only intended recipients are able to view form submissions. As such, FormSG servers are unable to access the data.

The underlying cryptosystem is `x25519-xsalsa20-poly1305` which is implemented by the [tweetnacl-js](https://github.com/dchest/tweetnacl-js) library. Its source code has been [audited](https://cure53.de/tweetnacl.pdf)) by [Cure53](https://cure53.de/).

### Format of Submission Response

| Key                    | Type                   | Description                                                                                              |
| ---------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| formId                 | string                 | Unique form identifier.                                                                                  |
| submissionId           | string                 | Unique response identifier, displayed as 'Response ID' to form respondents                               |
| encryptedContent       | string                 | The encrypted submission in base64.                                                                      |
| created                | string                 | Creation timestamp.                                                                                      |
| attachmentDownloadUrls | Record<string, string> | (Optional) Records containing field IDs and URLs where encrypted uploaded attachments can be downloaded. |
| paymentContent         | Record<string, string> | (Optional) Records containing payment details for forms with payments[1]                                 |

[1] Forms with the deprecated Fixed Payment Type is not supported

### Format of Decrypted Submissions

`formsg.crypto.decrypt(formSecretKey: string, decryptParams: DecryptParams)`
takes in `decryptParams` as the second argument, and returns an an object with
the shape

<pre>
{
  responses: <a href="./src/types.ts">FormField</a>[]
  verified?: <a href="https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkt">Record&lt;string, any&gt;</a>
}
</pre>

encryptedContent: EncryptedContent
version: number
verifiedContent?: EncryptedContent

The `decryptParams.encryptedContent` field decrypts into an array of `FormField` objects, which will be assigned to the `responses` key of the returned object.

Furthermore, if `decryptParams.verifiedContent` exists, the function will
decrypt and open the signed decrypted content with the package's own
`signingPublicKey` in
[`signing-keys.ts`](./src/resource/signing-keys.ts).
The resulting decrypted verifiedContent will be assigned to the `verified` key
of the returned object.

> **Note:** <br>
> If any errors occur, either from the failure to decrypt either `encryptedContent` or `verifiedContent`, or the failure to authenticate the decrypted signed message in `verifiedContent`, `null` will be returned.

Note that due to end-to-end encryption, FormSG servers are unable to verify the data format.

However, the `decrypt` function exposed by this library [validates](./src/util/validate.ts) the decrypted content and will **return `null` if the
decrypted content does not contain all of the fields displayed in the schema below.**

| Key         | Type     | Description                                                                                              |
| ----------- | -------- | -------------------------------------------------------------------------------------------------------- |
| question    | string   | The question listed on the form                                                                          |
| answer      | string   | The submitter's answer to the question on form. Either this key or `answerArray` must exist.             |
| answerArray | string[] | The submitter's answer to the question on form. Either this key or `answer` must exist.                  |
| fieldType   | string   | The type of field for the question.                                                                      |
| \_id        | string   | A unique identifier of the form field. WARNING: Changes when new fields are created/removed in the form. |

> **Note:** <br>
> Additional internal fields may be included in webhooks from time to time, which will then be published as part of our official schema once it is stable for public consumption. If you are applying your own validation, you should account for this e.g. by not rejecting the webhook if there are additional fields included.

The full schema can be viewed in
[`validate.ts`](./src/util/validate.ts).

If the decrypted content is the correct shape, then:

1. the decrypted content (from `decryptParams.encryptedContent`) will be set as the value of the `responses` key.
2. if `decryptParams.verifiedContent` exists, then an attempt to
   decrypted the verified content will be called, and the result set as the
   value of `verified` key. There is no shape validation for the decrypted
   verified content. **If the verification fails, `null` is returned, even if
   `decryptParams.encryptedContent` was successfully decrypted.**

### Processing Attachments

`formsg.crypto.decryptWithAttachments(formSecretKey: string, decryptParams: DecryptParams)` (available from version 0.9.0 onwards) behaves similarly except it will return a `Promise<DecryptedContentAndAttachments | null>`.

`DecryptedContentAndAttachments` is an object containing two fields:

- `content`: the standard form decrypted responses (same as the return type of `formsg.crypto.decrypt`)
- `attachments`: A `Record<string, DecryptedFile>` containing a map of field ids of the attachment fields to a object containing the original user supplied filename and a `Uint8Array` containing the contents of the uploaded file.

If the contents of any file fails to decrypt or there is a mismatch between the attachments and submission (e.g. the submission doesn't contain the original file name), then `null` will be returned.

Attachments are downloaded using S3 pre-signed URLs, with a expiry time of _one hour_. You must call `decryptWithAttachments` within this time window, or else the URL to the encrypted files will become invalid.

Attachments are end-to-end encrypted in the same way as normal form submissions, so any eavesdropper will not be able to view form attachments without your secret key.

_Warning:_ We do not have the ability to scan any attachments for malicious content (e.g. spyware or viruses), so careful handling is needed.

### Processing Local address fields

Address Field is a compound field with 6 inputs in the answerArray. It will always follow the ordinance of [`blockNumber`, `streetName`, `buildingName`, `levelNumber`, `unitNumber`, `postalCode`]

### Format of Payment Content

These fields will be available if the submission is a payment submission, otherwise, the value will be an empty `{}`.

| Key            | Type             | Description                                      |
| -------------- | ---------------- | ------------------------------------------------ |
| type           | 'payment_charge' | Payment event associated with this webhook       |
| status         | string           | Status of the payment intent                     |
| payer          | string           | The email associated with this email             |
| url            | string           | The url of the proof of payment for this payment |
| paymentIntent  | string           | The payment intent associated with this payment  |
| amount         | string           | The amount charged to the user                   |
| productService | string           | The product or service name of the payment       |
| dateTime       | string           | The time of which this payment was transacted    |
| transactionFee | string           | The fees charged for this transaction            |



## Verifying Signatures Manually

You can use the following information to create a custom solution, although we recommend using this SDK.

The `X-FormSG-Signature` header contains the following information:

- Epoch timestamp prefixed by `t=`
- The FormSG submission ID prefixed by `s=`
- The FormSG form ID, prefixed by `f=`
- The signature scheme, prefixed by `v1=`. Currently this is the only signature scheme.

```text
X-FormSG-Signature: t=1582558358788,
  s=5e53ec96b10ee1010e00380b,
  f=5e4b8e3d1f61f00036c9937d,
  v1=rUAgQ9krNZspCrQtfSvRfjME6Nq4+I80apGXnCsNrwPbcq44SBNglWtA1MkpC/VhWtDeJfuV89uV2Aqi42UQBA==
```

Note that newlines have been added for clarity, but a real signature will be all in one line.

### Steps

#### Step 1 - Extract the key-value pairs from the header

Extract the the timestamp, signature, submission ID and form ID from the header, by using the `,` character as
a separator to get a list of elements, before splitting each element to get a key-value pair.

#### Step 2 - Prepare the basestring

This is achieved by concatenating the following strings with the `.` fullstop as the delimiter.

- The [href](https://nodejs.org/api/url.html#url_url_href) of the URI
- The submission ID
- The form ID
- The epoch timestamp

```text
https://my-domain.com/submissions.5e53ec96b10ee1010e00380b.5e4b8e3d1f61f00036c9937d.1582558358788
```

#### Step 3 - Verify the signature

The signature is signed with [ed25519](http://ed25519.cr.yp.to/).

Verify that the `v1` signature is valid using a library of your choice (we use [tweetnacl-js](https://github.com/dchest/tweetnacl-js)).

| FormSG environment | Public Key in base64                           |
| ------------------ | ---------------------------------------------- |
| production         | '3Tt8VduXsjjd4IrpdCd7BAkdZl/vUCstu9UvTX84FWw=' |
| staging            | 'rjv41kYqZwcbe3r6ymMEEKQ+Vd+DPuogN+Gzq3lP2Og=' |

#### Step 4 - Protect against replay attacks

If the signature is valid, compute the difference between the current timestamp and the received epoch,
and decide if the difference is within your tolerance. We use a tolerance of 5 minutes.

#### Additional Checks

- Check that request is for an expected form by verifying the form ID
- Check that the submission ID is new, and that your system has not received it before
