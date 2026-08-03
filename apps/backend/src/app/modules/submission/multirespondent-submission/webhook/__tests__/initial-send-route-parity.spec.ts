// GATE — the two v4 initial-send routes must produce the same wire payload for
// the same step.
//
// Route A: snapshot-backed. A snapshot was written for the step, so the send
//   reconstructs the payload from the in-memory object plus the live row.
// Route B: no snapshot (the write-condition was false, e.g. retries disabled),
//   so the send falls through to the legacy live-row `getWebhookView`.
//
// Whether a step got a snapshot is a storage decision. It must not change what
// a consumer receives. Pinning that here is what lets S6's snapshot
// write-condition stay a one-line rule instead of a payload-shape decision —
// today the two routes agree only incidentally.
//
// Equality is asserted MODULO ATTACHMENT PRESIGNED URLS: `sendWebhook` mints a
// fresh 1-hour presigned URL per attachment at send time, each with its own
// signature and expiry, so literal byte-equality cannot hold on a fixture that
// has attachments. The URL *keys* and their S3 targets are still compared.
//
// `version` is also excluded, and pinned separately below, because the two
// routes ALREADY disagree on it on develop — see the second test for the full
// story. Excluding it is what lets this gate catch the NEXT divergence instead
// of staying red on an existing one.
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
import { getWebhookPayloadPolicy } from '../webhook-payload-policy'
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
 * Drops the two fields that are compared separately: the presigned URL values
 * (volatile by construction) and `version` (a pinned pre-existing divergence).
 * Attachment field ids and the S3 object each URL points at are KEPT, so an
 * attachment going missing or pointing somewhere else still fails the gate.
 */
const comparablePayload = (data: WebhookData): unknown => {
  const rest: Partial<WebhookData> = { ...data }
  delete rest.version
  return {
    ...rest,
    attachmentDownloadUrls: Object.fromEntries(
      Object.entries(data.attachmentDownloadUrls ?? {}).map(([key, url]) => [
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

  /**
   * A row committed by the v4 initial send: latest step, V4 content, an
   * attachment, and a recorded snapshot token.
   */
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
          snapshotToken: 'tok-parity',
        },
      ],
    })

  /** Sends the same step both ways and returns the two posted payloads. */
  const bothRoutes = async (): Promise<{
    snapshotBacked: WebhookData
    liveRow: WebhookData
  }> => {
    const submission = await createRow()
    const submissionIndex = (submission.submittedSteps?.length ?? 1) - 1

    // Route A — snapshot-backed. The snapshot is built from exactly what the
    // save committed, as the initial send does.
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
          webhookType: 'plumber',
          webhookFormat: 'v4',
          submissionIndex,
          submittedStepsLength: submission.submittedSteps?.length ?? 0,
        }),
      }),
    })

    // Route B — no snapshot for this step, so the legacy live-row view is sent.
    const liveRow = await capturePostedPayload(submission)

    return { snapshotBacked, liveRow }
  }

  it('produces the same payload whether or not the step was snapshotted', async () => {
    const { snapshotBacked, liveRow } = await bothRoutes()

    expect(comparablePayload(snapshotBacked)).toEqual(
      comparablePayload(liveRow),
    )
  })

  // KNOWN DIVERGENCE, pinned rather than fixed here.
  //
  // The snapshot route derives the wire version from the frozen content shape
  // (`contentShapeToSubmissionVersion('v4') === 3`, pinned by S4/#9744). The
  // live-row route sends the row's own `version`, which the front end sets from
  // MULTIRESPONDENT_FORM_SUBMISSION_VERSION — bumped 3 -> 4 by #9782 AFTER that
  // mapping was pinned. So the same plumber form reports 3 with retries on
  // (snapshotted) and 4 with retries off (not snapshotted).
  //
  // Reconciling them changes what plumber receives, so it is a deliberate
  // product call and not #9807's to make. This pins both values so the drift is
  // visible and any change to either is deliberate.
  it('pins the pre-existing wire-version divergence between the two routes', async () => {
    const { snapshotBacked, liveRow } = await bothRoutes()

    expect(snapshotBacked.version).toBe(3)
    expect(liveRow.version).toBe(MULTIRESPONDENT_FORM_SUBMISSION_VERSION)
    expect(MULTIRESPONDENT_FORM_SUBMISSION_VERSION).toBe(4)
  })

  it('presigns attachment URLs at send time, which is why parity is asserted modulo them', async () => {
    const submission = await createRow()

    const first = await capturePostedPayload(submission)
    const second = await capturePostedPayload(submission)

    const firstUrl = first.attachmentDownloadUrls?.[attachmentFieldId] as string
    const secondUrl = second.attachmentDownloadUrls?.[
      attachmentFieldId
    ] as string

    // A signature and an expiry are minted per send, so the query string is not
    // stable even though the object being pointed at is.
    expect(firstUrl).toContain('Signature=')
    expect(firstUrl).toContain('Expires=')
    expect(new URL(firstUrl).pathname).toBe(new URL(secondUrl).pathname)
  })
})
