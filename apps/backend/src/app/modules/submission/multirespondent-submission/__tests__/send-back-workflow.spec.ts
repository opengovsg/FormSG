import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import {
  SubmissionType,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'
import { omit } from 'lodash'
import mongoose from 'mongoose'

import formsgSdk from 'src/app/config/formsg-sdk'
import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'

import {
  MrfAssigneeAlreadyAssignedError,
  MrfSendBackInvalidStepError,
  MrfWorkflowNotPendingError,
} from '../../submission.errors'
import { buildMrfMetadata } from '../../submission.utils'
import {
  addAssigneesToPendingStep,
  getPendingStepRecipientEmailsFromSubmittedStepsMeta,
  sendBackMultirespondentSubmission,
  stopMultirespondentSubmission,
} from '../multirespondent-submission.service'
import * as StepToken from '../step-token'

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

const formId = new ObjectId()
const actor = { _id: new ObjectId(), email: 'admin@example.com' }
const { publicKey: formPublicKey } = formsgSdk.crypto.generate()

const SUBMITTED_STEPS = [
  {
    isApproval: false,
    submittedAt: '2026-10-08T01:00:00.000Z',
    nextStepRecipientEmails: ['Lead@example.com'],
  },
  {
    isApproval: true,
    status: WorkflowStatus.APPROVED,
    submittedAt: '2026-10-08T02:00:00.000Z',
    nextStepRecipientEmails: ['finance@example.com'],
  },
  {
    isApproval: false,
    submittedAt: '2026-10-08T03:00:00.000Z',
    nextStepRecipientEmails: ['director@example.com'],
  },
]

const STEP_SUBMITTED_EVENTS = SUBMITTED_STEPS.map((step, index) => ({
  type: WorkflowEventType.StepSubmitted,
  stepNumber: index + 1,
  outcome: step.status ?? WorkflowStatus.COMPLETED,
  emails: step.nextStepRecipientEmails,
  created: new Date(step.submittedAt),
  snapshotKey: `key-step-${index + 1}`,
}))

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
    workflowEvents: STEP_SUBMITTED_EVENTS,
    stepTokenHash: StepToken.hash('old-token'),
    ...overrides,
  })

const sendBack = (
  submissionId: unknown,
  targetStepNumber: number,
  {
    expectedStepNumber = 4,
    remarks,
    stepOneRecipientEmail,
    canSendBackToStepOne = true,
  }: {
    expectedStepNumber?: number
    remarks?: string
    stepOneRecipientEmail?: string
    canSendBackToStepOne?: boolean
  } = {},
) =>
  sendBackMultirespondentSubmission({
    formId: String(formId),
    formPublicKey,
    submissionId: String(submissionId),
    targetStepNumber,
    expectedStepNumber,
    remarks,
    stepOneRecipientEmail,
    canSendBackToStepOne,
    actor,
  })

