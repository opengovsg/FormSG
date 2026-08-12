// A delayed retry must redeliver the step submission that failed, not whatever
// the live row has since been mutated into. These gates pin that the retry
// payload matches the initial send for the SAME step even after the row has
// advanced, and that what it delivers is decided by the queue message alone.
//
// Equality is asserted modulo attachment presigned URLs, which `sendWebhook`
// mints fresh per send, so byte-equality cannot hold on a fixture with
// attachments. The URL keys and their S3 targets are still compared.
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import axios, { AxiosResponse } from 'axios'
import { ObjectId } from 'bson'
import { MULTIRESPONDENT_FORM_SUBMISSION_VERSION } from 'formsg-shared/constants'
import {
  SubmissionType,
  SubmittedStepSnapshotTokens,
  WorkflowType,
} from 'formsg-shared/types'
import { omit } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'

import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import * as WebhookValidationModule from 'src/app/modules/webhook/webhook.validation'
import { IMultirespondentSubmissionSchema, WebhookView } from 'src/types'
import { WebhookData } from 'src/types/submission'

import { sendWebhook } from '../../../../webhook/webhook.service'
import {
  SnapshotAccessDeniedError,
  SnapshotDataIntegrityError,
  SnapshotFormatNotRecordedError,
  SnapshotReadError,
} from '../submission-snapshot.errors'
import { buildV4Snapshot } from '../submission-snapshot.producer'
import { SubmissionSnapshotV4 } from '../submission-snapshot.schema'
import * as SnapshotStore from '../submission-snapshot.store'
import { getWebhookPayloadPolicy } from '../webhook-payload-policy'
import { reconstructMrfWebhookData } from '../webhook-reconstruction'
import { resolveSnapshotRetryView } from '../webhook-retry-view'

jest.mock('axios')
const MockAxios = jest.mocked(axios)

jest.mock('src/app/modules/webhook/webhook.validation')
const MockWebhookValidation = jest.mocked(WebhookValidationModule)

jest.mock('../submission-snapshot.store')
const MockSnapshotStore = jest.mocked(SnapshotStore)

const MOCK_WEBHOOK_URL = 'https://plumber.gov.sg/webhooks/retry'

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

const STEP_1 = {
  encryptedContent: 'step-1-encrypted-content',
  verifiedContent: 'step-1-verified-content',
  attachmentMetadata: {
    [attachmentFieldId]: `${formId.toHexString()}/step-1-attachment`,
  },
  token: 'tok-step-1',
}
const STEP_2 = {
  encryptedContent: 'step-2-encrypted-content',
  verifiedContent: 'step-2-verified-content',
  attachmentMetadata: {
    [attachmentFieldId]: `${formId.toHexString()}/step-2-attachment`,
  },
  token: 'tok-step-2',
}
const ENCRYPTED_SUBMISSION_SECRET_KEY = 'wrapped-read-key-v4'

const staticStep = (emails: string[]) => ({
  _id: new ObjectId().toHexString(),
  workflow_type: WorkflowType.Static,
  emails,
  edit: [fieldId],
})

