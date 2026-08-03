import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { StatusTrackerData, WorkflowStatus } from 'formsg-shared/types'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'

import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import * as MultirespondentSubmissionService from 'src/app/modules/submission/multirespondent-submission/multirespondent-submission.service'

import { handleGetStatusTracker } from '../status-tracker.controller'

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

// The controller is exported as a celebrate array; the handler is last.
const getStatusTrackerSubmissionData = handleGetStatusTracker[
  handleGetStatusTracker.length - 1
] as (req: unknown, res: unknown) => Promise<unknown>

describe('status-tracker.controller', () => {
  afterEach(() => jest.restoreAllMocks())

  it('omits the internal snapshotToken and respondent emails from the response body', async () => {
    // Arrange: a real (unsaved) mongoose document, so the controller sees the
    // subdocument shape it sees in production.
    const submission = new MultirespondentSubmission({
      form: new ObjectId(),
      form_fields: [],
      form_logics: [],
      workflow: [],
      submissionPublicKey: 'public key',
      encryptedSubmissionSecretKey: 'secret key',
      encryptedContent: 'encrypted content',
      version: 1,
      workflowStep: 1,
      submittedSteps: [
        {
          isApproval: true,
          submittedAt: '2026-07-22T00:00:00.000Z',
          status: WorkflowStatus.APPROVED,
          nextStepRecipientEmails: ['next@example.com'],
          submitterId: 'SUBMITTER_ID_HASH',
          snapshotToken: 'SNAPSHOT_TOKEN_LEAF_VALUE',
        },
      ],
    })

    jest
      .spyOn(MultirespondentSubmissionService, 'getMultirespondentSubmission')
      .mockReturnValue(okAsync(submission))

    const mockReq = expressHandler.mockRequest({
      params: { submissionId: String(submission._id) },
    })
    const mockRes = expressHandler.mockResponse()

    // Act
    await getStatusTrackerSubmissionData(mockReq, mockRes)

    // Assert
    const body = mockRes.json.mock.calls[0][0] as StatusTrackerData
    expect(body.submittedSteps).toEqual([
      {
        isApproval: true,
        submittedAt: '2026-07-22T00:00:00.000Z',
        status: WorkflowStatus.APPROVED,
        submitterId: 'SUBMITTER_ID_HASH',
      },
    ])
    const serialised = JSON.stringify(body)
    expect(serialised).not.toContain('SNAPSHOT_TOKEN_LEAF_VALUE')
    expect(serialised).not.toContain('next@example.com')
  })
})
