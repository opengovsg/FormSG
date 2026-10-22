import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import {
  BasicField,
  SubmissionType,
  WorkflowEventType,
  WorkflowStatus,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'

import formsgSdk from 'src/app/config/formsg-sdk'
import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'

import {
  MrfAssigneeAlreadyAssignedError,
  MrfWorkflowNotPendingError,
} from '../../submission.errors'
import {
  addAssigneesToPendingStep,
  getPendingStepRecipientEmailsFromSubmittedStepsMeta,
  MAX_REMINDERS_PER_STEP,
  stopMultirespondentSubmission,
} from '../multirespondent-submission.service'
import { buildV4Snapshot } from '../webhook/submission-snapshot.producer'
import { reconstructMrfWebhookData } from '../webhook/webhook-reconstruction'

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

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
  })

const add = (
  submissionId: unknown,
  emails: string[],
  expectedStepNumber = 2,
  submissionSecretKey = 'unused-for-persisted-recipients',
) =>
  addAssigneesToPendingStep({
    formId: String(formId),
    submissionId: String(submissionId),
    submissionSecretKey,
    emails,
    expectedStepNumber,
    actor,
  })

describe('addAssigneesToPendingStep', () => {
  beforeAll(() => dbHandler.connect())
  beforeEach(() =>
    dbHandler.clearCollection(MultirespondentSubmission.collection.name),
  )
  afterAll(() => dbHandler.closeDatabase())

  const createLegacySubmission = async (
    workflowType: WorkflowType,
    v4 = false,
  ) => {
    const submission = await createSubmission()
    const fieldId = new ObjectId().toHexString()
    const conditional = workflowType === WorkflowType.Conditional
    const fieldType = conditional ? BasicField.Dropdown : BasicField.Email
    const value = conditional ? 'Finance' : 'Lead@example.com'
    const { publicKey } = formsgSdk.cryptoV3.generate()
    const encrypted = formsgSdk.cryptoV3.encrypt(
      {
        [fieldId]: v4
          ? {
              fieldType,
              question: 'Recipient',
              answer: { value },
              provenance: {},
            }
          : { fieldType, answer: conditional ? value : { value } },
      },
      publicKey,
    )
    await MultirespondentSubmission.collection.updateOne(
      { _id: submission._id },
      {
        $unset: { 'submittedSteps.0.nextStepRecipientEmails': '' },
        $set: {
          encryptedContent: encrypted.encryptedContent,
          version: 1,
          workflow: [
            { _id: 'step-1' },
            {
              _id: 'step-2',
              workflow_type: workflowType,
              emails: ['Lead@example.com'],
              field: fieldId,
              conditional_field: fieldId,
            },
            { _id: 'step-3' },
          ],
          form_fields: [
            {
              _id: new ObjectId(fieldId),
              fieldType,
              optionsToRecipientsMap: { Finance: ['Lead@example.com'] },
            },
          ],
        },
      },
    )
    return { submission, submissionSecretKey: encrypted.submissionSecretKey }
  }

  it.each([
    [WorkflowType.Static, false],
    [WorkflowType.Dynamic, false],
    [WorkflowType.Dynamic, true],
    [WorkflowType.Conditional, false],
    [WorkflowType.Conditional, true],
  ])(
    'preserves original recipients for legacy %s routing (V4: %s)',
    async (type, v4) => {
      const { submission, submissionSecretKey } = await createLegacySubmission(
        type,
        v4,
      )
      const result = await add(
        submission._id,
        ['bob@example.com'],
        2,
        submissionSecretKey,
      )
      expect(result.isOk()).toBe(true)
      const stored = await MultirespondentSubmission.findById(
        submission._id,
      ).orFail()
      expect(stored.submittedSteps?.[0].nextStepRecipientEmails).toEqual([
        'Lead@example.com',
        'bob@example.com',
      ])
      expect(stored.workflowEvents).toHaveLength(1)
      expect(stored.workflowEvents?.[0].emails).toEqual(['bob@example.com'])
    },
  )

  it('rejects an original recipient on a legacy submission without creating an event', async () => {
    const { submission } = await createLegacySubmission(WorkflowType.Static)
    const result = await add(submission._id, ['lead@example.com'])
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      MrfAssigneeAlreadyAssignedError,
    )
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(stored.submittedSteps?.[0].nextStepRecipientEmails).toBeUndefined()
    expect(stored.workflowEvents ?? []).toHaveLength(0)
  })

  it('does not replace missing dynamic recipients when decryption fails', async () => {
    const { submission } = await createLegacySubmission(WorkflowType.Dynamic)
    const result = await add(submission._id, ['bob@example.com'])
    expect(result.isErr()).toBe(true)
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(stored.submittedSteps?.[0].nextStepRecipientEmails).toBeUndefined()
    expect(stored.workflowEvents ?? []).toHaveLength(0)
  })

  it('keeps both concurrent additions and audit events on a legacy submission', async () => {
    const { submission } = await createLegacySubmission(WorkflowType.Static)
    const results = await Promise.all([
      add(submission._id, ['bob@example.com']),
      add(submission._id, ['carol@example.com']),
    ])
    expect(results.every((result) => result.isOk())).toBe(true)
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(stored.submittedSteps?.[0].nextStepRecipientEmails?.sort()).toEqual([
      'Lead@example.com',
      'bob@example.com',
      'carol@example.com',
    ])
    expect(stored.workflowEvents?.map((event) => event.emails)).toEqual(
      expect.arrayContaining([['bob@example.com'], ['carol@example.com']]),
    )
    expect(stored.workflowEvents).toHaveLength(2)
  })

  it('preserves missing routing metadata when loading legacy submissions', async () => {
    const submission = await createSubmission()
    await MultirespondentSubmission.collection.updateOne(
      { _id: submission._id },
      { $unset: { 'submittedSteps.0.nextStepRecipientEmails': '' } },
    )
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(stored.submittedSteps?.[0].nextStepRecipientEmails).toBeUndefined()
  })

  it('preserves an explicitly empty recipient list', async () => {
    const submission = await createSubmission([
      {
        isApproval: false,
        submittedAt: '2026-10-08T07:00:00.000Z',
        nextStepRecipientEmails: [],
      },
    ])
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(stored.submittedSteps?.[0].nextStepRecipientEmails).toEqual([])
    const result = await add(submission._id, ['bob@example.com'])
    expect(
      result._unsafeUnwrap().submission.submittedSteps?.[0]
        .nextStepRecipientEmails,
    ).toEqual(['bob@example.com'])
  })

  it('records the added people against the pending step', async () => {
    const submission = await createSubmission()

    const result = await add(submission._id, ['new@example.com'])

    expect(result._unsafeUnwrap().stepNumber).toBe(2)
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(stored?.workflowEvents).toHaveLength(1)
    expect(stored?.workflowEvents?.[0]).toMatchObject({
      type: WorkflowEventType.AssigneesAdded,
      stepNumber: 2,
      emails: ['new@example.com'],
      actorEmail: actor.email,
    })
    expect(stored?.submittedSteps?.[0].nextStepRecipientEmails).toEqual([
      'Lead@example.com',
      'new@example.com',
    ])
    const webhook = await stored.getWebhookView()
    expect(
      webhook.data.workflowContent?.submittedSteps?.[0].nextStepRecipientEmails,
    ).toEqual(['Lead@example.com', 'new@example.com'])
  })

  it('includes reassigned recipients when rebuilding an earlier webhook delivery', async () => {
    const submission = await createSubmission()
    const snapshot = buildV4Snapshot({
      formId: String(formId),
      submissionId: String(submission._id),
      submissionIndex: 0,
      workflowStep: 0,
      encryptedContent: 'original-content',
      encryptedSubmissionSecretKey: 'secret-key',
      formFields: {},
      createdAt: '2026-10-08T07:00:00.000Z',
    })
    await add(submission._id, ['new@example.com'])
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    const liveView = await stored.getWebhookView()
    const retry = reconstructMrfWebhookData({
      liveData: liveView.data,
      snapshot,
      submissionIndex: 0,
      policy: {
        contentFormat: 'v4',
        includeEncryptedSubmissionSecretKey: true,
      },
    })._unsafeUnwrap()
    expect(
      retry.workflowContent?.submittedSteps?.[0].nextStepRecipientEmails,
    ).toEqual(['Lead@example.com', 'new@example.com'])
    expect(retry.encryptedContent).toBe('original-content')
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
      actor,
      emails: [],
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

  it('rejects a page that saw an earlier step', async () => {
    const submission = await createSubmission([
      {
        isApproval: false,
        submittedAt: '2026-10-08T07:00:00.000Z',
        nextStepRecipientEmails: ['a@example.com'],
      },
      {
        isApproval: false,
        submittedAt: '2026-10-08T08:00:00.000Z',
        nextStepRecipientEmails: ['finance@example.com'],
      },
    ])

    const result = await add(submission._id, ['b@example.com'], 2)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(stored.workflowEvents).toHaveLength(0)
  })

  it('adds the same person only once when two adds race', async () => {
    const submission = await createSubmission()

    const results = await Promise.all([
      add(submission._id, ['new@example.com']),
      add(submission._id, ['new@example.com']),
    ])

    expect(results.filter((result) => result.isOk())).toHaveLength(1)
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(stored?.workflowEvents).toHaveLength(1)
    expect(stored?.submittedSteps?.[0].nextStepRecipientEmails).toEqual([
      'Lead@example.com',
      'new@example.com',
    ])
  })

  it('preserves both additions when different people are added concurrently', async () => {
    const submission = await createSubmission()
    const results = await Promise.all([
      add(submission._id, ['first@example.com']),
      add(submission._id, ['second@example.com']),
    ])

    expect(results.every((result) => result.isOk())).toBe(true)
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(stored?.submittedSteps?.[0].nextStepRecipientEmails).toEqual(
      expect.arrayContaining([
        'Lead@example.com',
        'first@example.com',
        'second@example.com',
      ]),
    )
    expect(stored?.workflowEvents).toHaveLength(2)
    expect(stored.workflowEvents).toEqual(
      expect.arrayContaining(
        ['first@example.com', 'second@example.com'].map((email) =>
          expect.objectContaining({
            type: WorkflowEventType.AssigneesAdded,
            stepNumber: 2,
            emails: [email],
            actorEmail: actor.email,
          }),
        ),
      ),
    )
  })

  it('prevents a stale step submission from overwriting reassigned recipients', async () => {
    const submission = await createSubmission()
    await add(submission._id, ['new@example.com'])
    submission.submittedSteps = [
      ...(submission.submittedSteps ?? []),
      { isApproval: false, submittedAt: '2026-10-08T08:00:00.000Z' },
    ]

    await expect(submission.save()).rejects.toBeInstanceOf(
      mongoose.Error.VersionError,
    )
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(stored?.submittedSteps).toHaveLength(1)
    expect(stored?.submittedSteps?.[0].nextStepRecipientEmails).toContain(
      'new@example.com',
    )
    expect(stored.workflowEvents).toHaveLength(1)
    expect(stored.workflowEvents?.[0]).toMatchObject({
      type: WorkflowEventType.AssigneesAdded,
      stepNumber: 2,
      emails: ['new@example.com'],
      actorEmail: actor.email,
    })
  })

  it('updates only the recipients of the pending step', async () => {
    const submission = await createSubmission([
      {
        isApproval: false,
        submittedAt: '2026-10-08T07:00:00.000Z',
        nextStepRecipientEmails: ['earlier@example.com'],
      },
      {
        isApproval: false,
        submittedAt: '2026-10-08T08:00:00.000Z',
        nextStepRecipientEmails: ['pending@example.com'],
      },
    ])

    await add(submission._id, ['new@example.com'], 3)
    const stored = await MultirespondentSubmission.findById(
      submission._id,
    ).orFail()
    expect(
      stored?.submittedSteps?.map((step) => step.nextStepRecipientEmails),
    ).toEqual([
      ['earlier@example.com'],
      ['pending@example.com', 'new@example.com'],
    ])
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

  it('ignores step submissions when counting reminders and choosing who to remind', async () => {
    const submission = await createSubmission()
    const pendingStepNumber = 2
    const reminder = {
      type: WorkflowEventType.ReminderSent,
      actorId: actor._id,
      actorEmail: actor.email,
      stepNumber: pendingStepNumber,
      emails: ['Lead@example.com'],
      created: new Date(),
    }
    const stepSubmitted = {
      type: WorkflowEventType.StepSubmitted,
      outcome: WorkflowStatus.COMPLETED,
      stepNumber: pendingStepNumber,
      emails: ['routed@example.com'],
      created: new Date(),
    }
    await MultirespondentSubmission.updateOne(
      { _id: submission._id },
      {
        $set: {
          workflowEvents: [
            ...Array(MAX_REMINDERS_PER_STEP - 1).fill(reminder),
            stepSubmitted,
          ],
        },
      },
    )

    const result = await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
      submissionId: String(submission._id),
    })

    expect(result._unsafeUnwrap().recipientEmails).toEqual(['Lead@example.com'])
  })
})
