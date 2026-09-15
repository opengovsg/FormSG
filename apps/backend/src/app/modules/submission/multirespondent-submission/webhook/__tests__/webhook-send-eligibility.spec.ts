import { FormWebhook } from 'formsg-shared/types'

import { WebhookType } from 'src/app/modules/webhook/webhook.service'

import { SnapshotContentFormat } from '../submission-snapshot.schema'
import {
  holdsV1FirstStepInvariant,
  resolveMrfSnapshotShape,
  shouldSendMrfWebhook,
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

describe('resolveMrfSnapshotShape', () => {
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
      name: 'retries disabled writes no V4 snapshot',
      mrfVersion: 2,
      webhook: { url: PLUMBER_URL, isRetryEnabled: false },
      isMrfWebhooksEnabled: true,
      expected: undefined,
    },
    {
      name: 'retries disabled writes no V1 snapshot either — PIN-16 keeps the retry term for both shapes at this site',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: false },
      isMrfWebhooksEnabled: true,
      expected: undefined,
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
      name: 'a generic multi-step form is not delivered to, so it snapshots nothing',
      mrfVersion: 2,
      webhook: { url: GENERIC_URL, isRetryEnabled: true },
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: undefined,
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
        resolveMrfSnapshotShape({
          mrfVersion,
          webhook,
          isMrfWebhooksEnabled,
          workflowStepCount,
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
