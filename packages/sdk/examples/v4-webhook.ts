import type createFormsg from '../src'
import type { DecryptParams, DecryptParamsV4 } from '../src'

type Sdk = ReturnType<typeof createFormsg>
type WebhookData = (DecryptParams | DecryptParamsV4) & {
  submissionId: string
  workflowContent?: {
    workflowStep: number
    submittedSteps: unknown[]
  }
}

// BEGIN CONSUMER SAMPLE
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
// END CONSUMER SAMPLE
