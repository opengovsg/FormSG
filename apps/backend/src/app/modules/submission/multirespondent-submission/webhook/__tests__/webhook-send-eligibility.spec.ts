import { FormWebhook } from 'formsg-shared/types'

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
      // An absent format resolves to V1, so there is no V4 object to write
      // even though the form is delivered to.
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
      // Delivered to, but not in this shape. A V4 object here would be the
      // wrong shape in the wrong store, and nothing is lost by declining:
      // for the V4 shape the live row is a byte-correct fallback, and the V1
      // store does not exist yet.
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
