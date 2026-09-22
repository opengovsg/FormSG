import { FormWebhook } from 'formsg-shared/types'

import { SnapshotContentFormat } from '../submission-snapshot.schema'
import {
  resolveWebhookContentFormat,
  WebhookConsumerType,
} from '../webhook-payload-policy'
import {
  getWebhookContentFormatIfEligible,
  holdsV1FirstStepInvariant,
  shouldSendMrfWebhook,
  shouldWriteMrfSnapshot,
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

describe('getEligibleMrfWebhookContentFormat', () => {
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
    expected: SnapshotContentFormat | undefined
  }>([
    {
      name: 'a V3 row never snapshots',
      mrfVersion: 1,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      expected: undefined,
    },
    {
      name: 'no webhook url',
      mrfVersion: 2,
      webhook: undefined,
      isMrfWebhooksEnabled: true,
      expected: undefined,
    },
    {
      name: 'retries disabled still resolves a shape — the retry term decides persistence, not delivery',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: false },
      isMrfWebhooksEnabled: true,
      expected: 'v4',
    },
    {
      name: 'retries disabled still resolves V1 for a generic consumer',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: false },
      isMrfWebhooksEnabled: true,
      expected: 'v1',
    },
    {
      name: 'plumber needs no flag and snapshots V4',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      expected: 'v4',
    },
    {
      name: 'plumber snapshots V4 on a multi-step form, which V4 can represent',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      workflowStepCount: 4,
      expected: 'v4',
    },
    {
      name: 'plumber ignores webhookFormat',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true, webhookFormat: 'v1' },
      isMrfWebhooksEnabled: true,
      expected: 'v4',
    },
    {
      name: 'generic with the flag off is never delivered, so never snapshots',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      expected: undefined,
    },
    {
      name: 'generic with no format set snapshots V1 by default',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      expected: 'v1',
    },
    {
      name: 'generic set explicitly to v1 snapshots V1',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true, webhookFormat: 'v1' },
      isMrfWebhooksEnabled: true,
      expected: 'v1',
    },
    {
      name: 'generic set to v4 snapshots V4 — unreachable today, but the resolution is honest',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true, webhookFormat: 'v4' },
      isMrfWebhooksEnabled: true,
      expected: 'v4',
    },
    {
      name: 'zapier routes as generic and snapshots V1',
      mrfVersion: 2,
      webhook: { url: ZAPIER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      expected: 'v1',
    },
    {
      name: 'zapier asking for V4 snapshots as V4',
      mrfVersion: 2,
      webhook: {
        url: ZAPIER_URL,
        isRetryEnabled: true,
        webhookFormat: 'v4',
      },
      isMrfWebhooksEnabled: true,
      expected: 'v4',
    },
    {
      name: 'a generic multi-step form on the V1 shape is not delivered to at all, so it snapshots nothing',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: undefined,
    },
    {
      name: 'a one-step generic form asking for V1 snapshots as V1',
      mrfVersion: 2,
      webhook: {
        url: GENERIC_URL,
        isRetryEnabled: true,
        webhookFormat: 'v1',
      },
      isMrfWebhooksEnabled: true,
      workflowStepCount: 1,
      expected: 'v1',
    },
    {
      name: 'a generic multi-step form on the V4 shape is delivered to, so it snapshots as V4',
      mrfVersion: 2,
      webhook: {
        url: GENERIC_URL,
        isRetryEnabled: true,
        webhookFormat: 'v4',
      },
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: 'v4',
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
        getWebhookContentFormatIfEligible({
          mrfVersion,
          webhook,
          isMrfWebhooksEnabled,
          workflowStepCount,
        }),
      ).toBe(expected)
    },
  )
})

describe('shouldWriteMrfSnapshot', () => {
  it.each<{
    webhookContentFormat: SnapshotContentFormat | undefined
    isRetryEnabled?: boolean
    expected: boolean
  }>([
    { webhookContentFormat: 'v4', isRetryEnabled: true, expected: true },
    { webhookContentFormat: 'v1', isRetryEnabled: true, expected: true },
    { webhookContentFormat: 'v4', isRetryEnabled: false, expected: false },
    { webhookContentFormat: 'v1', isRetryEnabled: false, expected: false },
    {
      webhookContentFormat: 'v1',
      isRetryEnabled: undefined,
      expected: false,
    },
    {
      webhookContentFormat: undefined,
      isRetryEnabled: true,
      expected: false,
    },
  ])(
    'format=$webhookContentFormat, retries=$isRetryEnabled => $expected',
    ({ webhookContentFormat, isRetryEnabled, expected }) => {
      expect(
        shouldWriteMrfSnapshot({ webhookContentFormat, isRetryEnabled }),
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
