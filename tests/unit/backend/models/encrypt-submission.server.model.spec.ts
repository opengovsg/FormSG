import { ObjectId } from 'bson-ext'
import moment from 'moment-timezone'
import mongoose from 'mongoose'

import getSubmissionModel, {
  getEncryptSubmissionModel,
} from 'src/app/models/submission.server.model'
import {
  IEncryptedSubmissionSchema,
  SubmissionMetadata,
  SubmissionType,
} from 'src/types'

import dbHandler from '../helpers/jest-db'

const Submission = getSubmissionModel(mongoose)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

describe('Encrypt Submission Model', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  const MOCK_ENCRYPTED_CONTENT = 'abcdefg encryptedContent'

  describe('Statics', () => {
    describe('findSingleMetadata', () => {
      it('should return submission metadata', async () => {
        // Arrange
        const validFormId = new ObjectId().toHexString()
        const createdDate = new Date()
        // Add valid encrypt submission.
        const validSubmission = await Submission.create<
          IEncryptedSubmissionSchema
        >({
          form: validFormId,
          myInfoFields: [],
          // Email type.
          submissionType: SubmissionType.Encrypt,
          encryptedContent: MOCK_ENCRYPTED_CONTENT,
          version: 1,
          created: createdDate,
        })

        // Act
        const result = await EncryptSubmission.findSingleMetadata(
          validFormId,
          validSubmission._id,
        )

        // Assert
        const expected: SubmissionMetadata = {
          number: 1,
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
        const result = await EncryptSubmission.findSingleMetadata(
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
        const result = await EncryptSubmission.findSingleMetadata(
          validFormId,
          invalidSubmissionId,
        )

        // Assert
        expect(result).toBeNull()
      })
    })
  })
})
