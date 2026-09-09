// 'v1' is unused: no policy input yields it, pending the S6 (#9746) rescope.
export type WebhookContentFormat = 'v1' | 'v3' | 'v4'

// This is not the same as WebhookType, this is the classes of webhook consumers (ie, internal or external)
export type WebhookConsumerType = 'plumber' | 'generic'

export interface WebhookPayloadPolicyInput {
  webhookType: WebhookConsumerType
  submissionIndex: number
  submittedStepsLength: number
}

export interface KeyPermissionsPolicy {
  includeEncryptedSubmissionSecretKey: boolean
}
export interface WebhookPayloadPolicy extends KeyPermissionsPolicy {
  contentFormat: WebhookContentFormat
}

/**
 * The wrapped submission secret key is the only key permission a consumer
 * reads (see `webhook-reconstruction.ts`). A V4 payload's content is encrypted
 * under the per-submission public key, so without the wrapped key the payload
 * cannot be opened at all; a V3 or V1 payload has no use for it. Hence the
 * permission is a function of the content format alone.
 *
 * `webhookType`, `submissionIndex` and `submittedStepsLength` stay in the
 * input because callers resolve them anyway and a future key permission may
 * need them; none of them may reintroduce a gate on the wrapped key, which a
 * generic consumer on the V4 shape needs just as much as plumber does.
 */
export const getKeyPermissionsPolicy = ({
  contentFormat,
}: {
  webhookType: WebhookConsumerType
  submissionIndex: number
  submittedStepsLength: number
  contentFormat: WebhookContentFormat
}): Omit<WebhookPayloadPolicy, 'contentFormat'> => {
  return {
    includeEncryptedSubmissionSecretKey: contentFormat === 'v4',
  }
}

export const getWebhookPayloadPolicy = ({
  webhookType,
  submissionIndex,
  submittedStepsLength,
}: WebhookPayloadPolicyInput): WebhookPayloadPolicy => {
  // Every consumer resolves to V4. The two-value resolution driven by consumer
  // type arrives with the V1 backward-compatible shape in #9975.
  const contentFormat: WebhookContentFormat = 'v4'

  const keyPermissionsPolicy = getKeyPermissionsPolicy({
    webhookType,
    submissionIndex,
    submittedStepsLength,
    contentFormat,
  })

  return {
    contentFormat,
    ...keyPermissionsPolicy,
  }
}

export type WebhookVersion = 2.1 | 3 | 4

export const contentFormatToWebhookVersion = (
  shape: WebhookContentFormat,
): WebhookVersion => {
  switch (shape) {
    case 'v4':
      return 4
    case 'v3':
      return 3
    case 'v1':
      return 2.1
  }
}

export const mrfVersionToContentFormat = (
  mrfVersion: number,
): WebhookContentFormat => (mrfVersion === 2 ? 'v4' : 'v3')
