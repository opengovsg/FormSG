import { ObjectId } from 'bson'
import { promises as dns } from 'dns'
import { times } from 'lodash'
import mongoose from 'mongoose'

import getSubmissionModel, {
  getEmailSubmissionModel,
  getEncryptSubmissionModel,
} from 'src/app/models/submission.server.model'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import {
  FormAuthType,
  SubmissionType,
  WebhookResponse,
} from '../../../../shared/types'
import { ISubmissionSchema } from '../../../../src/types'

jest.mock('dns', () => ({
  promises: {
    resolve: jest.fn(),
  },
}))
const MockDns = jest.mocked(dns)

const Submission = getSubmissionModel(mongoose)
const EncryptedSubmission = getEncryptSubmissionModel(mongoose)
const EmailSubmission = getEmailSubmissionModel(mongoose)

// TODO: Add more tests for the rest of the submission schema.
describe('Submission Model', () => {
  beforeAll(async () => {
    await dbHandler.connect()
    MockDns.resolve.mockResolvedValue(['1.1.1.1'])
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  const MOCK_ENCRYPTED_CONTENT = 'abcdefg encryptedContent'
  const MOCK_VERIFIED_CONTENT = 'hijklmnop verifiedContent'
  const MOCK_WEBHOOK_URL = 'https://test.web.site'

  describe('Statics', () => {
    describe('retrieveWebhookInfoById', () => {
      it('should return the populated submission when the submission and webhook URL exist', async () => {
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            webhook: {
              url: MOCK_WEBHOOK_URL,
              isRetryEnabled: true,
            },
          },
        })
        const submission = await EncryptedSubmission.create({
          form: form._id,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 0,
        })

        const result = await EncryptedSubmission.retrieveWebhookInfoById(
          String(submission._id),
        )

        expect(result).toEqual({
          webhookUrl: MOCK_WEBHOOK_URL,
          isRetryEnabled: true,
          webhookView: {
            data: {
              attachmentDownloadUrls: {},
              formId: String(form._id),
              submissionId: String(submission._id),
              encryptedContent: MOCK_ENCRYPTED_CONTENT,
              verifiedContent: undefined,
              version: 0,
              created: submission.created,
            },
          },
        })
      })

      it('should return null when the submission ID does not exist', async () => {
        // Create submission
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            webhook: {
              url: MOCK_WEBHOOK_URL,
              isRetryEnabled: true,
            },
          },
        })
        await EncryptedSubmission.create({
          form: form._id,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 0,
        })

        // Attempt to find submission with a different ID
        const result = await EncryptedSubmission.retrieveWebhookInfoById(
          String(new ObjectId().toHexString()),
        )

        expect(result).toBeNull()
      })

      it('should return empty string for the webhook URL when the form does not have a webhook URL', async () => {
        const { form } = await dbHandler.insertEncryptForm()
        const submission = await EncryptedSubmission.create({
          form: form._id,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 0,
        })

        const result = await EncryptedSubmission.retrieveWebhookInfoById(
          String(submission._id),
        )

        expect(result).toEqual({
          webhookUrl: '',
          isRetryEnabled: false,
          webhookView: {
            data: {
              attachmentDownloadUrls: {},
              formId: String(form._id),
              submissionId: String(submission._id),
              encryptedContent: MOCK_ENCRYPTED_CONTENT,
              verifiedContent: undefined,
              version: 0,
              created: submission.created,
            },
          },
        })
      })

      it('should return false for isRetryEnabled when the form does not have retries enabled', async () => {
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            webhook: {
              url: MOCK_WEBHOOK_URL,
              isRetryEnabled: false,
            },
          },
        })
        const submission = await EncryptedSubmission.create({
          form: form._id,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 0,
        })

        const result = await EncryptedSubmission.retrieveWebhookInfoById(
          String(submission._id),
        )

        expect(result).toEqual({
          webhookUrl: MOCK_WEBHOOK_URL,
          isRetryEnabled: false,
          webhookView: {
            data: {
              attachmentDownloadUrls: {},
              formId: String(form._id),
              submissionId: String(submission._id),
              encryptedContent: MOCK_ENCRYPTED_CONTENT,
              verifiedContent: undefined,
              version: 0,
              created: submission.created,
            },
          },
        })
      })
    })

    describe('findFormsWithSubsAbove', () => {
      it('should return ids and counts of forms with more than given minimum submissions', async () => {
        // Arrange
        const formCounts = [4, 2, 4]
        const formIdsAndCounts = times(formCounts.length, (it) => ({
          _id: mongoose.Types.ObjectId(),
          count: formCounts[it],
        }))
        const submissionPromises: Promise<ISubmissionSchema>[] = []
        formIdsAndCounts.forEach(({ count, _id: formId }) => {
          times(count, () =>
            submissionPromises.push(
              Submission.create({
                form: formId,
                myInfoFields: [],
                submissionType: SubmissionType.Email,
                responseHash: 'hash',
                responseSalt: 'salt',
              }),
            ),
          )
        })
        await Promise.all(submissionPromises)
        const minSubCount = 3

        // Act
        const actualResult = await Submission.findFormsWithSubsAbove(
          minSubCount,
        )

        // Assert
        const expectedResult = formIdsAndCounts.filter(
          ({ count }) => count > minSubCount,
        )
        expect(actualResult).toEqual(expect.arrayContaining(expectedResult))
      })

      it('should return an empty array if no forms have submission counts higher than given count', async () => {
        // Arrange
        const formCounts = [1, 1, 2]
        const formIdsAndCounts = times(formCounts.length, (it) => ({
          _id: mongoose.Types.ObjectId(),
          count: formCounts[it],
        }))
        const submissionPromises: Promise<ISubmissionSchema>[] = []
        formIdsAndCounts.forEach(({ count, _id: formId }) => {
          times(count, () =>
            submissionPromises.push(
              Submission.create({
                form: formId,
                myInfoFields: [],
                submissionType: SubmissionType.Email,
                responseHash: 'hash',
                responseSalt: 'salt',
              }),
            ),
          )
        })
        await Promise.all(submissionPromises)
        // Tests for greater than, should not return even if equal to some
        // submission count.
        const minSubCount = 2

        // Act
        const actualResult = await Submission.findFormsWithSubsAbove(
          minSubCount,
        )

        // Assert
        expect(actualResult).toEqual([])
      })
    })
  })

  describe('Methods', () => {
    describe('getWebhookView', () => {
      it('should return non-null view with encryptedSubmission type when submission has no verified content', async () => {
        // Arrange
        const formId = new ObjectId()

        const submission = await EncryptedSubmission.create({
          submissionType: SubmissionType.Encrypt,
          form: formId,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 1,
          authType: FormAuthType.NIL,
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
            attachmentDownloadUrls: {},
            version: 1,
          },
        })
      })

      it('should return non-null view with encryptedSubmission type when submission has verified content', async () => {
        // Arrange
        const formId = new ObjectId()

        const submission = await EncryptedSubmission.create({
          submissionType: SubmissionType.Encrypt,
          form: formId,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          verifiedContent: MOCK_VERIFIED_CONTENT,
          version: 1,
          authType: FormAuthType.NIL,
          myInfoFields: [],
          webhookResponses: [],
        })

        // Act
        const actualWebhookView = submission.getWebhookView()

        // Assert
        expect(actualWebhookView).toEqual({
          data: {
            attachmentDownloadUrls: {},
            formId: expect.any(String),
            submissionId: expect.any(String),
            created: expect.any(Date),
            encryptedContent: MOCK_ENCRYPTED_CONTENT,
            verifiedContent: MOCK_VERIFIED_CONTENT,
            version: 1,
          },
        })
      })

      it('should return non-null view with encryptedSubmission type when submission is populated with webhook info', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            webhook: {
              url: MOCK_WEBHOOK_URL,
              isRetryEnabled: false,
            },
          },
        })

        const submission = await EncryptedSubmission.create({
          submissionType: SubmissionType.Encrypt,
          form: form._id,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          verifiedContent: MOCK_VERIFIED_CONTENT,
          version: 1,
          authType: FormAuthType.NIL,
          myInfoFields: [],
          webhookResponses: [],
        })

        const populatedSubmission = await EncryptedSubmission.findById(
          submission._id,
        ).populate('form', 'webhook')

        // Act
        const actualWebhookView = populatedSubmission!.getWebhookView()

        // Assert
        expect(actualWebhookView).toEqual({
          data: {
            attachmentDownloadUrls: {},
            formId: expect.any(String),
            submissionId: expect.any(String),
            created: expect.any(Date),
            encryptedContent: MOCK_ENCRYPTED_CONTENT,
            verifiedContent: MOCK_VERIFIED_CONTENT,
            version: 1,
          },
        })
      })

      it('should return null view with non-encryptSubmission type', async () => {
        // Arrange
        const formId = new ObjectId()
        const submission = await EmailSubmission.create({
          submissionType: SubmissionType.Email,
          form: formId,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 1,
          authType: FormAuthType.NIL,
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

    describe('addWebhookResponse', () => {
      it('should return updated submission with webhook response when submission ID is valid', async () => {
        // Arrange
        const formId = new ObjectId()
        const submission = await EncryptedSubmission.create({
          submissionType: SubmissionType.Encrypt,
          form: formId,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 1,
          authType: FormAuthType.NIL,
          myInfoFields: [],
          recipientEmails: [],
          responseHash: 'hash',
          responseSalt: 'salt',
          hasBounced: false,
        })

        const webhookResponse = new Object({
          _id: submission._id,
          created: submission.created,
          signature: 'some signature',
          webhookUrl: 'https://form.gov.sg/endpoint',
          response: {
            data: '{"result":"test-result"}',
            status: 200,
            headers: '{}',
          },
        }) as WebhookResponse

        // Act
        const actualSubmission = await EncryptedSubmission.addWebhookResponse(
          submission._id,
          webhookResponse,
        )
        const webhookResponses = actualSubmission!.toObject().webhookResponses!

        // Assert
        expect(webhookResponses[0].signature).toEqual(webhookResponse.signature)
        expect(webhookResponses[0].webhookUrl).toEqual(
          webhookResponse.webhookUrl,
        )
        expect(webhookResponses[0].response).toEqual(webhookResponse.response)
      })

      it('should return null when submission id is invalid', async () => {
        // Arrange
        const formId = new ObjectId()
        const submission = await EncryptedSubmission.create({
          submissionType: SubmissionType.Encrypt,
          form: formId,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 1,
          authType: FormAuthType.NIL,
          myInfoFields: [],
          recipientEmails: [],
          responseHash: 'hash',
          responseSalt: 'salt',
          hasBounced: false,
        })

        const webhookResponse = {
          _id: submission._id,
          created: submission.created,
          signature: 'some signature',
          webhookUrl: 'https://form.gov.sg/endpoint',
          response: {
            status: 200,
            headers: '',
            data: '',
          },
        } as WebhookResponse

        const invalidSubmissionId = new ObjectId().toHexString()

        // Act
        const actualSubmission = await EncryptedSubmission.addWebhookResponse(
          invalidSubmissionId,
          webhookResponse,
        )

        // Assert
        expect(actualSubmission).toBeNull()
      })
    })
  })
})
