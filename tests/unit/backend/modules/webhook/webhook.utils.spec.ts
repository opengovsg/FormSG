import { WebhookValidationError } from 'src/app/modules/webhook/webhook.errors'
import { validateWebhookUrl } from 'src/app/modules/webhook/webhook.utils'

describe('Webhook URL validation', () => {
  it('should accept valid HTTPS URLs', async () => {
    await expect(
      validateWebhookUrl('https://staging.form.gov.sg'),
    ).resolves.toEqual(undefined)
  })

  it('should reject non-HTTPS URLs', async () => {
    await expect(
      validateWebhookUrl('http://some.website'),
    ).rejects.toStrictEqual(
      new WebhookValidationError(
        'http://some.website is not a valid HTTPS URL.',
      ),
    )
  })

  it('should reject URLs which do not resolve to any IP', async () => {
    await expect(
      validateWebhookUrl('https://some.nonsense.website'),
    ).rejects.toStrictEqual(
      new WebhookValidationError(
        'Error encountered during DNS resolution for https://some.nonsense.website. Check that the URL is correct.',
      ),
    )
  })

  it('should reject URLs which resolve to private IPs', async () => {
    await expect(
      validateWebhookUrl('https://localtest.me'),
    ).rejects.toStrictEqual(
      new WebhookValidationError(
        'https://localtest.me resolves to the following private IPs: 127.0.0.1',
      ),
    )
  })

  it('should reject URLs which start with the app URL', async () => {
    await expect(
      validateWebhookUrl('https://example.com/test'),
    ).rejects.toStrictEqual(
      new WebhookValidationError(
        'You cannot send responses back to https://example.com.',
      ),
    )
  })
})