/**
 * Reduces each presigned URL to its path, so an attachment going missing or
 * pointing somewhere else still fails the comparison.
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
  view: WebhookView,
): Promise<WebhookData> => {
  MockAxios.post.mockClear()
  MockAxios.post.mockResolvedValue(MOCK_AXIOS_RESPONSE)

  const result = await sendWebhook(view, MOCK_WEBHOOK_URL)
  expect(result.isOk()).toBe(true)

  return (MockAxios.post.mock.calls[0][1] as WebhookView).data
}

describe('[GATE] v4 per-step retry fidelity', () => {
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
   * A row sitting at the given step, with a submittedSteps entry per step
   * submission so far. `workflowSteps` lets a loop-back workflow repeat a step
   * number while submittedSteps keeps growing.
   */
  const createRowAtStep = async ({
    latest,
    workflowStep,
    tokens,
  }: {
    latest: typeof STEP_1
    workflowStep: number
    tokens: string[]
  }): Promise<IMultirespondentSubmissionSchema> =>
    await MultirespondentSubmissionModel.create({
      form: formId,
      submissionType: SubmissionType.Multirespondent,
      form_fields: [],
      form_logics: [],
      workflow: [staticStep([]), staticStep(['next@example.com'])],
      submissionPublicKey: 'submission-public-key',
      encryptedSubmissionSecretKey: ENCRYPTED_SUBMISSION_SECRET_KEY,
      encryptedContent: latest.encryptedContent,
      verifiedContent: latest.verifiedContent,
      attachmentMetadata: new Map(Object.entries(latest.attachmentMetadata)),
      version: MULTIRESPONDENT_FORM_SUBMISSION_VERSION,
      workflowStep,
      mrfVersion: 2,
      submittedSteps: tokens.map((token, index) => ({
        isApproval: false,
        submittedAt: new Date(Date.UTC(2026, 6, 22, index)).toISOString(),
        snapshotTokens: { v4: token },
      })),
    })

  const snapshotFor = ({
    submission,
    step,
    submissionIndex,
    workflowStep,
  }: {
    submission: IMultirespondentSubmissionSchema
    step: typeof STEP_1
    submissionIndex: number
    workflowStep: number
  }): SubmissionSnapshotV4 =>
    buildV4Snapshot({
      formId: formId.toHexString(),
      submissionId: String(submission._id),
      submissionIndex,
      workflowStep,
      encryptedContent: step.encryptedContent,
      encryptedSubmissionSecretKey: ENCRYPTED_SUBMISSION_SECRET_KEY,
      verifiedContent: step.verifiedContent,
      attachmentMetadata: step.attachmentMetadata,
      createdAt: submission.submittedSteps?.[submissionIndex]
        ?.submittedAt as string,
    })

  /** The payload the initial send delivered for that step. */
  const initialSendPayload = async ({
    submission,
    snapshot,
    submissionIndex,
  }: {
    submission: IMultirespondentSubmissionSchema
    snapshot: SubmissionSnapshotV4
    submissionIndex: number
  }): Promise<WebhookData> => {
    const liveView = await submission.getWebhookView()
    return capturePostedPayload({
      data: reconstructMrfWebhookData({
        liveData: liveView.data,
        snapshot,
        submissionIndex,
        policy: getWebhookPayloadPolicy({
          webhookType: 'plumber',
          isStepWriteTokenEnabled: true,
          submissionIndex,
          submittedStepsLength: submission.submittedSteps?.length ?? 0,
        }),
      })._unsafeUnwrap(),
    })
  }

  /** The payload a retry of that step delivers, resolved from the message. */
  const retryPayload = async ({
    submission,
    submissionIndex,
    contentFormat = 'v4',
  }: {
    submission: IMultirespondentSubmissionSchema
    submissionIndex: number
    contentFormat?: 'v1' | 'v4'
  }): Promise<WebhookData> => {
    const liveView = await submission.getWebhookView()
    const view = await resolveSnapshotRetryView({
      liveView,
      submissionId: String(submission._id),
      submissionIndex,
      contentFormat,
      snapshotTokens: (submission.submittedSteps ?? []).map(
        (step) => step.snapshotTokens,
      ),
    })

    return capturePostedPayload(view._unsafeUnwrap())
  }

  it('redelivers an earlier step byte-identically once the row has advanced', async () => {
    const submission = await createRowAtStep({
      latest: STEP_1,
      workflowStep: 0,
      tokens: [STEP_1.token],
    })
    const step1Snapshot = snapshotFor({
      submission,
      step: STEP_1,
      submissionIndex: 0,
      workflowStep: 0,
    })
    const initial = await initialSendPayload({
      submission,
      snapshot: step1Snapshot,
      submissionIndex: 0,
    })

    // The row advances: step 2 overwrites the content and attachment map.
    submission.encryptedContent = STEP_2.encryptedContent
    submission.verifiedContent = STEP_2.verifiedContent
    submission.attachmentMetadata = new Map(
      Object.entries(STEP_2.attachmentMetadata),
    )
    submission.workflowStep = 1
    submission.submittedSteps?.push({
      isApproval: false,
      submittedAt: new Date(Date.UTC(2026, 6, 22, 1)).toISOString(),
      snapshotTokens: { v4: STEP_2.token },
    })
    await submission.save()

    MockSnapshotStore.readV4Snapshot.mockReturnValue(okAsync(step1Snapshot))

    const retried = await retryPayload({ submission, submissionIndex: 0 })

    expect(comparablePayload(retried)).toEqual(comparablePayload(initial))
    expect(retried.encryptedContent).toBe(STEP_1.encryptedContent)
  })

  it("presigns the retried step's own attachments, not the latest step's", async () => {
    const submission = await createRowAtStep({
      latest: STEP_2,
      workflowStep: 1,
      tokens: [STEP_1.token, STEP_2.token],
    })
    MockSnapshotStore.readV4Snapshot.mockReturnValue(
      okAsync(
        snapshotFor({
          submission,
          step: STEP_1,
          submissionIndex: 0,
          workflowStep: 0,
        }),
      ),
    )

    const retried = await retryPayload({ submission, submissionIndex: 0 })

    const presignedPaths = Object.values(
      retried.attachmentDownloadUrls ?? {},
    ).map((url) => new URL(url).pathname)
    expect(presignedPaths).toEqual([
      expect.stringContaining('step-1-attachment'),
    ])
    expect(presignedPaths).not.toEqual([
      expect.stringContaining('step-2-attachment'),
    ])
  })

  it('resolves a loop-back retry by submission index, not by the repeated workflow step', async () => {
    // Step 0 is submitted, then step 1, then the workflow loops back to step 0:
    // `workflowStep` repeats while `submissionIndex` keeps counting.
    const submission = await createRowAtStep({
      latest: STEP_2,
      workflowStep: 0,
      tokens: [STEP_1.token, 'tok-step-2', 'tok-loop-back'],
    })
    const loopBackSnapshot = snapshotFor({
      submission,
      step: STEP_2,
      submissionIndex: 2,
      workflowStep: 0,
    })
    MockSnapshotStore.readV4Snapshot.mockReturnValue(okAsync(loopBackSnapshot))

    const retried = await retryPayload({ submission, submissionIndex: 2 })

    expect(MockSnapshotStore.readV4Snapshot).toHaveBeenCalledWith(
      expect.objectContaining({ submissionIndex: 2, token: 'tok-loop-back' }),
    )
    expect(retried.encryptedContent).toBe(STEP_2.encryptedContent)
    // All three step submissions are in scope for the third one, and the first
    // step's snapshot is untouched by the loop-back.
    expect(
      (retried.workflowContent as { submittedSteps: unknown[] }).submittedSteps,
    ).toHaveLength(3)
  })

  it('delivers the shape the message names, so a v1 retry can never carry the read key', async () => {
    const submission = await createRowAtStep({
      latest: STEP_1,
      workflowStep: 0,
      tokens: [STEP_1.token],
    })
    const v4Snapshot = snapshotFor({
      submission,
      step: STEP_1,
      submissionIndex: 0,
      workflowStep: 0,
    })
    MockSnapshotStore.readV4Snapshot.mockReturnValue(
      okAsync({
        ...omit(v4Snapshot, 'encryptedSubmissionSecretKey'),
        contentFormat: 'v1' as const,
      }),
    )

    const liveView = await submission.getWebhookView()
    const retried = await resolveSnapshotRetryView({
      liveView,
      submissionId: String(submission._id),
      submissionIndex: 0,
      contentFormat: 'v1',
      // The v1 copy is recorded under its own key, so a v1 message resolves a
      // v1 object and nothing else.
      snapshotTokens: [{ v1: 'tok-v1' } as SubmittedStepSnapshotTokens],
    })

    const data = retried._unsafeUnwrap().data
    expect(data.encryptedSubmissionSecretKey).toBeUndefined()
    expect(data.version).toBe(2.1)
  })

  it('fails loud when the message names a format the step recorded no snapshot for', async () => {
    const submission = await createRowAtStep({
      latest: STEP_1,
      workflowStep: 0,
      tokens: [STEP_1.token],
    })

    const liveView = await submission.getWebhookView()
    const result = await resolveSnapshotRetryView({
      liveView,
      submissionId: String(submission._id),
      submissionIndex: 0,
      contentFormat: 'v1',
      snapshotTokens: (submission.submittedSteps ?? []).map(
        (step) => step.snapshotTokens,
      ),
    })

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      SnapshotFormatNotRecordedError,
    )
    expect(MockSnapshotStore.readV4Snapshot).not.toHaveBeenCalled()
  })

  it.each([
    ['missing or malformed', new SnapshotDataIntegrityError()],
    ['transient', new SnapshotReadError()],
    ['denied', new SnapshotAccessDeniedError()],
  ])(
    'surfaces a %s snapshot read as itself, never falling back to the live row',
    async (_case, storeError) => {
      const submission = await createRowAtStep({
        latest: STEP_2,
        workflowStep: 1,
        tokens: [STEP_1.token, STEP_2.token],
      })
      MockSnapshotStore.readV4Snapshot.mockReturnValue(errAsync(storeError))

      const liveView = await submission.getWebhookView()
      const result = await resolveSnapshotRetryView({
        liveView,
        submissionId: String(submission._id),
        submissionIndex: 0,
        contentFormat: 'v4',
        snapshotTokens: (submission.submittedSteps ?? []).map(
          (step) => step.snapshotTokens,
        ),
      })

      expect(result._unsafeUnwrapErr()).toBe(storeError)
    },
  )
})
