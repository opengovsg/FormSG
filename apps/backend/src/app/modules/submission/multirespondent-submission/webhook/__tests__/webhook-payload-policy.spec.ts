import {
  contentShapeToSubmissionVersion,
  getWebhookPayloadPolicy,
  WebhookConsumerType,
  WebhookContentShape,
  WebhookPayloadPolicyInput,
} from '../webhook-payload-policy'

describe('getWebhookPayloadPolicy', () => {
  // Full decision table from the S4 PRD. "latest step" means
  // submissionIndex === submittedStepsLength - 1.
  it.each<{
    name: string
    webhookType: WebhookConsumerType
    webhookFormat: 'v1' | 'v4'
    latest: boolean
    expected: {
      contentShape: WebhookContentShape
      includeReadKey: boolean
      includeStepToken: boolean
    }
  }>([
    {
      name: 'plumber, latest step',
      webhookType: 'plumber',
      webhookFormat: 'v4',
      latest: true,
      expected: {
        contentShape: 'v4',
        includeReadKey: true,
        includeStepToken: true,
      },
    },
    {
      name: 'plumber, non-latest step',
      webhookType: 'plumber',
      webhookFormat: 'v4',
      latest: false,
      expected: {
        contentShape: 'v4',
        includeReadKey: true,
        includeStepToken: false,
      },
    },
    {
      name: 'generic v4, latest step',
      webhookType: 'generic',
      webhookFormat: 'v4',
      latest: true,
      expected: {
        contentShape: 'v4',
        includeReadKey: true,
        includeStepToken: false,
      },
    },
    {
      // zapier is folded into 'generic' by the caller, so this generic + v1
      // (the default) case also stands in for the zapier case.
      name: 'generic v1 (default), any step',
      webhookType: 'generic',
      webhookFormat: 'v1',
      latest: true,
      expected: {
        contentShape: 'v1',
        includeReadKey: false,
        includeStepToken: false,
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

  it('includes the read key on a NON-latest plumber step', () => {
    const policy = getWebhookPayloadPolicy({
      webhookType: 'plumber',
      webhookFormat: 'v4',
      submissionIndex: 0,
      submittedStepsLength: 5,
    })
    expect(policy.includeReadKey).toBe(true)
    expect(policy.includeStepToken).toBe(false)
  })

  it('does NOT include a step token for generic v4 even at the latest step', () => {
    const policy = getWebhookPayloadPolicy({
      webhookType: 'generic',
      webhookFormat: 'v4',
      submissionIndex: 2,
      submittedStepsLength: 3,
    })
    expect(policy.contentShape).toBe('v4')
    expect(policy.includeReadKey).toBe(true)
    expect(policy.includeStepToken).toBe(false)
  })

  it('includes a step token for plumber ONLY at the latest step', () => {
    const submittedStepsLength = 4
    const latest = getWebhookPayloadPolicy({
      webhookType: 'plumber',
      webhookFormat: 'v4',
      submissionIndex: submittedStepsLength - 1,
      submittedStepsLength,
    })
    const notLatest = getWebhookPayloadPolicy({
      webhookType: 'plumber',
      webhookFormat: 'v4',
      submissionIndex: submittedStepsLength - 2,
      submittedStepsLength,
    })
    expect(latest.includeStepToken).toBe(true)
    expect(notLatest.includeStepToken).toBe(false)
  })

  it('treats zapier as generic (generic v1 yields v1/false/false)', () => {
    // The function type only accepts 'plumber' | 'generic'; the caller maps
    // 'zapier' -> 'generic' before calling. This asserts that stand-in case.
    const policy = getWebhookPayloadPolicy({
      webhookType: 'generic',
      webhookFormat: 'v1',
      submissionIndex: 2,
      submittedStepsLength: 3,
    })
    expect(policy).toEqual({
      contentShape: 'v1',
      includeReadKey: false,
      includeStepToken: false,
    })
  })
})

describe('contentShapeToSubmissionVersion', () => {
  it('maps v4 to submission version 3', () => {
    expect(contentShapeToSubmissionVersion('v4')).toBe(3)
  })

  it('maps v1 to submission version 2.1', () => {
    expect(contentShapeToSubmissionVersion('v1')).toBe(2.1)
  })
})
