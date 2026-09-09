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
  it.each<{
    name: string
    webhookType: WebhookConsumerType
    isStepWriteTokenEnabled: boolean
    latest: boolean
    expected: {
      contentFormat: WebhookContentFormat
      includeEncryptedSubmissionSecretKey: boolean
      includeEncryptedStepToken: boolean
    }
  }>([
    {
      name: 'plumber, write-token on, latest step',
      webhookType: 'plumber',
      isStepWriteTokenEnabled: true,
      latest: true,
      expected: {
        contentFormat: 'v4',
        includeEncryptedSubmissionSecretKey: true,
        includeEncryptedStepToken: true,
      },
    },
    {
      name: 'plumber, write-token on, non-latest step',
      webhookType: 'plumber',
      isStepWriteTokenEnabled: true,
      latest: false,
      expected: {
        contentFormat: 'v4',
        includeEncryptedSubmissionSecretKey: true,
        includeEncryptedStepToken: false,
      },
    },
    {
      name: 'plumber, write-token off, latest step (V3 downgrade)',
      webhookType: 'plumber',
      isStepWriteTokenEnabled: false,
      latest: true,
      expected: {
        contentFormat: 'v3',
        includeEncryptedSubmissionSecretKey: false,
        includeEncryptedStepToken: false,
      },
    },
    {
      name: 'generic, write-token on, latest step',
      webhookType: 'generic',
      isStepWriteTokenEnabled: true,
      latest: true,
      expected: {
        contentFormat: 'v4',
        includeEncryptedSubmissionSecretKey: true,
        includeEncryptedStepToken: false,
      },
    },
    {
      name: 'generic, write-token off, latest step (fail-safe)',
      webhookType: 'generic',
      isStepWriteTokenEnabled: false,
      latest: true,
      expected: {
        contentFormat: 'v3',
        includeEncryptedSubmissionSecretKey: false,
        includeEncryptedStepToken: false,
      },
    },
    {
      name: 'generic, write-token off, non-latest step (fail-safe)',
      webhookType: 'generic',
      isStepWriteTokenEnabled: false,
      latest: false,
      expected: {
        contentFormat: 'v3',
        includeEncryptedSubmissionSecretKey: false,
        includeEncryptedStepToken: false,
      },
    },
    {
      name: 'generic, write-token on, non-latest step',
      webhookType: 'generic',
      isStepWriteTokenEnabled: true,
      latest: false,
      expected: {
        contentFormat: 'v4',
        includeEncryptedSubmissionSecretKey: true,
        includeEncryptedStepToken: false,
      },
    },
  ])(
    'returns the correct policy for $name',
    ({ webhookType, isStepWriteTokenEnabled, latest, expected }) => {
      const submittedStepsLength = 3
      const input: WebhookPayloadPolicyInput = {
        webhookType,
        isStepWriteTokenEnabled,
        submittedStepsLength,
        submissionIndex: latest ? submittedStepsLength - 1 : 0,
      }
      expect(getWebhookPayloadPolicy(input)).toEqual(expected)
    },
  )

  it('never includes the step token for a generic consumer, whatever the flags or step', () => {
    for (const isStepWriteTokenEnabled of [true, false]) {
      for (const submissionIndex of [0, 1, 2]) {
        expect(
          getWebhookPayloadPolicy({
            webhookType: 'generic',
            isStepWriteTokenEnabled,
            submissionIndex,
            submittedStepsLength: 3,
          }).includeEncryptedStepToken,
        ).toBe(false)
      }
    }
  })
})

describe('getKeyPermissionsPolicy', () => {
  // The wrapped submission secret key is the only key permission a consumer
  // actually reads (webhook-reconstruction.ts). A V4 payload's content is
  // encrypted under the per-submission public key, so without it the payload
  // cannot be opened at all — and a V3/V1 payload has no use for it. Hence:
  // true exactly when the format is V4, for every consumer type.
  it.each(CONSUMER_TYPES)(
    'includes the wrapped submission secret key exactly for V4 (%s)',
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

  it('maps v1 to submission version 2.1', () => {
    expect(contentFormatToWebhookVersion('v1')).toBe(2.1)
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
