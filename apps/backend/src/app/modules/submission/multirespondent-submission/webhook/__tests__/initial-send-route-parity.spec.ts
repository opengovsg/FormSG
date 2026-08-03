// Whether a step got a snapshot is a storage decision, so it must not change
// what a consumer receives: a snapshot-backed send (reconstructed from the
// frozen object) and a live-row send (legacy `getWebhookView`) must produce the
// same wire payload for the same step.
//
// Equality is asserted modulo attachment presigned URLs, which `sendWebhook`
// mints fresh per send, so byte-equality cannot hold on a fixture with
// attachments. The URL keys and their S3 targets are still compared.
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import axios, { AxiosResponse } from 'axios'
import { ObjectId } from 'bson'
import { MULTIRESPONDENT_FORM_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { SubmissionType, WorkflowType } from 'formsg-shared/types'
import mongoose from 'mongoose'

import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import * as WebhookValidationModule from 'src/app/modules/webhook/webhook.validation'
import { IMultirespondentSubmissionSchema, WebhookView } from 'src/types'
import { WebhookData } from 'src/types/submission'

import { sendWebhook } from '../../../../webhook/webhook.service'
import { buildV4Snapshot } from '../submission-snapshot.producer'
import {
  getWebhookPayloadPolicy,
  WebhookConsumerType,
} from '../webhook-payload-policy'
import { reconstructMrfWebhookData } from '../webhook-reconstruction'

jest.mock('axios')
const MockAxios = jest.mocked(axios)

jest.mock('src/app/modules/webhook/webhook.validation')
const MockWebhookValidation = jest.mocked(WebhookValidationModule)

const MOCK_WEBHOOK_URL = 'https://plumber.gov.sg/webhooks/parity'

const MOCK_AXIOS_RESPONSE = {
  data: { result: 'ok' },
  status: 200,
  statusText: 'success',
  headers: {},
  config: {},
} as AxiosResponse

const MultirespondentSubmissionModel =
  getMultirespondentSubmissionModel(mongoose)

const formId = new ObjectId()
const fieldId = new ObjectId().toHexString()
const attachmentFieldId = new ObjectId().toHexString()

const ENCRYPTED_CONTENT = 'v4-encrypted-content'
const ENCRYPTED_SUBMISSION_SECRET_KEY = 'wrapped-read-key-v4'
const VERIFIED_CONTENT = 'v4-verified-content'
const ATTACHMENT_METADATA = {
  [attachmentFieldId]: `${formId.toHexString()}/attachment-object-key`,
}

const workflow = [
  {
    _id: new ObjectId().toHexString(),
    workflow_type: WorkflowType.Static,
    emails: [],
    edit: [fieldId],
  },
  {
    _id: new ObjectId().toHexString(),
    workflow_type: WorkflowType.Static,
    emails: ['next@example.com'],
    edit: [fieldId],
  },
]

/**
 * Reduces each presigned URL to its path, so an attachment going missing or
 * pointing somewhere else still fails the comparison. Preserves undefined when
 * the field is absent so undefined vs {} remains a detectable shape mismatch.
 */
const comparablePayload = (data: WebhookData): unknown => {
  if (data.attachmentDownloadUrls === undefined) {
    return { ...data }
  }
  return {
    ...data,
    attachmentDownloadUrls: Object.fromEntries(
      Object.entries(data.attachmentDownloadUrls).map(([key, url]) => [
        key,
        new URL(url).pathname,
      ]),
    ),
  }
}

const capturePostedPayload = async (
  submission: IMultirespondentSubmissionSchema,
  view?: WebhookView,
): Promise<WebhookData> => {
  MockAxios.post.mockClear()
  MockAxios.post.mockResolvedValue(MOCK_AXIOS_RESPONSE)

  const liveView = view ?? (await submission.getWebhookView())
  const result = await sendWebhook(liveView, MOCK_WEBHOOK_URL)
  expect(result.isOk()).toBe(true)

  return (MockAxios.post.mock.calls[0][1] as WebhookView).data
}

describe('[GATE] v4 initial-send route parity', () => {
  beforeAll(async () => {
    await dbHandler.connect()
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.clearAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  beforeEach(() => {
    MockWebhookValidation.validateWebhookUrl.mockResolvedValue(undefined)
  })

  const createRow = async (): Promise<IMultirespondentSubmissionSchema> =>
    await MultirespondentSubmissionModel.create({
      form: formId,
      submissionType: SubmissionType.Multirespondent,
      form_fields: [],
      form_logics: [],
      workflow,
      submissionPublicKey: 'submission-public-key',
      encryptedSubmissionSecretKey: ENCRYPTED_SUBMISSION_SECRET_KEY,
      encryptedContent: ENCRYPTED_CONTENT,
      verifiedContent: VERIFIED_CONTENT,
      attachmentMetadata: new Map(Object.entries(ATTACHMENT_METADATA)),
      version: MULTIRESPONDENT_FORM_SUBMISSION_VERSION,
      workflowStep: 0,
      mrfVersion: 2,
      submittedSteps: [
        {
          isApproval: false,
          submittedAt: new Date().toISOString(),
          snapshotTokens: { v4: 'tok-parity' },
        },
      ],
    })

  const bothRoutes = async (
    webhookType: WebhookConsumerType = 'plumber',
  ): Promise<{
    snapshotBacked: WebhookData
    liveRow: WebhookData
  }> => {
    const submission = await createRow()
    const submissionIndex = (submission.submittedSteps?.length ?? 1) - 1

    const snapshot = buildV4Snapshot({
      formId: formId.toHexString(),
      submissionId: String(submission._id),
      submissionIndex,
      workflowStep: submission.workflowStep,
      encryptedContent: ENCRYPTED_CONTENT,
      encryptedSubmissionSecretKey: ENCRYPTED_SUBMISSION_SECRET_KEY,
      verifiedContent: VERIFIED_CONTENT,
      attachmentMetadata: ATTACHMENT_METADATA,
      createdAt: submission.submittedSteps?.[submissionIndex]
        ?.submittedAt as string,
    })
    const liveView = await submission.getWebhookView()
    const snapshotBacked = await capturePostedPayload(submission, {
      data: reconstructMrfWebhookData({
        liveData: liveView.data,
        snapshot,
        submissionIndex,
        policy: getWebhookPayloadPolicy({
          webhookType,
          isStepWriteTokenEnabled: true,
          submissionIndex,
          submittedStepsLength: submission.submittedSteps?.length ?? 0,
        }),
      })._unsafeUnwrap(),
    })

    // Route B — no snapshot for this step, so the live-row view is sent.
    const liveRow = await capturePostedPayload(submission)

    return { snapshotBacked, liveRow }
  }

  it.each<WebhookConsumerType>(['plumber', 'generic'])(
    'produces the same payload whether or not the step was snapshotted (%s)',
    async (webhookType) => {
      const { snapshotBacked, liveRow } = await bothRoutes(webhookType)

      expect(comparablePayload(snapshotBacked)).toEqual(
        comparablePayload(liveRow),
      )
    },
  )

  it.each<WebhookConsumerType>(['plumber', 'generic'])(
    'derives the wire version from mrfVersion identically on both routes (%s)',
    async (webhookType) => {
      const { snapshotBacked, liveRow } = await bothRoutes(webhookType)

      expect(snapshotBacked.version).toBe(4)
      expect(liveRow.version).toBe(4)
    },
  )

  it('ships the read key but never a step token, for either consumer class', async () => {
    for (const webhookType of ['plumber', 'generic'] as WebhookConsumerType[]) {
      const { snapshotBacked, liveRow } = await bothRoutes(webhookType)

      for (const payload of [snapshotBacked, liveRow]) {
        expect(payload.encryptedSubmissionSecretKey).toBeDefined()
        expect(
          (payload as unknown as Record<string, unknown>)['encryptedStepToken'],
        ).toBeUndefined()
      }
    }
  })
})
