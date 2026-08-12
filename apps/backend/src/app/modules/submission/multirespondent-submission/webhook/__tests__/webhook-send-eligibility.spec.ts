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
    mrfVersion: number
    isMrfWebhooksV3GenericEnabled: boolean
    expected: boolean
  }>([
    // Plumber is always delivered; its wire cutover lives in getMrfVersion
    // (mrf-step-write-token decides the stored version, wire follows).
    {
      webhookType: 'plumber',
      mrfVersion: 1,
      isMrfWebhooksV3GenericEnabled: false,
      expected: true,
    },
    {
      webhookType: 'plumber',
      mrfVersion: 1,
      isMrfWebhooksV3GenericEnabled: true,
      expected: true,
    },
    {
      webhookType: 'plumber',
      mrfVersion: 2,
      isMrfWebhooksV3GenericEnabled: false,
      expected: true,
    },
    {
      webhookType: 'plumber',
      mrfVersion: 2,
      isMrfWebhooksV3GenericEnabled: true,
      expected: true,
    },
    // Generic: v3-only, behind its own release flag.
    {
      webhookType: 'generic',
      mrfVersion: 1,
      isMrfWebhooksV3GenericEnabled: false,
      expected: false,
    },
    {
      webhookType: 'generic',
      mrfVersion: 1,
      isMrfWebhooksV3GenericEnabled: true,
      expected: true,
    },
    // A V4 row (e.g. written while the form had no webhook URL) must never
    // reach a v3 consumer, flag or no flag.
    {
      webhookType: 'generic',
      mrfVersion: 2,
      isMrfWebhooksV3GenericEnabled: false,
      expected: false,
    },
    {
      webhookType: 'generic',
      mrfVersion: 2,
      isMrfWebhooksV3GenericEnabled: true,
      expected: false,
    },
    // Zapier is treated as generic.
    {
      webhookType: 'zapier',
      mrfVersion: 1,
      isMrfWebhooksV3GenericEnabled: false,
      expected: false,
    },
    {
      webhookType: 'zapier',
      mrfVersion: 1,
      isMrfWebhooksV3GenericEnabled: true,
      expected: true,
    },
    {
      webhookType: 'zapier',
      mrfVersion: 2,
      isMrfWebhooksV3GenericEnabled: false,
      expected: false,
    },
    {
      webhookType: 'zapier',
      mrfVersion: 2,
      isMrfWebhooksV3GenericEnabled: true,
      expected: false,
    },
  ])(
    '$webhookType mrfVersion=$mrfVersion with mrf-webhooks-v3-generic=$isMrfWebhooksV3GenericEnabled => $expected',
    ({ webhookType, mrfVersion, isMrfWebhooksV3GenericEnabled, expected }) => {
      expect(
        shouldSendMrfWebhook({
          webhookType,
          mrfVersion,
          isMrfWebhooksV3GenericEnabled,
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
    isMrfWebhooksV3GenericEnabled: boolean
    expected: boolean
  }>([
    {
      name: 'a V3 row never snapshots',
      mrfVersion: 1,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      isMrfWebhooksV3GenericEnabled: true,
      expected: false,
    },
    {
      name: 'no webhook url',
      mrfVersion: 2,
      webhook: undefined,
      isMrfWebhooksV3GenericEnabled: true,
      expected: false,
    },
    {
      name: 'retries disabled',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: false },
      isMrfWebhooksV3GenericEnabled: true,
      expected: false,
    },
    {
      name: 'plumber V4 snapshots, no flags needed',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      isMrfWebhooksV3GenericEnabled: false,
      expected: true,
    },
    {
      name: 'generic V4 is never delivered, so never snapshots (flag off)',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksV3GenericEnabled: false,
      expected: false,
    },
    {
      name: 'generic V4 is never delivered, so never snapshots (flag on)',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksV3GenericEnabled: true,
      expected: false,
    },
    {
      name: 'zapier V4 is never delivered, so never snapshots (flag off)',
      mrfVersion: 2,
      webhook: { url: ZAPIER_URL, isRetryEnabled: true },
      isMrfWebhooksV3GenericEnabled: false,
      expected: false,
    },
    {
      name: 'zapier V4 is never delivered, so never snapshots (flag on)',
      mrfVersion: 2,
      webhook: { url: ZAPIER_URL, isRetryEnabled: true },
      isMrfWebhooksV3GenericEnabled: true,
      expected: false,
    },
    {
      name: 'a generic V3 row (the delivered non-plumber shape) never snapshots',
      mrfVersion: 1,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksV3GenericEnabled: true,
      expected: false,
    },
  ])(
    '$name',
    ({ mrfVersion, webhook, isMrfWebhooksV3GenericEnabled, expected }) => {
      expect(
        shouldWriteV4Snapshot({
          mrfVersion,
          webhook,
          isMrfWebhooksV3GenericEnabled,
        }),
      ).toBe(expected)
    },
  )
})
