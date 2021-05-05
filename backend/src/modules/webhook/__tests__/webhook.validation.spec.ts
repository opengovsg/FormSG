import { promises as dns } from 'dns'
import { mocked } from 'ts-jest/utils'

import config from 'config/config'
import { WebhookValidationError } from 'src/modules/webhook/webhook.errors'
import { validateWebhookUrl } from 'src/modules/webhook/webhook.validation'

jest.mock('dns', () => ({
  promises: {
    resolve: jest.fn(),
  },
}))
const MockDns = mocked(dns, true)

const MOCK_APP_URL = 'https://example.com'
jest.mock('config/config')
const MockConfig = mocked(config, true)
MockConfig.app.appUrl = MOCK_APP_URL

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

  it('should reject URLs if DNS resolution fails', async () => {
    MockDns.resolve.mockRejectedValueOnce([])
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `Error encountered during DNS resolution for ${MOCK_WEBHOOK_URL}. Check that the URL is correct.`,
      ),
    )
  })

  it('should reject URLs which do not resolve to any IPs', async () => {
    MockDns.resolve.mockResolvedValueOnce([])
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `${MOCK_WEBHOOK_URL} does not resolve to any IP address.`,
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
      validateWebhookUrl(`${MOCK_APP_URL}/test`),
    ).rejects.toStrictEqual(
      new WebhookValidationError(
        `You cannot send responses back to ${MOCK_APP_URL}.`,
      ),
    )
  })
})
