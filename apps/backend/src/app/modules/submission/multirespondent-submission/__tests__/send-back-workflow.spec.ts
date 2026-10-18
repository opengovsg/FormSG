import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import {
  SubmissionType,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import nacl from 'tweetnacl'
import { encodeBase64 } from 'tweetnacl-util'

import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'

import {
  MrfSendBackInvalidStepError,
  MrfWorkflowNotPendingError,
} from '../../submission.errors'
import { sendBackMultirespondentSubmission } from '../multirespondent-submission.service'
import * as StepToken from '../step-token'

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

const formId = new ObjectId()
const formPublicKey = encodeBase64(nacl.box.keyPair().publicKey)
const actor = { _id: new ObjectId(), email: 'admin@example.com' }

// Pending at step 4 of 5: steps 1-3 are submitted.
const SUBMITTED_STEPS = [
  {
    isApproval: false,
    submittedAt: '2026-10-08T01:00:00.000Z',
    nextStepRecipientEmails: ['Lead@example.com'],
  },
  {
    isApproval: false,
    submittedAt: '2026-10-08T02:00:00.000Z',
    nextStepRecipientEmails: ['finance@example.com'],
  },
  {
    isApproval: true,
    status: WorkflowStatus.APPROVED,
    submittedAt: '2026-10-08T03:00:00.000Z',
    nextStepRecipientEmails: ['director@example.com'],
  },
]

const createSubmission = (overrides: Record<string, unknown> = {}) =>
  MultirespondentSubmission.create({
    form: formId,
    submissionType: SubmissionType.Multirespondent,
    form_fields: [],
    form_logics: [],
    workflow: [1, 2, 3, 4, 5].map((n) => ({ _id: `step-${n}` })),
    submissionPublicKey: 'public-key',
    encryptedSubmissionSecretKey: 'secret-key',
    encryptedContent: 'content',
    version: 3,
    workflowStep: SUBMITTED_STEPS.length - 1,
    submittedSteps: SUBMITTED_STEPS,
    stepTokenHash: StepToken.hash('old-token'),
    ...overrides,
  })

const sendBack = (
  submissionId: unknown,
  targetStepNumber: number,
  expectedStepNumber = 4,
  remarks?: string,
) =>
  sendBackMultirespondentSubmission({
    formId: String(formId),
    formPublicKey,
    submissionId: String(submissionId),
    targetStepNumber,
    expectedStepNumber,
    remarks,
    actor,
  })

describe('sendBackMultirespondentSubmission', () => {
  beforeAll(() => dbHandler.connect())
  beforeEach(() =>
    dbHandler.clearCollection(MultirespondentSubmission.collection.name),
  )
  afterAll(() => dbHandler.closeDatabase())

  it('rewinds the workflow so the target step is pending again', async () => {
    const submission = await createSubmission()

    const result = await sendBack(submission._id, 2)

    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.submittedSteps).toHaveLength(1)
    expect(stored?.workflowStep).toBe(0)
    expect(stored?.encryptedContent).toBe('content')
    expect(result._unsafeUnwrap().recipientEmails).toEqual(['lead@example.com'])
  })

  it('records the send back with the steps it undid', async () => {
    const submission = await createSubmission()

    await sendBack(submission._id, 2, 4, 'Please fix the address')

    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.workflowEvents).toEqual([
      expect.objectContaining({
        type: WorkflowEventType.SentBack,
        actorEmail: actor.email,
        stepNumber: 2,
        fromStepNumber: 4,
        emails: ['lead@example.com'],
        remarks: 'Please fix the address',
        undoneSteps: [
          expect.objectContaining({
            stepNumber: 2,
            submittedAt: '2026-10-08T02:00:00.000Z',
            isApproval: false,
            nextStepRecipientEmails: ['finance@example.com'],
          }),
          expect.objectContaining({
            stepNumber: 3,
            isApproval: true,
            status: WorkflowStatus.APPROVED,
          }),
        ],
      }),
    ])
  })

  it('replaces the step link token so the old link stops working', async () => {
    const submission = await createSubmission()

    const result = await sendBack(submission._id, 3)

    const { stepToken } = result._unsafeUnwrap()
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(StepToken.verify(stepToken, stored!.stepTokenHash!)).toBe(true)
    expect(StepToken.verify('old-token', stored!.stepTokenHash!)).toBe(false)
    expect(stored?.encryptedStepToken).toEqual(expect.any(String))
  })

  it('emails people added to the target step as well', async () => {
    const submission = await createSubmission({
      workflowEvents: [
        {
          type: WorkflowEventType.AssigneesAdded,
          actorId: actor._id,
          actorEmail: actor.email,
          stepNumber: 2,
          emails: ['backup@example.com'],
          created: new Date(),
        },
      ],
    })

    const result = await sendBack(submission._id, 2)

    expect(result._unsafeUnwrap().recipientEmails).toEqual([
      'lead@example.com',
      'backup@example.com',
    ])
  })

  it.each([1, 4, 5])('rejects step %i as the target', async (target) => {
    const submission = await createSubmission()

    const result = await sendBack(submission._id, target)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      MrfSendBackInvalidStepError,
    )
  })

  it('rejects a page that saw an earlier pending step', async () => {
    const submission = await createSubmission()

    const result = await sendBack(submission._id, 2, 3)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.submittedSteps).toHaveLength(3)
  })

  it('rejects a stopped workflow', async () => {
    const submission = await createSubmission({ stoppedAt: new Date() })

    const result = await sendBack(submission._id, 2)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
  })

  it('rejects a workflow that was not approved', async () => {
    const submission = await createSubmission({
      submittedSteps: [
        ...SUBMITTED_STEPS.slice(0, 2),
        {
          isApproval: true,
          status: WorkflowStatus.REJECTED,
          submittedAt: '2026-10-08T03:00:00.000Z',
        },
      ],
    })

    const result = await sendBack(submission._id, 2)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
  })

  it('fails a step submit that loaded the submission before the send back', async () => {
    const submission = await createSubmission()
    const respondentCopy = await MultirespondentSubmission.findById(
      submission._id,
    )

    await sendBack(submission._id, 2)
    respondentCopy!.submittedSteps = [
      ...(respondentCopy!.submittedSteps ?? []),
      { isApproval: false, submittedAt: new Date().toISOString() },
    ] as typeof respondentCopy.submittedSteps

    await expect(respondentCopy!.save()).rejects.toBeInstanceOf(
      mongoose.Error.VersionError,
    )
  })
})
