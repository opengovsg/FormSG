// 'v1' is unused: no policy input yields it, pending the S6 (#9746) rescope.
export type WebhookContentFormat = 'v1' | 'v3' | 'v4'

// This is not the same as WebhookType, this is the classes of webhook consumers (ie, internal or external)
export type WebhookConsumerType = 'plumber' | 'generic'

export interface WebhookPayloadPolicyInput {
  webhookType: WebhookConsumerType
  isStepWriteTokenEnabled: boolean
  submissionIndex: number
  submittedStepsLength: number
}

export interface KeyPermissionsPolicy {
  includeEncryptedSubmissionSecretKey: boolean
  includeEncryptedStepToken: boolean
}
export interface WebhookPayloadPolicy extends KeyPermissionsPolicy {
  contentFormat: WebhookContentFormat
}

export const getKeyPermissionsPolicy = ({
  webhookType,
  submissionIndex,
  submittedStepsLength,
  contentFormat,
}: {
  webhookType: WebhookConsumerType
  submissionIndex: number
  submittedStepsLength: number
  contentFormat: WebhookContentFormat
}): Omit<WebhookPayloadPolicy, 'contentFormat'> => {
  const isLatestStep = submissionIndex === submittedStepsLength - 1
  return {
    includeEncryptedSubmissionSecretKey: contentFormat === 'v4',
    includeEncryptedStepToken: webhookType === 'plumber' && isLatestStep,
  }
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
