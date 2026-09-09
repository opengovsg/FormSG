import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { FormWebhook } from 'formsg-shared/types'

export type WebhookContentFormat = 'v1' | 'v3' | 'v4'

// This is not the same as WebhookType, this is the classes of webhook consumers (ie, internal or external)
export type WebhookConsumerType = 'plumber' | 'generic'

export interface WebhookPayloadPolicyInput {
  webhookType: WebhookConsumerType
  /**
   * The form's `webhook.webhookFormat` setting, verbatim — absent included.
   *
   * Required rather than optional on purpose: the default lives here, at
   * resolution time, and a caller that forgets the term would silently get
   * it. Making the key mandatory forces every call site to say what it
   * knows, even when the answer is `undefined`.
   */
  webhookFormat: FormWebhook['webhookFormat']
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

/**
 * Resolves the wire shape a consumer receives.
 *
 * | Consumer         | `webhookFormat` | Wire shape |
 * |------------------|-----------------|------------|
 * | plumber          | any (ignored)   | `v4`       |
 * | generic / zapier | unset or `'v1'` | `v1`       |
 * | generic / zapier | `'v4'`          | `v4`       |
 *
 * Plumber ignores the setting because the native V4 envelope is what it is
 * built against; the setting exists for the external consumers that parse a
 * storage-mode payload.
 *
 * Absent resolves to `'v1'` HERE and not as a mongoose default, so existing
 * rows need no migration and absent stays indistinguishable from an explicit
 * `'v1'`.
 *
 * The third row is unreachable today — request validation accepts `'v1'`
 * only — but the resolver states it anyway, because the mongoose enum
 * carries `'v4'` and enabling it is meant to be a one-line validation change
 * rather than a change here.
 */
export const getWebhookPayloadPolicy = ({
  webhookType,
  webhookFormat,
  submissionIndex,
  submittedStepsLength,
}: WebhookPayloadPolicyInput): WebhookPayloadPolicy => {
  const contentFormat: WebhookContentFormat =
    webhookType === 'plumber' ? 'v4' : (webhookFormat ?? 'v1')

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
      // Read from the shared constant, never the literal: this is the same
      // fixed platform version storage mode puts on the wire, and the two
      // must not be able to drift. It is NOT a per-row echo — an MRF row's
      // `version` is the envelope version derived from `mrfVersion`, so
      // reading it would label a storage-shaped payload `3` or `4`.
      return VIRUS_SCANNER_SUBMISSION_VERSION
  }
}

export const mrfVersionToContentFormat = (
  mrfVersion: number,
): WebhookContentFormat => (mrfVersion === 2 ? 'v4' : 'v3')
