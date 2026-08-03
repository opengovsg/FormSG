import {
  shouldSendMrfWebhook,
  shouldWriteV4Snapshot,
} from '../webhook-send-eligibility'

const PLUMBER_URL = 'https://plumber.gov.sg/webhooks/x'
const GENERIC_URL = 'https://example.com/hook'
const ZAPIER_URL = 'https://hooks.zapier.com/hooks/catch/1/x'

describe('shouldSendMrfWebhook', () => {
  it.each<{
    webhookType: 'plumber' | 'generic' | 'zapier'
    isMrfWebhooksEnabled: boolean
    isStepWriteTokenEnabled: boolean
    expected: boolean
  }>([
    {
      webhookType: 'plumber',
      isMrfWebhooksEnabled: false,
      isStepWriteTokenEnabled: false,
      expected: true,
    },
    {
      webhookType: 'plumber',
      isMrfWebhooksEnabled: false,
      isStepWriteTokenEnabled: true,
      expected: true,
    },
    {
      webhookType: 'plumber',
      isMrfWebhooksEnabled: true,
      isStepWriteTokenEnabled: false,
      expected: true,
    },
    {
      webhookType: 'plumber',
      isMrfWebhooksEnabled: true,
      isStepWriteTokenEnabled: true,
      expected: true,
    },
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: false,
      isStepWriteTokenEnabled: false,
      expected: false,
    },
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: false,
      isStepWriteTokenEnabled: true,
      expected: false,
    },
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: true,
      isStepWriteTokenEnabled: false,
      expected: false,
    },
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: true,
      isStepWriteTokenEnabled: true,
      expected: true,
    },
    {
      webhookType: 'zapier',
      isMrfWebhooksEnabled: false,
      isStepWriteTokenEnabled: false,
      expected: false,
    },
    {
      webhookType: 'zapier',
      isMrfWebhooksEnabled: false,
      isStepWriteTokenEnabled: true,
      expected: false,
    },
    {
      webhookType: 'zapier',
      isMrfWebhooksEnabled: true,
      isStepWriteTokenEnabled: false,
      expected: false,
    },
    {
      webhookType: 'zapier',
      isMrfWebhooksEnabled: true,
      isStepWriteTokenEnabled: true,
      expected: true,
    },
  ])(
    '$webhookType with enable-mrf-webhooks=$isMrfWebhooksEnabled, mrf-step-write-token=$isStepWriteTokenEnabled => $expected',
    ({
      webhookType,
      isMrfWebhooksEnabled,
      isStepWriteTokenEnabled,
      expected,
    }) => {
      expect(
        shouldSendMrfWebhook({
          webhookType,
          isMrfWebhooksEnabled,
          isStepWriteTokenEnabled,
        }),
      ).toBe(expected)
    },
  )
})

describe('shouldWriteV4Snapshot', () => {
  const bothFlagsOn = {
    isMrfWebhooksEnabled: true,
    isStepWriteTokenEnabled: true,
  }

  it.each<{
    name: string
    mrfVersion: number
    webhook?: { url?: string; isRetryEnabled?: boolean }
    isMrfWebhooksEnabled: boolean
    isStepWriteTokenEnabled: boolean
    expected: boolean
  }>([
    {
      name: 'a V3 row never snapshots',
      mrfVersion: 1,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      ...bothFlagsOn,
      expected: false,
    },
    {
      name: 'no webhook url',
      mrfVersion: 2,
      webhook: undefined,
      ...bothFlagsOn,
      expected: false,
    },
    {
      name: 'retries disabled',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: false },
      ...bothFlagsOn,
      expected: false,
    },
    {
      name: 'plumber needs no flags',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      isStepWriteTokenEnabled: false,
      expected: true,
    },
    {
      name: 'generic with no flags is never delivered, so never snapshots',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      isStepWriteTokenEnabled: false,
      expected: false,
    },
    {
      name: 'generic with only enable-mrf-webhooks is not delivered',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      isStepWriteTokenEnabled: false,
      expected: false,
    },
    {
      name: 'generic with only mrf-step-write-token is not delivered',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      isStepWriteTokenEnabled: true,
      expected: false,
    },
    {
      name: 'generic with both flags snapshots',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      ...bothFlagsOn,
      expected: true,
    },
    {
      name: 'zapier with only enable-mrf-webhooks is not delivered',
      mrfVersion: 2,
      webhook: { url: ZAPIER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      isStepWriteTokenEnabled: false,
      expected: false,
    },
    {
      name: 'zapier with both flags snapshots',
      mrfVersion: 2,
      webhook: { url: ZAPIER_URL, isRetryEnabled: true },
      ...bothFlagsOn,
      expected: true,
    },
  ])(
    '$name',
    ({
      mrfVersion,
      webhook,
      isMrfWebhooksEnabled,
      isStepWriteTokenEnabled,
      expected,
    }) => {
      expect(
        shouldWriteV4Snapshot({
          mrfVersion,
          webhook,
          isMrfWebhooksEnabled,
          isStepWriteTokenEnabled,
        }),
      ).toBe(expected)
    },
  )
})
