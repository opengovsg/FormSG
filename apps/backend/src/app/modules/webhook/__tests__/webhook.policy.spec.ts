import {
  getWebhookPayloadPolicy,
  shouldSendMrfWebhook,
} from '../webhook.policy'

describe('getWebhookPayloadPolicy', () => {
  describe('content shape', () => {
    it('should give a plumber (privileged) consumer the v4 content shape', () => {
      const policy = getWebhookPayloadPolicy({
        webhookType: 'plumber',
        submissionIndex: 0,
        submittedStepsLength: 1,
      })

      expect(policy.contentShape).toBe('v4')
    })

    it('should give a generic consumer the v1 content shape', () => {
      const policy = getWebhookPayloadPolicy({
        webhookType: 'generic',
        submissionIndex: 0,
        submittedStepsLength: 1,
      })

      expect(policy.contentShape).toBe('v1')
    })

    it('should give a zapier consumer the v1 content shape', () => {
      const policy = getWebhookPayloadPolicy({
        webhookType: 'zapier',
        submissionIndex: 0,
        submittedStepsLength: 1,
      })

      expect(policy.contentShape).toBe('v1')
    })
  })

  describe('submission-secret-key inclusion', () => {
    it('should attach the secret key for a plumber consumer on the latest step', () => {
      const policy = getWebhookPayloadPolicy({
        webhookType: 'plumber',
        submissionIndex: 2,
        submittedStepsLength: 3,
      })

      expect(policy.includeSecretKey).toBe(true)
    })

    it('should NOT attach the secret key for a plumber consumer on a non-latest step', () => {
      const policy = getWebhookPayloadPolicy({
        webhookType: 'plumber',
        submissionIndex: 0,
        submittedStepsLength: 3,
      })

      expect(policy.includeSecretKey).toBe(false)
    })

    it('should NOT attach the secret key for a generic consumer even on the latest step', () => {
      const policy = getWebhookPayloadPolicy({
        webhookType: 'generic',
        submissionIndex: 2,
        submittedStepsLength: 3,
      })

      expect(policy.includeSecretKey).toBe(false)
    })

    it('should NOT attach the secret key for a zapier consumer even on the latest step', () => {
      const policy = getWebhookPayloadPolicy({
        webhookType: 'zapier',
        submissionIndex: 2,
        submittedStepsLength: 3,
      })

      expect(policy.includeSecretKey).toBe(false)
    })
  })
})

describe('shouldSendMrfWebhook', () => {
  it('should send a V4 (mrfVersion 2) webhook to every consumer', () => {
    expect(
      shouldSendMrfWebhook({ mrfVersion: 2, webhookType: 'generic' }),
    ).toBe(true)
    expect(shouldSendMrfWebhook({ mrfVersion: 2, webhookType: 'zapier' })).toBe(
      true,
    )
    expect(
      shouldSendMrfWebhook({ mrfVersion: 2, webhookType: 'plumber' }),
    ).toBe(true)
  })

  it('should send a V3 (mrfVersion 1) webhook to plumber only', () => {
    expect(
      shouldSendMrfWebhook({ mrfVersion: 1, webhookType: 'plumber' }),
    ).toBe(true)
  })

  it('should NOT send a V3 (mrfVersion 1) webhook to a generic or zapier consumer', () => {
    expect(
      shouldSendMrfWebhook({ mrfVersion: 1, webhookType: 'generic' }),
    ).toBe(false)
    expect(shouldSendMrfWebhook({ mrfVersion: 1, webhookType: 'zapier' })).toBe(
      false,
    )
  })
})
