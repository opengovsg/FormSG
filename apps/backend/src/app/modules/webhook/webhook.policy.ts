import { ContentFormat } from '../../../types/submission_history'

export type WebhookType = 'zapier' | 'plumber' | 'generic'

/**
 * The send-time payload policy for an MRF webhook. The single place the
 * two-dimension privileged-consumer decision lives; nothing else should
 * branch on the webhook URL.
 */
export type WebhookPayloadPolicy = {
  /**
   * Shape of the form-key content copy: 'v4' (native answer objects) for
   * privileged consumers, 'v1' (classic FormField[]) for everyone else.
   */
  contentShape: ContentFormat
  /**
   * Whether to additively attach the wrapped submission secret key (a
   * write/advance credential, never required to read). Decided at send time,
   * never persisted.
   */
  includeSecretKey: boolean
}

/**
 * Derives the MRF webhook payload policy from the webhook type and the step's
 * position. Pure: the same inputs always yield the same decision.
 *
 * @param webhookType classification of the form's webhook URL
 * @param submissionIndex zero-based position of this step in the order submitted
 * @param submittedStepsLength number of steps submitted so far on the live row
 */
export const getWebhookPayloadPolicy = ({
  webhookType,
  submissionIndex,
  submittedStepsLength,
}: {
  webhookType: WebhookType
  submissionIndex: number
  submittedStepsLength: number
}): WebhookPayloadPolicy => {
  const isPrivileged = webhookType === 'plumber'
  const isLatestStep = submissionIndex === submittedStepsLength - 1

  return {
    contentShape: isPrivileged ? 'v4' : 'v1',
    includeSecretKey: isPrivileged && isLatestStep,
  }
}

/**
 * The MRF webhook send gate: a webhook fires iff the submission is V4-encrypted
 * (so every consumer can parse it) or the consumer is plumber (which keeps
 * receiving its existing V3 webhook until V4 is enabled for it). A generic V3
 * MRF fires nothing.
 */
export const shouldSendMrfWebhook = ({
  mrfVersion,
  webhookType,
}: {
  mrfVersion: number
  webhookType: WebhookType
}): boolean => mrfVersion === 2 || webhookType === 'plumber'
