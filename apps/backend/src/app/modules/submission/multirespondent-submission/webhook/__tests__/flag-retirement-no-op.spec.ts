/**
 * [STEERING:T1] — DELETE THIS FILE once #9973 is merged and verified.
 *
 * This is a steering gate, not a permanent one. It exists only to prove that
 * retiring `mrf-step-write-token` is a behavioural no-op: the expected values
 * below were recorded from the pre-change code with the flag ON (its
 * production value), and the same literals must still hold after the flag and
 * every gate reading it are gone.
 *
 * The permanent guards for these decisions live in
 * `webhook-send-eligibility.spec.ts`, `webhook-payload-policy.spec.ts` and the
 * `mrf version gate` block of `multirespondent-submission.middleware.spec.ts`.
 *
 * Scope note: the table covers the *observable* decision outputs — send
 * eligibility, snapshot-write eligibility, content format, the wrapped
 * submission secret key, and the row content version. It deliberately does not
 * cover `includeEncryptedStepToken`, which #9973 deletes outright: that field
 * had zero production consumers, so its disappearance is not observable.
 */
import { WebhookType } from 'src/app/modules/webhook/webhook.service'

import {
  getMrfVersion,
  MrfVersion,
} from '../../multirespondent-submission.utils'
import {
  getWebhookPayloadPolicy,
  WebhookConsumerType,
  WebhookContentFormat,
} from '../webhook-payload-policy'
import {
  shouldSendMrfWebhook,
  shouldWriteV4Snapshot,
} from '../webhook-send-eligibility'

const PLUMBER_URL = 'https://plumber.gov.sg/webhooks/x'
const GENERIC_URL = 'https://example.com/hook'
const ZAPIER_URL = 'https://hooks.zapier.com/hooks/catch/1/x'

const CONSUMER_TYPES: WebhookType[] = ['plumber', 'generic', 'zapier']
const URL_BY_CONSUMER: Record<WebhookType, string> = {
  plumber: PLUMBER_URL,
  generic: GENERIC_URL,
  zapier: ZAPIER_URL,
}

describe('[STEERING:T1] flag retirement is a no-op', () => {
  // Recorded from the flag-ON code path.
  const EXPECTED_SEND: Record<WebhookType, Record<'on' | 'off', boolean>> = {
    plumber: { on: true, off: true },
    generic: { on: true, off: false },
    zapier: { on: true, off: false },
  }

  it.each(CONSUMER_TYPES)(
    'send eligibility for %s matches the flag-on outputs',
    (webhookType) => {
      for (const isMrfWebhooksEnabled of [true, false]) {
        expect(
          shouldSendMrfWebhook({
            webhookType,
            isMrfWebhooksEnabled,
          }),
        ).toBe(EXPECTED_SEND[webhookType][isMrfWebhooksEnabled ? 'on' : 'off'])
      }
    },
  )

  it.each(CONSUMER_TYPES)(
    'snapshot-write eligibility for %s matches the flag-on outputs',
    (webhookType) => {
      const url = URL_BY_CONSUMER[webhookType]
      for (const isMrfWebhooksEnabled of [true, false]) {
        // A deliverable V4 row with retries on snapshots iff it would be sent.
        expect(
          shouldWriteV4Snapshot({
            mrfVersion: 2,
            webhook: { url, isRetryEnabled: true },
            isMrfWebhooksEnabled,
          }),
        ).toBe(EXPECTED_SEND[webhookType][isMrfWebhooksEnabled ? 'on' : 'off'])

        // A V3 row, a missing url and disabled retries all suppress the write,
        // whatever the consumer type.
        expect(
          shouldWriteV4Snapshot({
            mrfVersion: 1,
            webhook: { url, isRetryEnabled: true },
            isMrfWebhooksEnabled,
          }),
        ).toBe(false)
        expect(
          shouldWriteV4Snapshot({
            mrfVersion: 2,
            webhook: undefined,
            isMrfWebhooksEnabled,
          }),
        ).toBe(false)
        expect(
          shouldWriteV4Snapshot({
            mrfVersion: 2,
            webhook: { url, isRetryEnabled: false },
            isMrfWebhooksEnabled,
          }),
        ).toBe(false)
      }
    },
  )

  it.each<WebhookConsumerType>(['plumber', 'generic'])(
    'payload policy for %s matches the flag-on outputs',
    (webhookType) => {
      const submittedStepsLength = 3
      for (const submissionIndex of [0, 1, 2]) {
        const policy = getWebhookPayloadPolicy({
          webhookType,
          submissionIndex,
          submittedStepsLength,
        })
        // Recorded from the flag-ON code path: V4 for every consumer, and the
        // wrapped submission secret key travels with it.
        expect(policy.contentFormat).toBe<WebhookContentFormat>('v4')
        expect(policy.includeEncryptedSubmissionSecretKey).toBe(true)
      }
    },
  )

  it.each<WebhookType | undefined>([undefined, 'plumber', 'generic', 'zapier'])(
    'row content version for %s matches the flag-on output',
    (webhookType) => {
      expect(getMrfVersion({ webhookType })).toBe<MrfVersion>(2)
    },
  )
})
