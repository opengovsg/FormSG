import { ObjectID } from 'bson'
import mongoose from 'mongoose'

import getSubmissionModel from 'src/app/models/submission.server.model'

const Submission = getSubmissionModel(mongoose)

// TODO: Add more tests for the rest of the submission schema.
describe('Submission Schema', () => {
  const MOCK_ENCRYPTED_CONTENT = 'abcdefg encryptedContent'

  describe('methods.getWebhookView', () => {
    it('should return non-null view with encryptedSubmission type (without verified content)', () => {
      // Arrange
      const formId = new ObjectID()
      const submission = new Submission({
        submissionType: 'encryptSubmission',
        form: formId,
        encryptedContent: MOCK_ENCRYPTED_CONTENT,
        version: 1,
        created: Date.now(),
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

    it('should return null view with non-encryptSubmission type', () => {
      // Arrange
      const formId = new ObjectID()
      const submission = new Submission({
        submissionType: 'rubbish',
        form: formId,
        encryptedContent: MOCK_ENCRYPTED_CONTENT,
        version: 1,
      })

      // Act
      const actualWebhookView = submission.getWebhookView()

      // Assert
      expect(actualWebhookView).toBeNull()
    })
  })
})
