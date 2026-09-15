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
    webhookFormat: FormWebhook['webhookFormat']
    isMrfWebhooksEnabled: boolean
    workflowStepCount: number
    expected: boolean
  }>([
    // Plumber is the privileged internal consumer: it is always delivered to,
    // whatever the workflow's shape, because it always resolves to V4 and V4
    // can represent one step of a multi-step submission. Its own
    // `webhookFormat` is ignored, so a V1 setting must not restrict it.
    {
      webhookType: 'plumber',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: false,
      workflowStepCount: 0,
      expected: true,
    },
    {
      webhookType: 'plumber',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: true,
      workflowStepCount: 3,
      expected: true,
    },
    {
      webhookType: 'plumber',
      webhookFormat: 'v1',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 3,
      expected: true,
    },
    // Every external consumer is governed by `enable-mrf-webhooks`, whatever
    // shape it resolves to.
    {
      webhookType: 'generic',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: false,
      workflowStepCount: 0,
      expected: false,
    },
    {
      webhookType: 'generic',
      webhookFormat: 'v4',
      isMrfWebhooksEnabled: false,
      workflowStepCount: 0,
      expected: false,
    },
    {
      webhookType: 'zapier',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: false,
      workflowStepCount: 1,
      expected: false,
    },
    // An external consumer on the V1 shape carries PIN-02's at-most-one-step
    // predicate. No workflow, an empty workflow and a one-step workflow all
    // deliver. An absent format resolves to V1, so it is restricted too.
    {
      webhookType: 'generic',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: true,
      workflowStepCount: 0,
      expected: true,
    },
    {
      webhookType: 'generic',
      webhookFormat: 'v1',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 1,
      expected: true,
    },
    {
      webhookType: 'zapier',
      webhookFormat: 'v1',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 1,
      expected: true,
    },
    // Two or more steps on the V1 shape delivers nothing, however the flag is
    // set: a storage-shaped payload cannot express a partial submission.
    {
      webhookType: 'generic',
      webhookFormat: 'v1',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: false,
    },
    {
      webhookType: 'generic',
      webhookFormat: undefined,
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: false,
    },
    {
      webhookType: 'zapier',
      webhookFormat: 'v1',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 7,
      expected: false,
    },
    // An external consumer whose form asks for V4 is not restricted at all.
    // The exemption belongs to the shape, not to plumber: this consumer gets
    // the same envelope plumber gets, so it can tell one step from a whole
    // submission just as plumber can.
    {
      webhookType: 'generic',
      webhookFormat: 'v4',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 2,
      expected: true,
    },
    {
      webhookType: 'generic',
      webhookFormat: 'v4',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 7,
      expected: true,
    },
    {
      webhookType: 'zapier',
      webhookFormat: 'v4',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 4,
      expected: true,
    },
    {
      webhookType: 'generic',
      webhookFormat: 'v4',
      isMrfWebhooksEnabled: true,
      workflowStepCount: 1,
      expected: true,
    },
  ])(
    '$webhookType/$webhookFormat, flag=$isMrfWebhooksEnabled, $workflowStepCount step(s) => $expected',
    ({
      webhookType,
      webhookFormat,
      isMrfWebhooksEnabled,
      workflowStepCount,
      expected,
    }) => {
      expect(
        shouldSendMrfWebhook({
          webhookType,
          webhookFormat,
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
      // The send path now reads the form's own setting, so the snapshot's
      // shape has to follow it: this form is delivered V1 and its snapshot
      // must be the V1 one, in the V1 store, for a retry to replay the same
      // bytes.
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
