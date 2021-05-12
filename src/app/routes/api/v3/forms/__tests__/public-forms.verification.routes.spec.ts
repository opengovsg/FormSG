import { ObjectId } from 'bson-ext'
import subMinutes from 'date-fns/subMinutes'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { errAsync } from 'neverthrow'
import session, { Session } from 'supertest-session'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import {
  generateFieldParams,
  MOCK_HASHED_OTP,
  MOCK_SIGNED_DATA,
} from 'src/app/modules/verification/__tests__/verification.test.helpers'
import getVerificationModel from 'src/app/modules/verification/verification.model'
import { BasicField, IVerificationSchema } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { generateDefaultField } from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import * as VerificationService from '../../../../../modules/verification/verification.service'
import { PublicFormsVerificationRouter } from '../public-forms.verification.routes'

const verificationApp = setupApp('/forms', PublicFormsVerificationRouter)
const VerificationModel = getVerificationModel(mongoose)

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))
// Default Twilio export is a function
jest.mock('twilio', () => () => ({
  messages: {
    create: jest.fn().mockResolvedValue({
      sid: 'mockSid',
    }),
  },
}))

describe('public-forms.verification.routes', () => {
  let mockTransaction: IVerificationSchema
  let mockTransactionId: string
  let mockEmptyFormId: string
  let mockVerifiableFormId: string
  let mockEmailFieldId: string
  let mockMobileFieldId: string
  let request: Session

  beforeAll(async () => await dbHandler.connect())

  beforeEach(async () => {
    request = session(verificationApp)
    jest.clearAllMocks()
    await dbHandler.clearDatabase()

    // Form without verifiable fields
    const { form: emptyForm } = await dbHandler.insertEmailForm()
    mockEmptyFormId = String(emptyForm._id)

    // Form with verifiable fields
    const emailField = generateDefaultField(BasicField.Email, {
      isVerifiable: true,
    })
    const mobileField = generateDefaultField(BasicField.Mobile, {
      isVerifiable: true,
    })
    mockEmailFieldId = String(emailField._id)
    mockMobileFieldId = String(mobileField._id)
    const { form: verifiableForm } = await dbHandler.insertEmailForm({
      // Alternative mail domain so as not to clash with emptyForm
      mailDomain: 'test2.gov.sg',
      formOptions: {
        form_fields: [emailField, mobileField],
      },
    })
    mockVerifiableFormId = String(verifiableForm._id)

    // Mock transaction with both email and mobile fields
    mockTransaction = await VerificationModel.create({
      formId: mockVerifiableFormId,
      fields: [
        generateFieldParams({
          _id: mockEmailFieldId,
          // Hash created 1 minute ago, so we can test requesting for new OTP
          // without being rejected due to minimum waiting time
          hashCreatedAt: subMinutes(Date.now(), 1),
          fieldType: BasicField.Email,
          hashRetries: 0,
          hashedOtp: MOCK_HASHED_OTP,
          signedData: MOCK_SIGNED_DATA,
        }),
        generateFieldParams({
          _id: mockMobileFieldId,
          // Hash created 1 minute ago, so we can test requesting for new OTP
          // without being rejected due to minimum waiting time
          hashCreatedAt: subMinutes(Date.now(), 1),
          fieldType: BasicField.Mobile,
          hashRetries: 0,
          hashedOtp: MOCK_HASHED_OTP,
          signedData: MOCK_SIGNED_DATA,
        }),
      ],
    })
    mockTransactionId = String(mockTransaction._id)
  })

  afterAll(async () => await dbHandler.closeDatabase())

  describe('POST /', () => {
    it('should return 404 when formId is malformed', async () => {
      // Act
      const response = await request.post(`/forms/malformed/fieldverifications`)

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
    })

    it('should return 200 when form has no verifiable fields', async () => {
      // Act
      const response = await request
        // ID of form with no verifiable fields
        .post(`/forms/${mockEmptyFormId}/fieldverifications`)

      // Assert
      expect(response.status).toBe(StatusCodes.OK)
    })

    it('should return 201 when form has verifiable fields', async () => {
      // Act
      const response = await request
        // ID of form with verifiable fields
        .post(`/forms/${mockVerifiableFormId}/fieldverifications`)

      // Assert
      expect(response.status).toBe(StatusCodes.CREATED)
      expect(response.body).toEqual({
        transactionId: expect.any(String),
        expireAt: expect.any(String),
      })
    })
  })

  describe('GET /forms/:formId/fieldverifications/:id', () => {
    it('should return 200 when transactionId is valid', async () => {
      // Act
      const response = await request.get(
        `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}`,
      )

      // Assert
      expect(response.status).toBe(StatusCodes.OK)
      expect(response.body).toEqual({
        formId: expect.any(String),
        expireAt: expect.any(String),
        _id: expect.any(String),
      })
    })

    it('should return 404 when the transaction with the specifiedId could not be found', async () => {
      // Act
      const response = await request.get(
        `/forms/${mockVerifiableFormId}/fieldverifications/${new ObjectId().toHexString()}`,
      )

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
    })

    it('should return 500 when a database error occurs', async () => {
      // Arrange
      jest
        .spyOn(VerificationService, 'getTransactionMetadata')
        .mockReturnValueOnce(
          errAsync(new DatabaseError('all your base r belong to us')),
        )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await await request.get(
        `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}`,
      )

      // Assert
      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.body).toEqual(expectedResponse)
    })
  })
})
