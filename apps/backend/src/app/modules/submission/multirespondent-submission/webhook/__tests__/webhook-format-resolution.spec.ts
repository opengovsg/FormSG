import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { FormWebhook } from 'formsg-shared/types'

import {
  getWebhookType,
  toConsumerType,
} from 'src/app/modules/webhook/webhook.service'
import { WebhookData } from 'src/types/submission'

import { SubmissionSnapshot } from '../submission-snapshot.schema'
import {
  contentFormatToWebhookVersion,
  getWebhookPayloadPolicy,
  WebhookContentFormat,
} from '../webhook-payload-policy'
import { reconstructMrfWebhookData } from '../webhook-reconstruction'
import { shouldSendMrfWebhook } from '../webhook-send-eligibility'

const PLUMBER_URL = 'https://plumber.gov.sg/webhooks/abc'
const ZAPIER_URL = 'https://hooks.zapier.com/hooks/catch/123/abc'
const GENERIC_URL = 'https://example.com/hook'

type WebhookFormat = FormWebhook['webhookFormat']

const makeLiveData = (): WebhookData => ({
  formId: 'form-1',
  submissionId: 'sub-1',
  encryptedContent: 'LIVE_ROW_ENCRYPTED_CONTENT',
  verifiedContent: 'LIVE_ROW_VERIFIED_CONTENT',
  version: 4,
  created: new Date('2026-07-22T00:00:00.000Z'),
  attachmentDownloadUrls: {},
  encryptedSubmissionSecretKey: 'LIVE_ROW_KEY',
})

const makeSnapshot = (contentFormat: WebhookContentFormat): SubmissionSnapshot =>
  contentFormat === 'v4'
    ? {
        _v: 1,
        contentFormat: 'v4',
        formId: 'form-1',
        submissionId: 'sub-1',
        submissionIndex: 0,
        workflowStep: 0,
        encryptedContent: 'FROZEN_V4_CONTENT',
        encryptedSubmissionSecretKey: 'FROZEN_KEY',
        createdAt: '2026-07-22T00:00:00.000Z',
      }
    : {
        _v: 1,
        contentFormat: 'v1',
        formId: 'form-1',
        submissionId: 'sub-1',
        submissionIndex: 0,
        workflowStep: 0,
        encryptedContent: 'FROZEN_V1_CONTENT',
        createdAt: '2026-07-22T00:00:00.000Z',
      }

/**
 * The resolution table from #9975, driven from the webhook URL and the form's
 * `webhookFormat` setting rather than from a hand-narrowed consumer type, so
 * that "zapier classifies as generic" is exercised rather than assumed.
 *
 * | Consumer         | webhookFormat    | Wire shape |
 * |------------------|------------------|------------|
 * | plumber          | any (ignored)    | v4         |
 * | generic / zapier | unset or 'v1'    | v1         |
 * | generic / zapier | 'v4'             | v4         |
 *
 * The third row is unreachable in production — request validation accepts
 * `'v1'` only — but the resolver has to be honest about it, because the
 * mongoose enum carries `'v4'` and enabling it is meant to be a one-line
 * validation change.
 */
const ROWS: {
  name: string
  webhookUrl: string
  webhookFormat: WebhookFormat
  expectedContentFormat: WebhookContentFormat
}[] = [
  {
    name: 'plumber, unset',
    webhookUrl: PLUMBER_URL,
    webhookFormat: undefined,
    expectedContentFormat: 'v4',
  },
  {
    name: 'plumber, v1 (ignored)',
    webhookUrl: PLUMBER_URL,
    webhookFormat: 'v1',
    expectedContentFormat: 'v4',
  },
  {
    name: 'plumber, v4 (ignored)',
    webhookUrl: PLUMBER_URL,
    webhookFormat: 'v4',
    expectedContentFormat: 'v4',
  },
  {
    name: 'generic, unset',
    webhookUrl: GENERIC_URL,
    webhookFormat: undefined,
    expectedContentFormat: 'v1',
  },
  {
    name: 'generic, v1',
    webhookUrl: GENERIC_URL,
    webhookFormat: 'v1',
    expectedContentFormat: 'v1',
  },
  {
    name: 'generic, v4',
    webhookUrl: GENERIC_URL,
    webhookFormat: 'v4',
    expectedContentFormat: 'v4',
  },
  {
    name: 'zapier, unset',
    webhookUrl: ZAPIER_URL,
    webhookFormat: undefined,
    expectedContentFormat: 'v1',
  },
  {
    name: 'zapier, v1',
    webhookUrl: ZAPIER_URL,
    webhookFormat: 'v1',
    expectedContentFormat: 'v1',
  },
  {
    name: 'zapier, v4',
    webhookUrl: ZAPIER_URL,
    webhookFormat: 'v4',
    expectedContentFormat: 'v4',
  },
]

