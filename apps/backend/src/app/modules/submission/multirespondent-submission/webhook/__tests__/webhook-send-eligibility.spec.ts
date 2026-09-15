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
    workflowStepCount: number
    expected: boolean
  }>([
    // Plumber is the privileged internal consumer: it is always delivered to,
    // whatever the workflow's shape, because V4 can represent a multi-step
    // submission.
    {
      webhookType: 'plumber',
      isMrfWebhooksEnabled: false,
      workflowStepCount: 0,
      expected: true,
    },
    {
      webhookType: 'plumber',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 3,
      expected: true,
    },
    // Every external consumer is governed by `enable-mrf-webhooks`...
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: false,
      workflowStepCount: 0,
      expected: false,
    },
    {
      webhookType: 'zapier',
      isMrfWebhooksEnabled: false,
      workflowStepCount: 1,
      expected: false,
    },
    // ...and by PIN-02's at-most-one-step predicate. No workflow, an empty
    // workflow and a one-step workflow all deliver.
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 0,
      expected: true,
    },
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 1,
      expected: true,
    },
    {
      webhookType: 'zapier',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 1,
      expected: true,
    },
    // Two or more steps delivers nothing, however the flag is set: the V1
    // wire shape cannot express a partial submission.
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: false,
    },
    {
      webhookType: 'zapier',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: false,
    },
    {
      webhookType: 'generic',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 7,
      expected: false,
    },
  ])(
    '$webhookType, flag=$isMrfWebhooksEnabled, $workflowStepCount step(s) => $expected',
    ({ webhookType, isMrfWebhooksEnabled, workflowStepCount, expected }) => {
      expect(
        shouldSendMrfWebhook({
          webhookType,
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
    webhook?: { url?: string; isRetryEnabled?: boolean }
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
      name: 'generic with enable-mrf-webhooks snapshots',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      expected: true,
    },
    {
      name: 'zapier with enable-mrf-webhooks snapshots',
      mrfVersion: 2,
      webhook: { url: ZAPIER_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      expected: true,
    },
    {
      name: 'a generic multi-step form is not delivered to, so it snapshots nothing',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: false,
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
