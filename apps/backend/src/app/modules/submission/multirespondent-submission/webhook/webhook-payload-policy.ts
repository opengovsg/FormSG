// 'v1' is unused: no policy input yields it, pending the S6 (#9746) rescope.
export type WebhookContentFormat = 'v1' | 'v3' | 'v4'

export type WebhookConsumerType = 'plumber' | 'generic'

export interface WebhookPayloadPolicyInput {
  webhookType: WebhookConsumerType
  isStepWriteTokenEnabled: boolean
  submissionIndex: number
  submittedStepsLength: number
}

export interface WebhookPayloadPolicy {
  contentFormat: WebhookContentFormat
  includeEncryptedSubmissionSecretKey: boolean
  includeEncryptedStepToken: boolean
}

export const getWebhookPayloadPolicy = ({
  webhookType,
  isStepWriteTokenEnabled,
  submissionIndex,
  submittedStepsLength,
}: WebhookPayloadPolicyInput): WebhookPayloadPolicy => {
  const contentFormat: WebhookContentFormat = isStepWriteTokenEnabled
    ? 'v4'
    : 'v3'

  const includeEncryptedSubmissionSecretKey = contentFormat === 'v4'

  const includeEncryptedStepToken =
    contentFormat === 'v4' &&
    webhookType === 'plumber' &&
    submissionIndex === submittedStepsLength - 1

  return {
    contentFormat,
    includeEncryptedSubmissionSecretKey,
    includeEncryptedStepToken,
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
