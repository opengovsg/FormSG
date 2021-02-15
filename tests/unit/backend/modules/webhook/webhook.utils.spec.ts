import { promises as dns } from 'dns'
import { mocked } from 'ts-jest/utils'

import { WebhookValidationError } from 'src/app/modules/webhook/webhook.errors'
import { validateWebhookUrl } from 'src/app/modules/webhook/webhook.utils'

jest.mock('dns', () => ({
  promises: {
    resolve: jest.fn(),
  },
}))
const MockDns = mocked(dns, true)

const MOCK_WEBHOOK_URL = 'https://mock.webhook.url'

describe('Webhook URL validation', () => {
  it('should accept valid HTTPS URLs', async () => {
    MockDns.resolve.mockResolvedValueOnce(['1.1.1.1'])
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).resolves.toEqual(
      undefined,
    )
  })

  it('should reject non-HTTPS URLs', async () => {
    const httpUrl = 'http://website.com'
    await expect(validateWebhookUrl(httpUrl)).rejects.toStrictEqual(
      new WebhookValidationError(`${httpUrl} is not a valid HTTPS URL.`),
    )
  })

  it('should reject URLs which do not resolve to any IP', async () => {
    MockDns.resolve.mockRejectedValueOnce([])
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `Error encountered during DNS resolution for ${MOCK_WEBHOOK_URL}. Check that the URL is correct.`,
      ),
    )
  })

  it('should reject URLs which resolve to private IPs', async () => {
    MockDns.resolve.mockResolvedValueOnce(['127.0.0.1'])
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `${MOCK_WEBHOOK_URL} resolves to the following private IPs: 127.0.0.1`,
      ),
    )
  })

  it('should reject URLs in the same domain as the app URL', async () => {
    await expect(
      validateWebhookUrl(`${process.env.APP_URL}/test`),
    ).rejects.toStrictEqual(
      new WebhookValidationError(
        `You cannot send responses back to ${process.env.APP_URL}.`,
      ),
    )
  })
})