describe('webhookFormat resolution', () => {
  describe.each([true, false])(
    'with enable-mrf-webhooks %s',
    (isMrfWebhooksEnabled) => {
      it.each(ROWS)(
        'resolves $name to $expectedContentFormat',
        ({ webhookUrl, webhookFormat, expectedContentFormat }) => {
          const webhookType = toConsumerType(getWebhookType(webhookUrl))

          expect(
            getWebhookPayloadPolicy({
              webhookType,
              webhookFormat,
              submissionIndex: 0,
              submittedStepsLength: 1,
            }).contentFormat,
          ).toBe(expectedContentFormat)
        },
      )

      it.each(ROWS)(
        'gates delivery of $name on the flag for every non-plumber consumer',
        ({ webhookUrl }) => {
          const urlFamily = getWebhookType(webhookUrl)
          // The flag is the delivery gate, not a term in the resolution:
          // wiring `webhookFormat` is inert while the flag is off, in both
          // directions.
          expect(
            shouldSendMrfWebhook({
              webhookType: urlFamily,
              isMrfWebhooksEnabled,
            }),
          ).toBe(urlFamily === 'plumber' ? true : isMrfWebhooksEnabled)
        },
      )

      it.each(ROWS.filter((row) => row.webhookUrl !== PLUMBER_URL))(
        'keeps the wrapped submission secret key and the step token off $name',
        ({ webhookUrl, webhookFormat, expectedContentFormat }) => {
          const webhookType = toConsumerType(getWebhookType(webhookUrl))
          const policy = getWebhookPayloadPolicy({
            webhookType,
            webhookFormat,
            submissionIndex: 0,
            submittedStepsLength: 1,
          })

          const data = reconstructMrfWebhookData({
            liveData: makeLiveData(),
            snapshot: makeSnapshot(policy.contentFormat),
            submissionIndex: 0,
            policy,
          })._unsafeUnwrap()

          // A step token is a write credential and has never been part of a
          // non-plumber payload; asserted so it cannot quietly become one.
          expect(data).not.toHaveProperty('encryptedStepToken')

          if (expectedContentFormat === 'v1') {
            // V1 content is encrypted to the form public key, so a wrapped
            // per-submission key would be both useless and a leak.
            expect(data).not.toHaveProperty('encryptedSubmissionSecretKey')
          } else {
            // Generic on V4 needs it — the content is encrypted under the
            // per-submission public key and is unopenable without it. The
            // invariant that keeps generic-V4 a read-only grant is the step
            // token, not this key.
            expect(data).toHaveProperty('encryptedSubmissionSecretKey')
          }
        },
      )
    },
  )

  describe('version parity', () => {
    it('maps v1 to the shared virus-scanner submission version', () => {
      // Compared against the shared constant, never a literal, so the wire
      // value and the storage-mode frontend value cannot drift apart.
      expect(contentFormatToWebhookVersion('v1')).toBe(
        VIRUS_SCANNER_SUBMISSION_VERSION,
      )
    })

    it('a resolved v1 payload carries that version', () => {
      const policy = getWebhookPayloadPolicy({
        webhookType: 'generic',
        webhookFormat: undefined,
        submissionIndex: 0,
        submittedStepsLength: 1,
      })
      const data = reconstructMrfWebhookData({
        liveData: makeLiveData(),
        snapshot: makeSnapshot(policy.contentFormat),
        submissionIndex: 0,
        policy,
      })._unsafeUnwrap()

      expect(data.version).toBe(VIRUS_SCANNER_SUBMISSION_VERSION)
    })
  })
})
