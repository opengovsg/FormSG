# V4 webhook consumer guide

**Draft for human review before publication** (issue #10179). Derived from #10172 PIN-G04/PIN-G07b and the SDK README.

A **Webhook format** is the payload your consumer receives, separate from the content version stored on a submission. A **Generic consumer** is any non-Plumber endpoint, including Zapier.

## Choosing a webhook format

When the rollout is enabled, new multirespondent (MRF) webhook setups default to the **V4 webhook**. In Settings → Webhooks, leave **Use legacy webhooks** off for V4. You can choose the format before entering a URL; the toggle saves immediately. Plumber always receives V4 and has no format toggle.

Turn **Use legacy webhooks** on if your consumer expects a storage-mode-compatible **Legacy (V1) webhook**. Legacy only works with forms that have at most one workflow step. Reduce the workflow to one step before selecting it. A storage-mode integration pasted into a new MRF form receives V4 by default after rollout; its V1 decrypt function cannot decrypt that envelope. Choose legacy before connecting it, or update the consumer. Storage-mode forms themselves are unchanged.

A saved choice survives URL edits and clearing the URL. Turning the rollout flag off does not change saved V4 choices. Such forms can still switch to legacy; the toggle then disappears until rollout is enabled again.

## Receiving and decrypting V4

Use SDK 8.2.0 or later. Verify `X-FormSG-Signature` using `sdk.webhooks.authenticate` and your configured endpoint URL before processing the body, following the [SDK authentication example](../packages/sdk/README.md#webhook-authentication-and-decrypting-submissions). Branch on `data.version === 4`.

Generic V4 consumers receive the same envelope as Plumber: encrypted cumulative answers, the submission secret key wrapped under the form public key, workflow metadata (`workflow`, `workflowStep`, and projected `submittedSteps`), attachment download URLs and any payment information. No step token is included, so receiving a webhook does not grant permission to advance the workflow.

For answers alone, use `cryptoV3.decryptToV4(formSecretKey, data, {})`. For answers and attachments, use `cryptoV3.decryptWithAttachments(formSecretKey, data)`. The latter returns `{ content, attachments }`, with original filenames and decrypted `Uint8Array` bytes. The wrapped key is unwrapped automatically. Handle a `null` result as failure; download and attachment decryption failures also return `null`, like the V1 helper.

This code is copied from the [CI-run SDK example](../packages/sdk/examples/v4-webhook.ts). Use that file for its imports and type declarations. Pass your initialized SDK as `sdk`.

```typescript
// Call after authenticating the webhook signature with sdk.webhooks.authenticate.
export async function decryptWebhook(
  sdk: Sdk,
  formSecretKey: string,
  data: WebhookData
) {
  if (data.version === 4) {
    if (!('encryptedSubmissionSecretKey' in data) || !data.workflowContent) {
      throw new Error('Incomplete V4 webhook')
    }
    const submission = await sdk.cryptoV3.decryptWithAttachments(
      formSecretKey,
      data
    )
    if (!submission) throw new Error('Unable to decrypt V4 webhook')
    const { workflowStep, submittedSteps } = data.workflowContent
    // A submission has multiple deliveries. Retries of one delivery share this key.
    const deliveryKey = `${data.submissionId}:${submittedSteps.length - 1}:${workflowStep}`
    return { deliveryKey, submission }
  }
  const submission = await sdk.crypto.decryptWithAttachments(
    formSecretKey,
    data
  )
  if (!submission) throw new Error('Unable to decrypt legacy webhook')
  return { deliveryKey: data.submissionId, submission }
}
```

## Deliveries, retries and deduplication

V4 delivers once per workflow step, with cumulative content, so later deliveries include earlier answers as well as the new step's answers. Retain answer provenance when processing changes. Use `submissionId` together with the workflow metadata to identify a delivery; the example uses the submitted-step index and `workflowStep`. Deduplicating on submission ID alone would discard later steps.

Persist the delivery key and processing result atomically, and acknowledge only once your system has durably accepted the delivery. Repeated delivery of the same key should be harmless. A retry replays its original payload format to the currently configured URL, even if the form's format has since changed. A consumer handling a format transition should accept both branches while queued retries drain.

If a V4 workflow is reduced to one step and switched to legacy, later steps of submissions that began with the old multi-step workflow stop delivering. Legacy cannot represent those workflows.