describe('sendBackMultirespondentSubmission', () => {
  beforeAll(() => dbHandler.connect())
  beforeEach(() =>
    dbHandler.clearCollection(MultirespondentSubmission.collection.name),
  )
  afterEach(() => jest.restoreAllMocks())
  afterAll(() => dbHandler.closeDatabase())

  it('rewinds to the target step and keeps the undone steps as events', async () => {
    const submission = await createSubmission()

    const result = await sendBack(submission._id, 2, {
      remarks: 'Please fix the dates',
    })

    expect(result._unsafeUnwrap()).toEqual({
      stepNumber: 2,
      emails: ['lead@example.com'],
      stepToken: expect.any(String),
    })
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).lean()
    expect(stored?.submittedSteps).toHaveLength(1)
    expect(stored?.workflowStep).toBe(0)
    expect(stored?.encryptedContent).toBe('content')
    expect(stored?.workflowEvents).toEqual([
      ...STEP_SUBMITTED_EVENTS.map((event) => expect.objectContaining(event)),
      expect.objectContaining({
        type: WorkflowEventType.SentBack,
        actorEmail: actor.email,
        stepNumber: 2,
        fromStepNumber: 4,
        emails: ['lead@example.com'],
        remarks: 'Please fix the dates',
      }),
    ])
  })

  it('backfills step events without snapshot links before undoing steps', async () => {
    const submission = await createSubmission({ workflowEvents: [] })

    await sendBack(submission._id, 2)

    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).lean()
    expect(stored?.submittedSteps).toHaveLength(1)
    expect(stored?.workflowEvents).toEqual([
      ...STEP_SUBMITTED_EVENTS.map((event) =>
        expect.objectContaining(omit(event, 'snapshotKey')),
      ),
      expect.objectContaining({
        type: WorkflowEventType.SentBack,
        stepNumber: 2,
        fromStepNumber: 4,
      }),
    ])
    expect(
      stored?.workflowEvents?.some((event) => 'snapshotKey' in event),
    ).toBe(false)
  })

  it('backfills only the steps that have no event yet', async () => {
    const submission = await createSubmission({
      workflowEvents: [STEP_SUBMITTED_EVENTS[0]],
    })

    await sendBack(submission._id, 2)

    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).lean()
    expect(
      stored?.workflowEvents?.map((event) => [
        event.type,
        event.stepNumber,
        'snapshotKey' in event ? event.snapshotKey : undefined,
      ]),
    ).toEqual([
      [WorkflowEventType.StepSubmitted, 1, 'key-step-1'],
      [WorkflowEventType.StepSubmitted, 2, undefined],
      [WorkflowEventType.StepSubmitted, 3, undefined],
      [WorkflowEventType.SentBack, 2, undefined],
    ])
  })

  it('replaces the step token so only the new link works', async () => {
    const submission = await createSubmission()

    const { stepToken } = (await sendBack(submission._id, 3))._unsafeUnwrap()

    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(StepToken.verify(stepToken, stored!.stepTokenHash!)).toBe(true)
    expect(StepToken.verify('old-token', stored!.stepTokenHash!)).toBe(false)
    expect(stored?.encryptedStepToken).toEqual(expect.any(String))
  })

  it('emails people added to the target step as well', async () => {
    const submission = await createSubmission({
      workflowEvents: [
        ...STEP_SUBMITTED_EVENTS,
        {
          type: WorkflowEventType.AssigneesAdded,
          actorId: actor._id,
          actorEmail: actor.email,
          stepNumber: 2,
          emails: ['Backup@example.com'],
          created: new Date(),
        },
      ],
    })

    const result = await sendBack(submission._id, 2)

    expect(result._unsafeUnwrap().emails).toEqual([
      'lead@example.com',
      'backup@example.com',
    ])
  })

  it('leaves remarks off the event when none are given', async () => {
    const submission = await createSubmission()

    await sendBack(submission._id, 2, { remarks: '' })

    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).lean()
    expect(stored?.workflowEvents?.at(-1)).not.toHaveProperty('remarks')
  })

  it.each([
    ['step 1 without an email', 1],
    ['step 0', 0],
    ['the pending step', 4],
    ['a later step', 5],
  ])('rejects sending back to %s', async (_label, targetStepNumber) => {
    const submission = await createSubmission()

    const result = await sendBack(submission._id, targetStepNumber)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      MrfSendBackInvalidStepError,
    )
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.submittedSteps).toHaveLength(3)
  })

  describe('to step 1', () => {
    it('rewinds every step and sends step 1 to the entered email', async () => {
      const submission = await createSubmission()

      const result = await sendBack(submission._id, 1, {
        stepOneRecipientEmail: 'Applicant@example.com',
      })

      expect(result._unsafeUnwrap()).toMatchObject({
        stepNumber: 1,
        emails: ['applicant@example.com'],
      })
      const stored = await MultirespondentSubmission.findById(
        submission._id,
      ).lean()
      expect(stored?.submittedSteps).toEqual([])
      expect(stored?.workflowStep).toBe(-1)
      expect(stored?.encryptedContent).toBe('content')
      expect(stored?.workflowEvents?.at(-1)).toMatchObject({
        type: WorkflowEventType.SentBack,
        stepNumber: 1,
        fromStepNumber: 4,
        emails: ['applicant@example.com'],
      })
    })

    it('refuses step 1 on a form with a login', async () => {
      const submission = await createSubmission()

      const result = await sendBack(submission._id, 1, {
        stepOneRecipientEmail: 'applicant@example.com',
        canSendBackToStepOne: false,
      })

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MrfSendBackInvalidStepError,
      )
      const stored = await MultirespondentSubmission.findById(submission._id)
      expect(stored?.submittedSteps).toHaveLength(3)
    })

    it('refuses step 1 when it was submitted with a login', async () => {
      const submission = await createSubmission({
        verifiedContent: 'encrypted-singpass-identity',
      })

      const result = await sendBack(submission._id, 1, {
        stepOneRecipientEmail: 'applicant@example.com',
      })

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MrfSendBackInvalidStepError,
      )
      const stored = await MultirespondentSubmission.findById(submission._id)
      expect(stored?.submittedSteps).toHaveLength(3)
    })

    it('can send back from step 2 pending', async () => {
      const submission = await createSubmission({
        submittedSteps: [SUBMITTED_STEPS[0]],
        workflowStep: 0,
      })

      const result = await sendBack(submission._id, 1, {
        expectedStepNumber: 2,
        stepOneRecipientEmail: 'applicant@example.com',
      })

      expect(result.isOk()).toBe(true)
    })

    it('stays pending at step 1, so it can be stopped', async () => {
      const submission = await createSubmission()
      await sendBack(submission._id, 1, {
        stepOneRecipientEmail: 'applicant@example.com',
      })

      const stored = await MultirespondentSubmission.findById(submission._id)
      expect(
        buildMrfMetadata({
          workflow: stored!.workflow,
          workflowStep: stored!.workflowStep,
          submittedSteps: stored!.submittedSteps,
          stoppedAt: stored!.stoppedAt,
        }),
      ).toMatchObject({
        workflowStatus: WorkflowStatus.PENDING,
        workflowCurrentStepNumber: 0,
      })
      const stopped = await stopMultirespondentSubmission({
        formId: String(formId),
        submissionId: String(submission._id),
        actor,
        emails: [],
      })
      expect(stopped.isOk()).toBe(true)
    })

    it('reminds and reassigns step 1 using the entered email', async () => {
      const submission = await createSubmission()
      await sendBack(submission._id, 1, {
        stepOneRecipientEmail: 'applicant@example.com',
      })

      const reminder =
        await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
          submissionId: String(submission._id),
        })
      expect(reminder._unsafeUnwrap()).toEqual({
        recipientEmails: ['applicant@example.com'],
        reminderStepNumber: 1,
      })
      const duplicate = await addAssigneesToPendingStep({
        formId: String(formId),
        submissionId: String(submission._id),
        emails: ['applicant@example.com'],
        expectedStepNumber: 1,
        actor,
      })
      expect(duplicate._unsafeUnwrapErr()).toBeInstanceOf(
        MrfAssigneeAlreadyAssignedError,
      )
    })
  })

  it('rejects a page that saw an earlier pending step', async () => {
    const submission = await createSubmission()

    const result = await sendBack(submission._id, 2, { expectedStepNumber: 3 })

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
  })

  it.each([
    ['stopped', { stoppedAt: new Date() }],
    ['missing recorded steps', { workflowStep: 3 }],
  ])('rejects a %s workflow', async (_label, overrides) => {
    const submission = await createSubmission(overrides)

    const result = await sendBack(submission._id, 2)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.submittedSteps).toHaveLength(3)
  })

  it('rejects a workflow ended by a rejection', async () => {
    const submission = await createSubmission({
      submittedSteps: [
        SUBMITTED_STEPS[0],
        { ...SUBMITTED_STEPS[1], status: WorkflowStatus.REJECTED },
      ],
      workflowStep: 1,
    })

    const result = await sendBack(submission._id, 2, { expectedStepNumber: 3 })

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
  })

  it('fails when the workflow changed after it was read', async () => {
    const submission = await createSubmission()
    const findById = MultirespondentSubmission.findById.bind(
      MultirespondentSubmission,
    )
    jest.spyOn(MultirespondentSubmission, 'findById').mockImplementationOnce(((
      id: unknown,
    ) => ({
      exec: () =>
        findById(id)
          .exec()
          .then(async (doc) => {
            await MultirespondentSubmission.updateOne(
              { _id: id },
              { $inc: { __v: 1 } },
            )
            return doc
          }),
    })) as unknown as typeof MultirespondentSubmission.findById)

    const result = await sendBack(submission._id, 2)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.submittedSteps).toHaveLength(3)
    expect(
      stored?.workflowEvents?.some(
        ({ type }) => type === WorkflowEventType.SentBack,
      ),
    ).toBe(false)
  })
})
