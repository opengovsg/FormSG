import replSetDbHandler from '__tests__/unit/backend/helpers/jest-replset-db'
import { ObjectId } from 'bson'
import { SubmissionType } from 'formsg-shared/types'
import mongoose from 'mongoose'

import getSubmissionModel, {
  getEncryptSubmissionModel,
  getMultirespondentSubmissionModel,
} from 'src/app/models/submission.server.model'

const Submission = getSubmissionModel(mongoose)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)
const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

const SUBMITTER_ID = 'hashed-submitter-id'

const MODELS = [
  {
    name: 'EncryptSubmission',
    model: EncryptSubmission,
    buildContent: (form: ObjectId) => ({
      form,
      submissionType: SubmissionType.Encrypt,
      encryptedContent: 'content',
      version: 1,
      submitterId: SUBMITTER_ID,
    }),
  },
] as const

describe.each(MODELS)(
  '$name.saveIfSubmitterIdIsUnique',
  ({ model, buildContent }) => {
    const save = (formId: ObjectId) =>
      (
        model.saveIfSubmitterIdIsUnique as (
          formId: string,
          submitterId: string,
          content: unknown,
        ) => Promise<unknown>
      )(String(formId), SUBMITTER_ID, buildContent(formId))

    // Await every compiled model's index build; a build still running when the
    // first transaction starts trips mongo's 5ms transaction lock timeout.
    beforeAll(() =>
      replSetDbHandler.connect([
        Submission,
        EncryptSubmission,
        MultirespondentSubmission,
      ]),
    )
    afterEach(() => replSetDbHandler.clearDatabase())
    afterAll(() => replSetDbHandler.closeDatabase())

    it('saves the first submission for a submitter', async () => {
      const formId = new ObjectId()

      await expect(save(formId)).resolves.not.toBeNull()
      await expect(model.countDocuments({ form: formId })).resolves.toBe(1)
    })

    it('refuses a second submission from the same submitter', async () => {
      const formId = new ObjectId()
      await save(formId)

      await expect(save(formId)).resolves.toBeNull()
      await expect(model.countDocuments({ form: formId })).resolves.toBe(1)
    })

    it('saves a submission from the same submitter on another form', async () => {
      const formId = new ObjectId()
      await save(new ObjectId())

      await expect(save(formId)).resolves.not.toBeNull()
      await expect(model.countDocuments({ form: formId })).resolves.toBe(1)
    })
  },
)
