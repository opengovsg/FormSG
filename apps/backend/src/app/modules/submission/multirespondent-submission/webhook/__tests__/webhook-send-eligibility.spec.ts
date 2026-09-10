import { WebhookType } from 'src/app/modules/webhook/webhook.service'

import {
  shouldSendMrfWebhook,
  shouldWriteV4Snapshot,
} from '../webhook-send-eligibility'

const PLUMBER_URL = 'https://plumber.gov.sg/webhooks/x'
const GENERIC_URL = 'https://example.com/hook'
const ZAPIER_URL = 'https://hooks.zapier.com/hooks/catch/1/x'

describe('shouldSendMrfWebhook', () => {
  it.each<{
    webhookType: WebhookType
    isMrfWebhooksEnabled: boolean
    expected: boolean
  }>([
    {
      webhookType: 'plumber',
      isMrfWebhooksEnabled: false,
      expected: true,
    },
    {
      webhookType: 'plumber',
      isMrfWebhooksEnabled: true,
      expected: true,
    },
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: false,
      expected: false,
    },
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: true,
      expected: true,
    },
    {
      webhookType: 'zapier',
      isMrfWebhooksEnabled: false,
      expected: false,
    },
    {
      webhookType: 'zapier',
      isMrfWebhooksEnabled: true,
      expected: true,
    },
  ])(
    '$webhookType with enable-mrf-webhooks=$isMrfWebhooksEnabled => $expected',
    ({ webhookType, isMrfWebhooksEnabled, expected }) => {
      expect(
        shouldSendMrfWebhook({
          webhookType,
          isMrfWebhooksEnabled,
        }),
      ).toBe(expected)
    },
  )
})

describe('shouldWriteV4Snapshot', () => {
  it.each<{
    name: string
    mrfVersion: number
    webhook?: { url?: string; isRetryEnabled?: boolean }
    isMrfWebhooksEnabled: boolean
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
      name: 'generic with the flag off is never delivered, so never snapshots',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      expected: false,
    },
    {
      name: 'generic with enable-mrf-webhooks snapshots',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      expected: true,
    },
    {
      name: 'zapier with the flag off is never delivered, so never snapshots',
      mrfVersion: 2,
      webhook: { url: ZAPIER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: false,
      expected: false,
    },
    {
      name: 'zapier with enable-mrf-webhooks snapshots',
      mrfVersion: 2,
      webhook: { url: ZAPIER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      expected: true,
    },
  ])('$name', ({ mrfVersion, webhook, isMrfWebhooksEnabled, expected }) => {
    expect(
      shouldWriteV4Snapshot({
        mrfVersion,
        webhook,
        isMrfWebhooksEnabled,
      }),
    ).toBe(expected)
  })
})
