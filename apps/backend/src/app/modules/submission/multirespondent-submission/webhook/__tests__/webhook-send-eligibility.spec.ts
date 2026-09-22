import { FormWebhook } from 'formsg-shared/types'

import {
  resolveWebhookContentFormat,
  WebhookConsumerType,
} from '../webhook-payload-policy'
import {
  holdsV1FirstStepInvariant,
  shouldSendMrfWebhook,
  shouldWriteMrfSnapshot,
} from '../webhook-send-eligibility'

describe('shouldSendMrfWebhook', () => {
  it.each<{
    webhookConsumerType: WebhookConsumerType
    webhookFormat: FormWebhook['webhookFormat']
    isMrfWebhooksEnabled: boolean
    workflowStepCount: number
    expected: boolean
  }>([
    {
      webhookConsumerType: 'plumber',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: false,
      workflowStepCount: 0,
      expected: true,
    },
    {
      webhookConsumerType: 'plumber',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: true,
      workflowStepCount: 3,
      expected: true,
    },
    {
      webhookConsumerType: 'plumber',
      webhookFormat: 'v1',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 3,
      expected: true,
    },
    {
      webhookConsumerType: 'generic',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: false,
      workflowStepCount: 0,
      expected: false,
    },
    {
      webhookConsumerType: 'generic',
      webhookFormat: 'v4',
      isMrfWebhooksEnabled: false,
      workflowStepCount: 0,
      expected: false,
    },
    {
      webhookConsumerType: 'generic',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: true,
      workflowStepCount: 0,
      expected: true,
    },
    {
      webhookConsumerType: 'generic',
      webhookFormat: 'v1',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 1,
      expected: true,
    },
    {
      webhookConsumerType: 'generic',
      webhookFormat: 'v1',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: false,
    },
    {
      webhookConsumerType: 'generic',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: false,
    },
    {
      webhookConsumerType: 'generic',
      webhookFormat: 'v4',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: true,
    },
    {
      webhookConsumerType: 'generic',
      webhookFormat: 'v4',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 7,
      expected: true,
    },
    {
      webhookConsumerType: 'generic',
      webhookFormat: 'v4',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 1,
      expected: true,
    },
  ])(
    '$webhookConsumerType/$webhookFormat, flag=$isMrfWebhooksEnabled, $workflowStepCount step(s) => $expected',
    ({
      webhookConsumerType,
      webhookFormat,
      isMrfWebhooksEnabled,
      workflowStepCount,
      expected,
    }) => {
      expect(
        shouldSendMrfWebhook({
          webhookConsumerType,
          contentFormat: resolveWebhookContentFormat({
            webhookType: webhookConsumerType,
            webhookFormat,
          }),
          isMrfWebhooksEnabled,
          workflowStepCount,
        }),
      ).toBe(expected)
    },
  )
})

describe('shouldWriteMrfSnapshot', () => {
  it.each<{
    contentFormat: 'v1' | 'v4'
    submissionIndex: number
    expected: boolean
  }>([
    { contentFormat: 'v1', submissionIndex: 0, expected: true },
    { contentFormat: 'v1', submissionIndex: 1, expected: false },
    { contentFormat: 'v4', submissionIndex: 0, expected: true },
    { contentFormat: 'v4', submissionIndex: 1, expected: true },
  ])(
    '$contentFormat at submission index $submissionIndex -> write=$expected',
    ({ contentFormat, submissionIndex, expected }) => {
      expect(
        shouldWriteMrfSnapshot({
          mrfVersion: 2,
          shouldSend: true,
          isRetryEnabled: true,
          contentFormat,
          submissionIndex,
          logMeta: {},
        }),
      ).toBe(expected)
    },
  )
})

describe('holdsV1FirstStepInvariant', () => {
  it('holds on the first step', () => {
    expect(holdsV1FirstStepInvariant({ submissionIndex: 0, logMeta: {} })).toBe(
      true,
    )
  })

  it.each([1, 2, 5])(
    'fails loud on submission index %i, which a single-step workflow cannot produce',
    (submissionIndex) => {
      expect(holdsV1FirstStepInvariant({ submissionIndex, logMeta: {} })).toBe(
        false,
      )
    },
  )
})
