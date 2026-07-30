/**
 * M4 — send-time payload policy (pure, I/O-free).
 *
 * The single place any webhook decision branches on the consumer URL/type.
 * Given the consumer and the step's position, it returns what the payload
 * should contain. No AWS / mongoose / config / network imports — TS types only.
 */

export type WebhookContentShape = 'v1' | 'v4'

// Note: 'zapier' is folded into 'generic' by the caller before it reaches
// this module, so the type intentionally only accepts 'plumber' | 'generic'.
export type WebhookConsumerType = 'plumber' | 'generic'

export interface WebhookPayloadPolicyInput {
  webhookType: WebhookConsumerType
  // plumber is forced 'v4' by the rules below regardless of this value.
  webhookFormat: 'v1' | 'v4'
  submissionIndex: number
  submittedStepsLength: number
}

export interface WebhookPayloadPolicy {
  contentShape: WebhookContentShape
  // encryptedSubmissionSecretKey — included on EVERY v4 delivery, all steps.
  includeEncryptedSubmissionSecretKey: boolean
  includeEncryptedStepToken: boolean
}

export const getWebhookPayloadPolicy = ({
  webhookType,
  webhookFormat,
  submissionIndex,
  submittedStepsLength,
}: WebhookPayloadPolicyInput): WebhookPayloadPolicy => {
  const contentShape: WebhookContentShape =
    webhookType === 'plumber' ? 'v4' : webhookFormat

  const includeEncryptedSubmissionSecretKey = contentShape === 'v4'

  const includeEncryptedStepToken =
    contentShape === 'v4' &&
    webhookType === 'plumber' &&
    submissionIndex === submittedStepsLength - 1

  return {
    contentShape,
    includeEncryptedSubmissionSecretKey,
    includeEncryptedStepToken,
  }
}

/**
 * Single source of truth mapping content shape to submission version, used by
 * reconstruction later.
 */
export const contentShapeToSubmissionVersion = (
  shape: WebhookContentShape,
): number => (shape === 'v4' ? 3 : 2.1)
