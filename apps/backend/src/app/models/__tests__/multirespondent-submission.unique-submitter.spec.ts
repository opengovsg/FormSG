import replSetDbHandler from '__tests__/unit/backend/helpers/jest-replset-db'
import { ObjectId } from 'bson'
import { SubmissionType } from 'formsg-shared/types'
import mongoose from 'mongoose'

import {
  getEncryptSubmissionModel,
  getMultirespondentSubmissionModel,
} from 'src/app/models/submission.server.model'

const EncryptSubmission = getEncryptSubmissionModel(mongoose)
const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

const SUBMITTER_ID = 'hashed-submitter-id'

const buildMrfContent = (formId: ObjectId) =>
  ({
    form: formId,
    submissionType: SubmissionType.Multirespondent,
    form_fields: [],
    form_logics: [],
    workflow: [],
    submissionPublicKey: 'public-key',
    encryptedSubmissionSecretKey: 'secret-key',
    encryptedContent: 'content',
    version: 3,
    workflowStep: 0,
    submittedSteps: [
      {
        isApproval: false,
        submittedAt: '2026-11-02T00:00:00.000Z',
        submitterId: SUBMITTER_ID,
      },
    ],
  }) as unknown as Parameters<
    typeof MultirespondentSubmission.saveIfSubmitterIdIsUnique
  >[3]

describe('MultirespondentSubmission.saveIfSubmitterIdIsUnique', () => {
  beforeAll(() =>
    replSetDbHandler.connect([MultirespondentSubmission, EncryptSubmission]),
  )
  afterEach(() => replSetDbHandler.clearDatabase())
  afterAll(() => replSetDbHandler.closeDatabase())

  it('saves the first step 1 submission for a submitter', async () => {
    const formId = new ObjectId()

    const saved = await MultirespondentSubmission.saveIfSubmitterIdIsUnique(
      String(formId),
      SUBMITTER_ID,
      0,
      buildMrfContent(formId),
    )

    expect(saved).not.toBeNull()
    await expect(
      MultirespondentSubmission.countDocuments({ form: formId }),
    ).resolves.toBe(1)
  })

  it('refuses a second step 1 submission from the same submitter', async () => {
    const formId = new ObjectId()
    await MultirespondentSubmission.saveIfSubmitterIdIsUnique(
      String(formId),
      SUBMITTER_ID,
      0,
      buildMrfContent(formId),
    )

    const second = await MultirespondentSubmission.saveIfSubmitterIdIsUnique(
      String(formId),
      SUBMITTER_ID,
      0,
      buildMrfContent(formId),
    )

    expect(second).toBeNull()
    await expect(
      MultirespondentSubmission.countDocuments({ form: formId }),
    ).resolves.toBe(1)
  })

  it('refuses step 1 when the submitter has a pre-migration storage response', async () => {
    const formId = new ObjectId()
    await EncryptSubmission.create({
      form: formId,
      submissionType: SubmissionType.Encrypt,
      encryptedContent: 'content',
      version: 1,
      submitterId: SUBMITTER_ID,
    })

    const saved = await MultirespondentSubmission.saveIfSubmitterIdIsUnique(
      String(formId),
      SUBMITTER_ID,
      0,
      buildMrfContent(formId),
    )

    expect(saved).toBeNull()
    await expect(
      MultirespondentSubmission.countDocuments({ form: formId }),
    ).resolves.toBe(0)
  })
})
