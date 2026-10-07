import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { SubmissionType, WorkflowStatus } from 'formsg-shared/types'
import mongoose from 'mongoose'

import getSubmissionModel, {
  getMultirespondentSubmissionModel,
} from 'src/app/models/submission.server.model'

import {
  MrfWorkflowNotPendingError,
  MrfWorkflowStoppedError,
} from '../../submission.errors'
import {
  getPendingStepRecipientEmailsFromSubmittedStepsMeta,
  stopMultirespondentSubmission,
} from '../multirespondent-submission.service'

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)

const formId = new ObjectId()
const adminId = new ObjectId().toHexString()

const createSubmission = (
  submittedSteps: Record<string, unknown>[] = [
    {
      isApproval: false,
      submittedAt: '2026-10-07T07:00:00.000Z',
      nextStepRecipientEmails: ['approver@example.com'],
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

const stop = (submissionId: unknown, form = formId) =>
  stopMultirespondentSubmission({
    formId: String(form),
    submissionId: String(submissionId),
    stoppedBy: adminId,
  })

describe('stopMultirespondentSubmission', () => {
  beforeAll(() => dbHandler.connect())
  beforeEach(() =>
    dbHandler.clearCollection(MultirespondentSubmission.collection.name),
  )
  afterAll(() => dbHandler.closeDatabase())

  it('stops a pending workflow', async () => {
    const submission = await createSubmission()

    const result = await stop(submission._id)

    const stopped = result._unsafeUnwrap()
    expect(stopped.stoppedAt).toBeInstanceOf(Date)
    expect(String(stopped.stoppedBy)).toBe(adminId)
  })

  it('rejects a workflow that is already stopped', async () => {
    const submission = await createSubmission()
    await stop(submission._id)

    const result = await stop(submission._id)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
  })

  it('rejects a workflow that is not pending', async () => {
    const submission = await createSubmission([
      { isApproval: false, submittedAt: '2026-10-07T07:00:00.000Z' },
      {
        isApproval: true,
        status: WorkflowStatus.REJECTED,
        submittedAt: '2026-10-07T08:00:00.000Z',
      },
    ])

    const result = await stop(submission._id)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
  })

  it('rejects a submission from another form', async () => {
    const submission = await createSubmission()

    const result = await stop(submission._id, new ObjectId())

    expect(result.isErr()).toBe(true)
    await expect(
      MultirespondentSubmission.findById(submission._id).lean(),
    ).resolves.not.toHaveProperty('stoppedAt')
  })

  it('fails a step save that read the submission before the stop', async () => {
    const submission = await createSubmission()
    const respondentCopy = await MultirespondentSubmission.findById(
      submission._id,
    )

    await stop(submission._id)
    respondentCopy!.submittedSteps = [
      ...(respondentCopy!.submittedSteps ?? []),
      { isApproval: false, submittedAt: '2026-10-07T09:00:00.000Z' },
    ] as typeof respondentCopy.submittedSteps

    await expect(respondentCopy!.save()).rejects.toBeInstanceOf(
      mongoose.Error.VersionError,
    )
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.submittedSteps).toHaveLength(1)
  })

  it('does not stop a submission that changed after it was read', async () => {
    const submission = await createSubmission()
    const findOneAndUpdate = MultirespondentSubmission.findOneAndUpdate.bind(
      MultirespondentSubmission,
    )
    jest
      .spyOn(MultirespondentSubmission, 'findOneAndUpdate')
      .mockImplementationOnce(((
        ...args: Parameters<typeof findOneAndUpdate>
      ) => ({
        exec: async () => {
          await MultirespondentSubmission.updateOne(
            { _id: submission._id },
            { $inc: { __v: 1 } },
          )
          return findOneAndUpdate(...args).exec()
        },
      })) as unknown as typeof findOneAndUpdate)

    const result = await stop(submission._id)

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowNotPendingError)
    await expect(
      MultirespondentSubmission.findById(submission._id).lean(),
    ).resolves.not.toHaveProperty('stoppedAt')
  })

  it('stops reminders for a stopped workflow', async () => {
    const submission = await createSubmission()
    await stop(submission._id)

    const result = await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
      submissionId: String(submission._id),
    })

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfWorkflowStoppedError)
  })

  it('returns the stop time on every admin read of the submission', async () => {
    const submission = await createSubmission()
    const stoppedAt = (await stop(submission._id))._unsafeUnwrap()
      .stoppedAt as Date

    const [single, page, mixedSingle, mixedPage, streamed] = await Promise.all([
      MultirespondentSubmission.findSingleMetadata(
        String(formId),
        String(submission._id),
      ),
      MultirespondentSubmission.findAllMetadataByFormId(String(formId)),
      SubmissionModel.findEncryptedOrMultirespondentSingleMetadata(
        String(formId),
        String(submission._id),
      ),
      SubmissionModel.findAllEncryptedOrMultirespondentMetadataByFormId(
        String(formId),
      ),
      MultirespondentSubmission.getSubmissionCursorByFormId(
        String(formId),
      ).next(),
    ])

    const expected = stoppedAt.toISOString()
    expect(single?.mrf?.stoppedAt).toEqual(expected)
    expect(page.metadata[0].mrf?.stoppedAt).toEqual(expected)
    expect(mixedSingle?.mrf?.stoppedAt).toEqual(expected)
    expect(mixedPage.metadata[0].mrf?.stoppedAt).toEqual(expected)
    expect(streamed?.stoppedAt).toEqual(stoppedAt)
  })
})
