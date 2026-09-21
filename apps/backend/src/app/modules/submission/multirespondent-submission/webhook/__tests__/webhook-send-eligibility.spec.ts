import { FormWebhook } from 'formsg-shared/types'

import { WebhookConsumerType } from '../webhook-payload-policy'
import {
  shouldSendMrfWebhook,
  shouldWriteV4Snapshot,
} from '../webhook-send-eligibility'

const PLUMBER_URL = 'https://plumber.gov.sg/webhooks/x'
const GENERIC_URL = 'https://example.com/hook'
const ZAPIER_URL = 'https://hooks.zapier.com/hooks/catch/1/x'

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
          webhookFormat,
          isMrfWebhooksEnabled,
          workflowStepCount,
        }),
      ).toBe(expected)
    },
  )
})

describe('shouldWriteV4Snapshot', () => {
  it.each<{
    name: string
    mrfVersion: number
    webhook?: {
      url?: string
      isRetryEnabled?: boolean
      webhookFormat?: FormWebhook['webhookFormat']
    }
    isMrfWebhooksEnabled: boolean
    workflowStepCount?: number
    expected: boolean
  }>([
    {
      name: 'a V3 row never snapshots',
      mrfVersion: 1,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      expected: false,
    },
    {
      name: 'no webhook url',
      mrfVersion: 2,
      webhook: undefined,
      isMrfWebhooksEnabled: true,
      expected: false,
    },
    {
      name: 'retries disabled',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: false },
      isMrfWebhooksEnabled: true,
      expected: false,
    },
    {
      name: 'plumber needs no flag',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      expected: true,
    },
    {
      name: 'plumber snapshots a multi-step form, which V4 can represent',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      workflowStepCount: 4,
      expected: true,
    },
    {
      name: 'generic with the flag off is never delivered, so never snapshots',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      expected: false,
    },
    {
      name: 'generic with no format resolves to V1, so writes no V4 snapshot',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      expected: false,
    },
    {
      name: 'zapier with no format resolves to V1, so writes no V4 snapshot',
      mrfVersion: 2,
      webhook: { url: ZAPIER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      expected: false,
    },
    {
      name: 'generic asking for V4 with enable-mrf-webhooks snapshots',
      mrfVersion: 2,
      webhook: {
        url: GENERIC_URL,
        isRetryEnabled: true,
        webhookFormat: 'v4',
      },
      isMrfWebhooksEnabled: true,
      expected: true,
    },
    {
      name: 'zapier asking for V4 with enable-mrf-webhooks snapshots',
      mrfVersion: 2,
      webhook: {
        url: ZAPIER_URL,
        isRetryEnabled: true,
        webhookFormat: 'v4',
      },
      isMrfWebhooksEnabled: true,
      expected: true,
    },
    {
      name: 'a generic multi-step form on the V1 shape is not delivered to at all, so it snapshots nothing',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: false,
    },
    {
      name: 'a one-step generic form asking for V1 writes no V4 snapshot',
      mrfVersion: 2,
      webhook: {
        url: GENERIC_URL,
        isRetryEnabled: true,
        webhookFormat: 'v1',
      },
      isMrfWebhooksEnabled: true,
      workflowStepCount: 1,
      expected: false,
    },
    {
      name: 'a generic multi-step form on the V4 shape is delivered to, so it snapshots',
      mrfVersion: 2,
      webhook: {
        url: GENERIC_URL,
        isRetryEnabled: true,
        webhookFormat: 'v4',
      },
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: true,
    },
  ])(
    '$name',
    ({
      mrfVersion,
      webhook,
      isMrfWebhooksEnabled,
      workflowStepCount = 0,
      expected,
    }) => {
      expect(
        shouldWriteV4Snapshot({
          mrfVersion,
          webhook,
          isMrfWebhooksEnabled,
          workflowStepCount,
        }),
      ).toBe(expected)
    },
  )
})
