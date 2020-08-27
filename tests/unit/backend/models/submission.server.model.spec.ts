import { ObjectID } from 'bson'
import mongoose from 'mongoose'

import getSubmissionModel from 'src/app/models/submission.server.model'

import { AuthType, SubmissionType } from '../../../../src/types'
import dbHandler from '../helpers/jest-db'

const Submission = getSubmissionModel(mongoose)

// TODO: Add more tests for the rest of the submission schema.
describe('Submission Schema', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  const MOCK_ENCRYPTED_CONTENT = 'abcdefg encryptedContent'

  describe('methods.getWebhookView', () => {
    it('should return non-null view with encryptedSubmission type (without verified content)', async () => {
      // Arrange
      const formId = new ObjectID()

      const submission = await Submission.create({
        submissionType: SubmissionType.Encrypt,
        form: formId,
        encryptedContent: MOCK_ENCRYPTED_CONTENT,
        version: 1,
        authType: AuthType.NIL,
        myInfoFields: [],
        webhookResponses: [],
      })

      // Act
      const actualWebhookView = submission.getWebhookView()

      // Assert
      expect(actualWebhookView).toEqual({
        data: {
          formId: expect.any(String),
          submissionId: expect.any(String),
          created: expect.any(Date),
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          verifiedContent: undefined,
          version: 1,
        },
      })
    })

    it('should return null view with non-encryptSubmission type', async () => {
      // Arrange
      const formId = new ObjectID()
      const submission = await Submission.create({
        submissionType: SubmissionType.Email,
        form: formId,
        encryptedContent: MOCK_ENCRYPTED_CONTENT,
        version: 1,
        authType: AuthType.NIL,
        myInfoFields: [],
        recipientEmails: [],
        responseHash: 'hash',
        responseSalt: 'salt',
        hasBounced: false,
      })

      // Act
      const actualWebhookView = submission.getWebhookView()

      // Assert
      expect(actualWebhookView).toBeNull()
    })
  })
})
