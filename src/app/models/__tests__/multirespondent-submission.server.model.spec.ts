import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { pick, times } from 'lodash'
import moment from 'moment-timezone'
import mongoose from 'mongoose'
import { SubmissionMetadata, SubmissionType } from 'shared/types'

import getSubmissionModel, {
  getEmailSubmissionModel,
  getMultirespondentSubmissionModel,
} from 'src/app/models/submission.server.model'
import { IMultirespondentSubmissionSchema } from 'src/types'

const Submission = getSubmissionModel(mongoose)
const EmailSubmission = getEmailSubmissionModel(mongoose)
const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)

describe('Multirespondent Submission Model', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  const MOCK_SUBMISSION_PUBLIC_KEY = 'This is a public key'
  const MOCK_ENCRYPTED_SUBMISSION_SECRET_KEY = 'This is an encrypted secret key'
  const MOCK_ENCRYPTED_CONTENT = 'abcdefg encryptedContent'

  describe('Statics', () => {
    describe('findSingleMetadata', () => {
      it('should return submission metadata', async () => {
        // Arrange
        const validFormId = new ObjectId().toHexString()
        const createdDate = new Date()
        // Add valid multirespondent submission.
        const validSubmission = await MultirespondentSubmission.create({
          form: validFormId,
          submissionType: SubmissionType.Multirespondent,
          form_fields: [],
          form_logics: [],
          workflow: [],
          submissionPublicKey: MOCK_SUBMISSION_PUBLIC_KEY,
          encryptedSubmissionSecretKey: MOCK_ENCRYPTED_SUBMISSION_SECRET_KEY,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 3,
          created: createdDate,
          workflowStep: 0,
        })

        // Act
        const result = await MultirespondentSubmission.findSingleMetadata(
          validFormId,
          validSubmission._id,
        )

        // Assert
        const expected: SubmissionMetadata = {
          number: 1,
          payments: null,
          refNo: validSubmission._id,
          submissionTime: moment(createdDate)
            .tz('Asia/Singapore')
            .format('Do MMM YYYY, h:mm:ss a'),
        }
        expect(result).toEqual(expected)
      })

      it('should return null when submission is of SubmissionType.Email', async () => {
        // Arrange
        const validFormId = new ObjectId().toHexString()
        // Add email submission.
        const validSubmission = await Submission.create({
          form: validFormId,
          myInfoFields: [],
          // Email type.
          submissionType: SubmissionType.Email,
          responseHash: 'hash',
          responseSalt: 'salt',
        })

        // Act
        const result = await MultirespondentSubmission.findSingleMetadata(
          validFormId,
          validSubmission._id,
        )

        // Assert
        expect(result).toBeNull()
      })

      it('should return null if no submission metadata is retrieved', async () => {
        // Arrange
        const validFormId = new ObjectId().toHexString()
        const invalidSubmissionId = new ObjectId().toHexString()
        // Act
        const result = await MultirespondentSubmission.findSingleMetadata(
          validFormId,
          invalidSubmissionId,
        )

        // Assert
        expect(result).toBeNull()
      })
    })

    describe('findAllMetadataByFormId', () => {
      const VALID_FORM_ID = new ObjectId().toHexString()
      const MOCK_CREATED_DATES_ASC = [
        new Date('2020-01-01'),
        new Date('2020-02-02'),
        new Date('2020-03-03'),
      ]

      it('should return all metadata and count successfully when params are not provided', async () => {
        // Arrange
        // Add 3 valid multirespondent submissions.
        const validSubmissionPromises = times(3, (idx) =>
          MultirespondentSubmission.create({
            form: VALID_FORM_ID,
            submissionType: SubmissionType.Multirespondent,
            form_fields: [],
            form_logics: [],
            workflow: [],
            submissionPublicKey: MOCK_SUBMISSION_PUBLIC_KEY,
            encryptedSubmissionSecretKey: MOCK_ENCRYPTED_SUBMISSION_SECRET_KEY,
            encryptedContent: MOCK_ENCRYPTED_CONTENT,
            version: 3,
            created: MOCK_CREATED_DATES_ASC[idx],
            workflowStep: 0,
          }),
        )
        const validSubmissions: IMultirespondentSubmissionSchema[] =
          await Promise.all(validSubmissionPromises)

        // Act
        const actual = await MultirespondentSubmission.findAllMetadataByFormId(
          VALID_FORM_ID,
        )

        // Assert
        const expected = {
          count: validSubmissions.length,
          // Create expected shape, sorted by date in descending order.
          metadata: validSubmissions
            .map((data, idx) => ({
              number: idx + 1,
              payments: null,
              refNo: data._id,
              submissionTime: moment(data.created)
                .tz('Asia/Singapore')
                .format('Do MMM YYYY, h:mm:ss a'),
            }))
            .reverse(),
        }
        expect(actual).toEqual(expected)
      })

      it('should return offset metadata with correct count when page number is provided', async () => {
        // Arrange
        // Add 3 valid multirespondent submissions.
        const validSubmissionPromises = times(3, (idx) =>
          MultirespondentSubmission.create({
            form: VALID_FORM_ID,
            submissionType: SubmissionType.Multirespondent,
            form_fields: [],
            form_logics: [],
            workflow: [],
            submissionPublicKey: MOCK_SUBMISSION_PUBLIC_KEY,
            encryptedSubmissionSecretKey: MOCK_ENCRYPTED_SUBMISSION_SECRET_KEY,
            encryptedContent: MOCK_ENCRYPTED_CONTENT,
            version: 3,
            created: MOCK_CREATED_DATES_ASC[idx],
            workflowStep: 0,
          }),
        )
        const validSubmissions: IMultirespondentSubmissionSchema[] =
          await Promise.all(validSubmissionPromises)

        // Act
        const actual = await MultirespondentSubmission.findAllMetadataByFormId(
          VALID_FORM_ID,
          // Only show one metadata, page 2.
          { pageSize: 1, page: 2 },
        )

        // Assert
        const secondSubmission = validSubmissions[1]
        const expected = {
          count: validSubmissions.length,
          // Create expected shape, should only have the second submissions's
          // metadata.
          metadata: [
            {
              number: 2,
              payments: null,
              refNo: secondSubmission._id,
              submissionTime: moment(secondSubmission.created)
                .tz('Asia/Singapore')
                .format('Do MMM YYYY, h:mm:ss a'),
            },
          ],
        }
        expect(actual).toEqual(expected)
      })

      it('should return offset metadata with correct count when page size is provided', async () => {
        // Arrange
        // Add 3 valid multirespondent submissions.
        const validSubmissionPromises = times(3, (idx) =>
          MultirespondentSubmission.create({
            form: VALID_FORM_ID,
            submissionType: SubmissionType.Multirespondent,
            form_fields: [],
            form_logics: [],
            workflow: [],
            submissionPublicKey: MOCK_SUBMISSION_PUBLIC_KEY,
            encryptedSubmissionSecretKey: MOCK_ENCRYPTED_SUBMISSION_SECRET_KEY,
            encryptedContent: MOCK_ENCRYPTED_CONTENT,
            version: 3,
            created: MOCK_CREATED_DATES_ASC[idx],
            workflowStep: 0,
          }),
        )
        const validSubmissions: IMultirespondentSubmissionSchema[] =
          await Promise.all(validSubmissionPromises)

        // Act
        const actual = await MultirespondentSubmission.findAllMetadataByFormId(
          VALID_FORM_ID,
          // Only show one metadata.
          { pageSize: 1 },
        )

        // Assert
        const latestSubmission = validSubmissions[validSubmissions.length - 1]
        const expected = {
          count: validSubmissions.length,
          // Create expected shape, should only have the latest submission since
          // pageSize === 1.
          metadata: [
            {
              number: 3,
              payments: null,
              refNo: latestSubmission._id,
              submissionTime: moment(latestSubmission.created)
                .tz('Asia/Singapore')
                .format('Do MMM YYYY, h:mm:ss a'),
            },
          ],
        }
        expect(actual).toEqual(expected)
      })

      it('should return empty metadata array when given page has no metadata', async () => {
        // Arrange
        // Add 3 valid multirespondent submissions.
        const validSubmissionPromises = times(3, (idx) =>
          MultirespondentSubmission.create({
            form: VALID_FORM_ID,
            submissionType: SubmissionType.Multirespondent,
            form_fields: [],
            form_logics: [],
            workflow: [],
            submissionPublicKey: MOCK_SUBMISSION_PUBLIC_KEY,
            encryptedSubmissionSecretKey: MOCK_ENCRYPTED_SUBMISSION_SECRET_KEY,
            encryptedContent: MOCK_ENCRYPTED_CONTENT,
            version: 1,
            created: MOCK_CREATED_DATES_ASC[idx],
            workflowStep: 0,
          }),
        )
        const validSubmissions: IMultirespondentSubmissionSchema[] =
          await Promise.all(validSubmissionPromises)

        // Act
        const actual = await MultirespondentSubmission.findAllMetadataByFormId(
          VALID_FORM_ID,
          // Retrieve page 30, but currently only has 3 submissions.
          { page: 30 },
        )

        // Assert
        const expected = {
          count: validSubmissions.length,
          // Metadata should be empty since given offset has no more metadata to
          // show
          metadata: [],
        }
        expect(actual).toEqual(expected)
      })

      it('should return empty metadata array when formId has no metadata', async () => {
        // Arrange
        const formIdWithNoSubmissions = new ObjectId().toHexString()
        // Act
        const actual = await MultirespondentSubmission.findAllMetadataByFormId(
          formIdWithNoSubmissions,
        )

        // Assert
        const expected = {
          count: 0,
          // Metadata should be empty since given offset has no more metadata to
          // show
          metadata: [],
        }
        expect(actual).toEqual(expected)
      })
    })

    describe('getSubmissionCursorByFormId', () => {
      it('should return cursor that contains all the submissions', async () => {
        // Arrange
        const validFormId = new ObjectId().toHexString()
        const validSubmission = await MultirespondentSubmission.create({
          form: validFormId,
          submissionType: SubmissionType.Multirespondent,
          form_fields: [],
          form_logics: [],
          workflow: [],
          submissionPublicKey: MOCK_SUBMISSION_PUBLIC_KEY,
          encryptedSubmissionSecretKey: MOCK_ENCRYPTED_SUBMISSION_SECRET_KEY,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 1,
          workflowStep: 0,
        })
        const expectedSubmission = pick(
          validSubmission,
          '_id',
          'created',
          'form_fields',
          'form_logics',
          'workflow',
          'encryptedSubmissionSecretKey',
          'encryptedContent',
          'submissionType',
          'version',
        )
        // Native-ify arrays as mongoose documents contain a mongoose-specific array type.
        expectedSubmission.form_fields = JSON.parse(
          JSON.stringify(expectedSubmission.form_fields),
        )
        expectedSubmission.form_logics = JSON.parse(
          JSON.stringify(expectedSubmission.form_logics),
        )

        // Act
        const actualCursor =
          MultirespondentSubmission.getSubmissionCursorByFormId(validFormId, {})

        // Assert
        // Store all retrieved objects in the cursor.
        const retrievedSubmissions: any[] = []
        for await (const submission of actualCursor) {
          retrievedSubmissions.push(submission)
        }
        // Cursor stream should contain only that single submission.
        expect(retrievedSubmissions).toEqual([expectedSubmission])
      })

      it('should return cursor even if no submissions are found', async () => {
        // Arrange
        const invalidFormId = new ObjectId().toHexString()

        // Act
        const actualCursor =
          MultirespondentSubmission.getSubmissionCursorByFormId(
            invalidFormId,
            {},
          )

        // Assert
        // Store all retrieved objects in the cursor.
        const retrievedSubmissions: any[] = []
        for await (const submission of actualCursor) {
          retrievedSubmissions.push(submission)
        }
        // Cursor stream should return nothing.
        expect(retrievedSubmissions).toEqual([])
      })
    })

    describe('findEncryptedSubmissionById', () => {
      it('should return correct submission by its id', async () => {
        // Arrange
        const validFormId = new ObjectId().toHexString()
        const validSubmission = await MultirespondentSubmission.create({
          form: validFormId,
          submissionType: SubmissionType.Multirespondent,
          form_fields: [],
          form_logics: [],
          workflow: [],
          submissionPublicKey: MOCK_SUBMISSION_PUBLIC_KEY,
          encryptedSubmissionSecretKey: MOCK_ENCRYPTED_SUBMISSION_SECRET_KEY,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 3,
          attachmentMetadata: { someFileName: 'some url of attachment' },
          workflowStep: 0,
        })

        // Act
        const actual =
          await MultirespondentSubmission.findEncryptedSubmissionById(
            validFormId,
            validSubmission._id,
          )

        // Assert
        const expected = pick(
          validSubmission.toJSON(),
          '_id',
          'attachmentMetadata',
          'created',
          'form_fields',
          'form_logics',
          'workflow',
          'submissionPublicKey',
          'encryptedSubmissionSecretKey',
          'encryptedContent',
          'submissionType',
          'version',
          'workflowStep',
        )
        expect(actual).not.toBeNull()
        expect(actual?.toJSON()).toEqual(expected)
      })

      it('should return null when submission id does not exist', async () => {
        // Arrange
        // Form ID does not matter.
        const formId = new ObjectId().toHexString()
        const invalidSubmissionId = new ObjectId().toHexString()

        // Act
        const actual =
          await MultirespondentSubmission.findEncryptedSubmissionById(
            formId,
            invalidSubmissionId,
          )

        // Assert
        expect(actual).toBeNull()
      })

      it('should return null when type of submission with given id is not SubmissionType.Multirespondent', async () => {
        // Arrange
        const validFormId = new ObjectId().toHexString()
        const validEmailSubmission = await EmailSubmission.create({
          submissionType: SubmissionType.Email,
          form: validFormId,
          recipientEmails: ['any@example.com'],
          responseHash: 'any hash',
          responseSalt: 'any salt',
        })

        // Act
        const actual =
          await MultirespondentSubmission.findEncryptedSubmissionById(
            validFormId,
            validEmailSubmission._id,
          )

        // Assert
        // Should still be null even when formId and submissionIds are valid
        expect(actual).toBeNull()
      })
    })
  })
})
