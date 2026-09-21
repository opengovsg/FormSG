import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { FormWebhook } from 'formsg-shared/types'

import {
  contentFormatToWebhookVersion,
  getKeyPermissionsPolicy,
  getWebhookPayloadPolicy,
  mrfVersionToContentFormat,
  WebhookConsumerType,
  WebhookContentFormat,
} from '../webhook-payload-policy'

const CONTENT_FORMATS: WebhookContentFormat[] = ['v1', 'v3', 'v4']

describe('getWebhookPayloadPolicy', () => {
  it.each<{
    name: string
    webhookType: WebhookConsumerType
    webhookFormat: FormWebhook['webhookFormat']
    expected: {
      contentFormat: WebhookContentFormat
      includeEncryptedSubmissionSecretKey: boolean
    }
  }>([
    {
      name: 'plumber',
      webhookType: 'plumber',
      webhookFormat: undefined,
      expected: {
        contentFormat: 'v4',
        includeEncryptedSubmissionSecretKey: true,
      },
    },
    {
      name: 'generic, unset format',
      webhookType: 'generic',
      webhookFormat: undefined,
      expected: {
        contentFormat: 'v1',
        includeEncryptedSubmissionSecretKey: false,
      },
    },
  ])(
    'returns the correct policy for $name',
    ({ webhookType, webhookFormat, expected }) => {
      expect(getWebhookPayloadPolicy({ webhookType, webhookFormat })).toEqual(
        expected,
      )
    },
  )
})

describe('getKeyPermissionsPolicy', () => {
  it.each(CONTENT_FORMATS)(
    'includes the wrapped submission secret key only for V4 (%s)',
    (contentFormat) => {
      expect(
        getKeyPermissionsPolicy({ contentFormat })
          .includeEncryptedSubmissionSecretKey,
      ).toBe(contentFormat === 'v4')
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
    // Against the shared constant, not the literal `2.1`, so the V1 wire
    // value cannot drift from the one storage mode sends.
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
