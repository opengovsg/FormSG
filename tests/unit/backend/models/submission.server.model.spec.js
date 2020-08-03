const mongoose = require('mongoose')
const dbHandler = require('../helpers/db-handler')

const Submission = dbHandler.makeModel('submission.server.model', 'Submission')

// TODO: Add more tests for the rest of the submission schema.
describe('Submission Schema', () => {
  const MOCK_ENCRYPTED_CONTENT = 'abcdefg encryptedContent'

  describe('methods.getWebhookView', () => {
    it('should return non-null view with encryptedSubmission type (without verified content)', () => {
      // Arrange
      const formId = mongoose.Types.ObjectId('000000000001')
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
          formId: jasmine.any(String),
          submissionId: jasmine.any(String),
          created: jasmine.any(Date),
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          verifiedContent: undefined,
          version: 1,
        },
      })
    })

    it('should return null view with non-encryptSubmission type', () => {
      // Arrange
      const formId = mongoose.Types.ObjectId('000000000001')
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
