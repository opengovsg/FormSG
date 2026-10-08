import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import {
  SubmissionType,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'
import { WORKFLOW_ACTIONS_CUTOFF } from 'formsg-shared/utils/workflow-actions'
import mongoose from 'mongoose'

import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import getWorkflowEventModel from 'src/app/models/workflow_event.server.model'

import {
  MrfAssigneeAlreadyAssignedError,
  MrfWorkflowNotPendingError,
} from '../../submission.errors'
import {
  addAssigneesToPendingStep,
  getPendingStepRecipientEmailsFromSubmittedStepsMeta,
  stopMultirespondentSubmission,
} from '../multirespondent-submission.service'

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)
const WorkflowEvent = getWorkflowEventModel(mongoose)

const formId = new ObjectId()
const actor = { _id: new ObjectId(), email: 'admin@example.com' }

const createSubmission = (
  submittedSteps: Record<string, unknown>[] = [
    {
      isApproval: false,
      submittedAt: '2026-10-08T07:00:00.000Z',
      nextStepRecipientEmails: ['Lead@example.com'],
    },
  ],
) =>
  MultirespondentSubmission.create({
    form: formId,
    submissionType: SubmissionType.Multirespondent,
    form_fields: [],
    form_logics: [],
    workflow: [{ _id: 'step-1' }, { _id: 'step-2' }, { _id: 'step-3' }],
    submissionPublicKey: 'public-key',
    encryptedSubmissionSecretKey: 'secret-key',
    encryptedContent: 'content',
    version: 3,
    workflowStep: submittedSteps.length - 1,
    submittedSteps,
    created: new Date(WORKFLOW_ACTIONS_CUTOFF.getTime() + 1000),
  })

const add = (submissionId: unknown, emails: string[]) =>
  addAssigneesToPendingStep({
    formId: String(formId),
    submissionId: String(submissionId),
    emails,
    actor,
  })

describe('addAssigneesToPendingStep', () => {
  beforeAll(() => dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearCollection(MultirespondentSubmission.collection.name)
    await dbHandler.clearCollection(WorkflowEvent.collection.name)
  })
  afterAll(() => dbHandler.closeDatabase())

  it('records the added people against the pending step', async () => {
    const submission = await createSubmission()

    const result = await add(submission._id, ['new@example.com'])

    expect(result._unsafeUnwrap().stepNumber).toBe(2)
    const events = await WorkflowEvent.find({ submissionId: submission._id })
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: WorkflowEventType.AssigneesAdded,
      stepNumber: 2,
      emails: ['new@example.com'],
      actorEmail: actor.email,
    })
  })

  it('rejects people the step was already sent to', async () => {
    const submission = await createSubmission()

    const result = await add(submission._id, ['lead@example.com'])

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      MrfAssigneeAlreadyAssignedError,
    )
    expect(result._unsafeUnwrapErr().message).toBe(
      'lead@example.com is already assigned to this step.',
    )
  })

  it('rejects people added to the step earlier', async () => {
    const submission = await createSubmission()
    await add(submission._id, ['new@example.com'])

    const result = await add(submission._id, ['new@example.com'])

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      MrfAssigneeAlreadyAssignedError,
    )
  })

  it('rejects a stopped workflow', async () => {
    const submission = await createSubmission()
    await stopMultirespondentSubmission({
      formId: String(formId),
      submissionId: String(submission._id),
      stoppedBy: String(actor._id),
    })

    const result = await add(submission._id, ['new@example.com'])

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
  })

  it('rejects a workflow that is no longer pending', async () => {
    const submission = await createSubmission([
      { isApproval: false, submittedAt: '2026-10-08T07:00:00.000Z' },
      {
        isApproval: true,
        status: WorkflowStatus.REJECTED,
        submittedAt: '2026-10-08T08:00:00.000Z',
      },
    ])

    const result = await add(submission._id, ['new@example.com'])

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
  })

  it('includes added people in reminders for the step', async () => {
    const submission = await createSubmission()
    await add(submission._id, ['new@example.com'])

    const result = await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
      submissionId: String(submission._id),
    })

    expect(result._unsafeUnwrap().recipientEmails).toEqual([
      'Lead@example.com',
      'new@example.com',
    ])
  })
})
