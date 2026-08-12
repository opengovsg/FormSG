import { promises as dns } from 'dns'

import config from 'src/app/config/config'
import { WebhookValidationError } from 'src/app/modules/webhook/webhook.errors'
import { validateWebhookUrl } from 'src/app/modules/webhook/webhook.validation'

jest.mock('dns', () => ({
  promises: {
    lookup: jest.fn(),
  },
}))
const MockDns = jest.mocked(dns)

// Helper to build the { address, family }[] shape returned by
// dns.lookup(host, { all: true }).
const mockLookup = (
  ...addresses: { address: string; family: 4 | 6 }[]
): void => {
  MockDns.lookup.mockResolvedValueOnce(addresses as never)
}

const MOCK_APP_URL = 'https://example.com'
const MOCK_APP_SUBDOMAIN_URL = 'https://mock.example.com'
const MOCK_APP_SIMILAR_URL = 'https://mockexample.com'
jest.mock('src/app/config/config')
const MockConfig = jest.mocked(config)
MockConfig.app.appUrl = MOCK_APP_URL

const MOCK_WEBHOOK_URL = 'https://mock.webhook.url'

describe('Webhook URL validation', () => {
  it('should accept valid HTTPS URLs', async () => {
    mockLookup({ address: '1.1.1.1', family: 4 })
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).resolves.toEqual(
      undefined,
    )
  })

  it('should accept URLs resolving to a public IPv6 address', async () => {
    mockLookup({ address: '2606:4700:4700::1111', family: 6 })
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
    MockDns.lookup.mockRejectedValueOnce(new Error('ENOTFOUND'))
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `Error encountered during DNS resolution for webhook URL: ${MOCK_WEBHOOK_URL}. Check that the URL is correct or delete the webhook before proceeding.`,
      ),
    )
  })

  it('should reject URLs which do not resolve to any IPs', async () => {
    mockLookup()
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `${MOCK_WEBHOOK_URL} does not resolve to any IP address.`,
      ),
    )
  })

  it('should reject URLs which resolve to private IPs', async () => {
    mockLookup({ address: '127.0.0.1', family: 4 })
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `${MOCK_WEBHOOK_URL} resolves to the following private IPs: 127.0.0.1`,
      ),
    )
  })

  it('should reject URLs which resolve to the link-local metadata IP', async () => {
    // 169.254.169.254 is the cloud instance metadata endpoint - a classic
    // SSRF target that must never be reachable via a webhook.
    mockLookup({ address: '169.254.169.254', family: 4 })
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `${MOCK_WEBHOOK_URL} resolves to the following private IPs: 169.254.169.254`,
      ),
    )
  })

  it('should reject IPv4-mapped IPv6 addresses of unsafe IPs', async () => {
    // ::ffff:169.254.169.254 embeds the metadata IP; must be unwrapped and
    // rejected rather than treated as a public IPv6 unicast address.
    mockLookup({ address: '::ffff:169.254.169.254', family: 6 })
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `${MOCK_WEBHOOK_URL} resolves to the following private IPs: ::ffff:169.254.169.254`,
      ),
    )
  })

  it('should reject URLs which resolve to a unique-local IPv6 address', async () => {
    // fc00::/7 (ULA) is the IPv6 equivalent of RFC1918 private space.
    mockLookup({ address: 'fc00::1', family: 6 })
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `${MOCK_WEBHOOK_URL} resolves to the following private IPs: fc00::1`,
      ),
    )
  })

  it('should reject URLs which resolve to a link-local IPv6 address', async () => {
    mockLookup({ address: 'fe80::1', family: 6 })
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `${MOCK_WEBHOOK_URL} resolves to the following private IPs: fe80::1`,
      ),
    )
  })

  it('should reject URLs which resolve to any unsafe IP across families', async () => {
    // A public A record paired with an internal AAAA record must still be
    // rejected - the whole point of validating both families.
    mockLookup(
      { address: '1.1.1.1', family: 4 },
      { address: 'fc00::1', family: 6 },
    )
    await expect(validateWebhookUrl(MOCK_WEBHOOK_URL)).rejects.toStrictEqual(
      new WebhookValidationError(
        `${MOCK_WEBHOOK_URL} resolves to the following private IPs: fc00::1`,
      ),
    )
  })

  it('should reject URLs in the same domain as the app URL', async () => {
    await expect(
      validateWebhookUrl(`${MOCK_APP_URL}/test`),
    ).rejects.toStrictEqual(
      new WebhookValidationError(
        `You cannot send responses back to ${MOCK_APP_URL} or its subdomain.`,
      ),
    )
  })

  it('should reject URLs in a subdomain of the app URL', async () => {
    await expect(
      validateWebhookUrl(`${MOCK_APP_SUBDOMAIN_URL}`),
    ).rejects.toStrictEqual(
      new WebhookValidationError(
        `You cannot send responses back to ${MOCK_APP_URL} or its subdomain.`,
      ),
    )
  })

  it('should allow URLs with a hostname which ends in the app hostname', async () => {
    mockLookup({ address: '1.1.1.1', family: 4 })
    await expect(
      validateWebhookUrl(`${MOCK_APP_SIMILAR_URL}`),
    ).resolves.toEqual(undefined)
  })
})
