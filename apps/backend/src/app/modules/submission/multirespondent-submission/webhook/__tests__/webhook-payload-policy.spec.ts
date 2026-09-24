import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { FormWebhook } from 'formsg-shared/types'

import {
  contentFormatToWebhookVersion,
  getKeyPermissionsPolicy,
  getWebhookPayloadPolicy,
  mrfVersionToContentFormat,
  WebhookConsumerType,
  WebhookContentFormat,
  WebhookPayloadPolicyInput,
} from '../webhook-payload-policy'

const CONSUMER_TYPES: WebhookConsumerType[] = ['plumber', 'generic']
const CONTENT_FORMATS: WebhookContentFormat[] = ['v1', 'v3', 'v4']

describe('getWebhookPayloadPolicy', () => {
  describe('workflow step does not affect the payload policy', () => {
    it.each<{
      name: string
      webhookType: WebhookConsumerType
      webhookFormat: FormWebhook['webhookFormat']
      latest: boolean
      expected: {
        contentFormat: WebhookContentFormat
        includeEncryptedSubmissionSecretKey: boolean
      }
    }>([
      {
        name: 'plumber, latest step',
        webhookType: 'plumber',
        webhookFormat: undefined,
        latest: true,
        expected: {
          contentFormat: 'v4',
          includeEncryptedSubmissionSecretKey: true,
        },
      },
      {
        name: 'plumber, non-latest step',
        webhookType: 'plumber',
        webhookFormat: undefined,
        latest: false,
        expected: {
          contentFormat: 'v4',
          includeEncryptedSubmissionSecretKey: true,
        },
      },
      {
        name: 'generic, latest step',
        webhookType: 'generic',
        webhookFormat: undefined,
        latest: true,
        expected: {
          contentFormat: 'v1',
          includeEncryptedSubmissionSecretKey: false,
        },
      },
      {
        name: 'generic, non-latest step',
        webhookType: 'generic',
        webhookFormat: undefined,
        latest: false,
        expected: {
          contentFormat: 'v1',
          includeEncryptedSubmissionSecretKey: false,
        },
      },
    ])(
      'returns the correct policy for $name',
      ({ webhookType, webhookFormat, latest, expected }) => {
        const submittedStepsLength = 3
        const input: WebhookPayloadPolicyInput = {
          webhookType,
          webhookFormat,
          submittedStepsLength,
          submissionIndex: latest ? submittedStepsLength - 1 : 0,
        }
        expect(getWebhookPayloadPolicy(input)).toEqual(expected)
      },
    )
  })
})

describe('getKeyPermissionsPolicy', () => {
  it.each(CONSUMER_TYPES)(
    'includes the wrapped submission secret key only for V4 (%s)',
    (webhookType) => {
      const submittedStepsLength = 3
      for (const contentFormat of CONTENT_FORMATS) {
        for (const submissionIndex of [0, 1, 2]) {
          expect(
            getKeyPermissionsPolicy({
              webhookType,
              contentFormat,
              submissionIndex,
              submittedStepsLength,
            }).includeEncryptedSubmissionSecretKey,
          ).toBe(contentFormat === 'v4')
        }
      }
    },
  )
})

describe('contentFormatToWebhookVersion', () => {
  it('maps v4 to submission version 4', () => {
    expect(contentFormatToWebhookVersion('v4')).toBe(4)
  })

  it('maps v3 to submission version 3', () => {
    expect(contentFormatToWebhookVersion('v3')).toBe(3)
  })

  it('maps v1 to the shared virus-scanner submission version', () => {
    // Keep the V1 value aligned with storage mode.
    expect(contentFormatToWebhookVersion('v1')).toBe(
      VIRUS_SCANNER_SUBMISSION_VERSION,
    )
  })
})

describe('mrfVersionToContentFormat', () => {
  it('maps mrfVersion 2 to v4 (native v4 encryption)', () => {
    expect(mrfVersionToContentFormat(2)).toBe('v4')
  })

  it('maps mrfVersion 1 to v3 (downgraded via adaptV4ToV3)', () => {
    expect(mrfVersionToContentFormat(1)).toBe('v3')
  })
})
