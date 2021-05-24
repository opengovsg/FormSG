import bcrypt from 'bcrypt'
import { ObjectId } from 'bson-ext'
import { subMinutes, subYears } from 'date-fns'
import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'
import session, { Session } from 'supertest-session'

import {
  generateFieldParams,
  MOCK_HASHED_OTP,
  MOCK_SIGNED_DATA,
} from 'src/app/modules/verification/__tests__/verification.test.helpers'
import getVerificationModel from 'src/app/modules/verification/verification.model'
import MailService from 'src/app/services/mail/mail.service'
import * as OtpUtils from 'src/app/utils/otp'
import { NUM_OTP_RETRIES } from 'src/shared/util/verification'
import { BasicField, IVerificationSchema } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { generateDefaultField } from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { MOCK_OTP } from '../../../../../modules/verification/__tests__/verification.test.helpers'
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
  const MOCK_VALID_EMAIL_DOMAIN = 'example.com'
  const MOCK_EMAIL = `mock@${MOCK_VALID_EMAIL_DOMAIN}`

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
      mailDomain: MOCK_VALID_EMAIL_DOMAIN,
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

  describe('POST /forms/:formId/fieldverifications', () => {
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
      expect(response.body).toEqual({})
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

  describe('POST /forms/:formId/fieldverifications/:transactionId/fields/:fieldId/reset', () => {
    it('should return 204 when formId, transactionId and fieldId for email field are valid', async () => {
      // Act
      const response = await request.post(
        `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockEmailFieldId}/reset`,
      )

      // Assert
      expect(response.status).toBe(StatusCodes.NO_CONTENT)
      expect(response.text).toBe('')
    })

    it('should return 204 when transactionId and fieldId for mobile field are valid', async () => {
      // Act
      const response = await request.post(
        `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/reset`,
      )

      // Assert
      expect(response.status).toBe(StatusCodes.NO_CONTENT)
      expect(response.text).toBe('')
    })

    it('should return 400 when the transaction has expired', async () => {
      // Arrange
      // Create an expired transaction
      const mockExpiredTransaction = await VerificationModel.create({
        formId: mockVerifiableFormId,
        expireAt: subMinutes(Date.now(), 1),
      })
      const expectedResponse = {
        message: 'Your session has expired, please refresh and try again.',
      }

      // Act
      const response = await request.post(
        `/forms/${mockVerifiableFormId}/fieldverifications/${mockExpiredTransaction._id}/fields/${mockEmailFieldId}/reset`,
      )

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when formId is invalid', async () => {
      // Arrange
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request.post(
        `/forms/${new ObjectId().toHexString()}/fieldverifications/${mockTransactionId}/fields/${mockEmailFieldId}/reset`,
      )

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when transactionId is invalid', async () => {
      // Arrange
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request.post(
        `/forms/${mockVerifiableFormId}/fieldverifications/${new ObjectId().toHexString()}/fields/${mockEmailFieldId}/reset`,
      )

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when fieldId is invalid', async () => {
      // Arrange
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request.post(
        `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${new ObjectId().toHexString()}/reset`,
      )

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })
  })

  describe('POST /forms/:formId/fieldverifications/:transactionId/fields/:fieldId/otp/verify', () => {
    // Mock the generation of otp so that the stored otp is the mock OTP
    beforeEach(async () => {
      await dbHandler.insertAgency({
        mailDomain: MOCK_VALID_EMAIL_DOMAIN,
      })
      jest.spyOn(OtpUtils, 'generateOtp').mockReturnValue(MOCK_OTP)
    })

    it('should return 200 when the fieldType is email, request parameters are valid and the otp is correct', async () => {
      // Arrange
      await requestForOtp(MOCK_EMAIL)

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockEmailFieldId}/otp/verify`,
        )
        .send({ otp: MOCK_OTP })

      // Assert
      expect(response.status).toBe(StatusCodes.OK)
      expect(response.body).toBe(MOCK_SIGNED_DATA)
    })

    it('should return 200 when the fieldType is mobile, request parameters are valid and the otp is correct', async () => {
      // Arrange
      await requestForOtp(MOCK_EMAIL)

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/verify`,
        )
        .send({ otp: MOCK_OTP })

      // Assert
      expect(response.status).toBe(StatusCodes.OK)
      expect(response.body).toBe(MOCK_SIGNED_DATA)
    })

    it('should return 400 when the transaction is expired', async () => {
      // Arrange
      const { _id: expiredTransactionId } = await VerificationModel.create({
        formId: mockVerifiableFormId,
        expireAt: Date.now(),
        fields: [],
      })
      const expectedResponse = {
        message: 'Your session has expired, please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${expiredTransactionId}/fields/${mockMobileFieldId}/otp/verify`,
        )
        .send({ otp: MOCK_OTP })

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 400 when the hash data could not be found', async () => {
      // Arrange
      // Remove the email field and persist to db
      await mockTransaction.fields[1].remove()
      await mockTransaction.save()

      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/verify`,
        )
        .send({ otp: MOCK_OTP })

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when the form could not be found', async () => {
      // Arrange
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${new ObjectId().toHexString()}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/verify`,
        )
        .send({ otp: MOCK_OTP })

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when the transaction could not be found', async () => {
      // Arrange
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${new ObjectId().toHexString()}/fields/${mockMobileFieldId}/otp/verify`,
        )
        .send({ otp: MOCK_OTP })

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when the field could not be found', async () => {
      // Arrange
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${new ObjectId().toHexString()}/otp/verify`,
        )
        .send({ otp: MOCK_OTP })

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 422 when the otp is expired', async () => {
      // Arrange
      const mockOtpExpiredTransaction = await VerificationModel.create({
        formId: mockVerifiableFormId,
        fields: [
          generateFieldParams({
            _id: mockEmailFieldId,
            hashCreatedAt: subYears(Date.now(), 1),
            fieldType: BasicField.Email,
            hashRetries: 0,
            hashedOtp: MOCK_HASHED_OTP,
            signedData: MOCK_SIGNED_DATA,
          }),
        ],
      })
      const expectedResponse = {
        message: 'Your OTP has expired, please request for a new one.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockOtpExpiredTransaction._id}/fields/${mockEmailFieldId}/otp/verify`,
        )
        .send({ otp: MOCK_OTP })

      // Assert
      expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 422 when the OTP retry limit is exceeded', async () => {
      // Arrange
      const requestForOtp = () =>
        request
          .post(
            `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockEmailFieldId}/otp/verify`,
          )
          .send({ otp: MOCK_OTP })
      const expectedResponse = {
        message:
          'You have entered too many invalid OTPs. Please request for a new OTP and try again.',
      }

      // Act
      await Promise.allSettled(
        _.range(NUM_OTP_RETRIES).map(() => requestForOtp()),
      )
      const response = await requestForOtp()

      // Assert
      expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 422 when the otp is wrong', async () => {
      // Arrange
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false)
      const expectedResponse = {
        message: 'Wrong OTP.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockEmailFieldId}/otp/verify`,
        )
        .send({ otp: '000000' })

      // Assert
      expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 500 when hashing error occurs', async () => {
      // Arrange
      jest.spyOn(bcrypt, 'compare').mockRejectedValueOnce(false)
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockEmailFieldId}/otp/verify`,
        )
        .send({ otp: MOCK_OTP })

      // Assert
      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 500 when database error occurs', async () => {
      // Arrange
      jest
        .spyOn(VerificationModel, 'findById')
        .mockReturnValue({ exec: jest.fn().mockRejectedValue('no') })
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockEmailFieldId}/otp/verify`,
        )
        .send({ otp: MOCK_OTP })

      // Assert
      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.body).toEqual(expectedResponse)
    })
  })

  // Helper functions
  const requestForOtp = async (fieldId: string, answer: string) => {
    // Set that so no real mail is sent.
    jest
      .spyOn(MailService, 'sendVerificationOtp')
      .mockReturnValue(okAsync(true))

    const response = await request
      .post(
        `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${fieldId}/otp/generate`,
      )
      .send({ answer })
    expect(response.status).toBe(StatusCodes.CREATED)
  }
})
