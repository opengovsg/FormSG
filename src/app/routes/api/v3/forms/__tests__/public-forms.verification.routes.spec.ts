import bcrypt from 'bcrypt'
import { ObjectId } from 'bson-ext'
import { subMinutes } from 'date-fns'
import { getReasonPhrase, StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import session, { Session } from 'supertest-session'
import { MockedObjectDeep } from 'ts-jest/dist/utils/testing'
import { mocked } from 'ts-jest/utils'

import getFormModel from 'src/app/models/form.server.model'
import {
  generateFieldParams,
  MOCK_HASHED_OTP,
  MOCK_SIGNED_DATA,
} from 'src/app/modules/verification/__tests__/verification.test.helpers'
import getVerificationModel from 'src/app/modules/verification/verification.model'
import { SmsSendError } from 'src/app/services/sms/sms.errors'
import { WAIT_FOR_OTP_SECONDS } from 'src/shared/util/verification'
import { BasicField, IVerificationSchema, VerifiableFieldType } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import MockTwilio from 'tests/integration/helpers/twilio'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import { generateDefaultField } from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { PublicFormsVerificationRouter } from '../public-forms.verification.routes'

const Form = getFormModel(mongoose)

const verificationApp = setupApp('/forms', PublicFormsVerificationRouter)
const VerificationModel = getVerificationModel(mongoose)

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))

describe('public-forms.verification.routes', () => {
  let mockTransaction: IVerificationSchema
  let mockTransactionId: string
  let mockEmptyFormId: string
  let mockVerifiableFormId: string
  let mockEmailFieldId: string
  let mockMobileFieldId: string
  let request: Session
  let MockTransport: MockedObjectDeep<Mail>

  beforeAll(async () => {
    await dbHandler.connect()
    MockTransport = mocked(nodemailer.createTransport(), true)
  })

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

  describe('POST /forms/:formId/fieldverifications/:transactionId/fields/:fieldId/otp/generate', () => {
    beforeEach(() => {
      MockTwilio.messages.create.mockResolvedValue({
        sid: 'mockSid',
      })
    })

    it('should return 201 when parameters for email field are valid', async () => {
      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockEmailFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Email,
          answer: 'open@gov.sg',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.CREATED)
      expect(response.text).toBe(getReasonPhrase(StatusCodes.CREATED))
    })

    it('should return 201 when parameters for mobile field are valid', async () => {
      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          // NOTE: a valid mobile number is +65 followed by ANY 8 digits
          answer: '+6512345678',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.CREATED)
      expect(response.text).toBe(getReasonPhrase(StatusCodes.CREATED))
    })

    it('should return 400 when fieldType is email but the provided email is not valid', async () => {
      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockEmailFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Email,
          answer: 'notanemail',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'answer',
            message: 'Please ensure that the email provided is valid.',
          },
        }),
      )
    })

    it('should return 400 when fieldType is mobile but the provided phone number is not valid', async () => {
      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          // 7 digits after +65 instead of 8
          answer: '+651234567',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'answer',
            message: 'Please ensure that the phone number provided is valid.',
          },
        }),
      )
    })

    it('should return 400 when the parameters are malformed', async () => {
      // Arrange
      // NOTE: This error is only thrown on interaction with the db, hence the db is mocked here
      jest.spyOn(Form, 'getOtpData').mockResolvedValueOnce(null)
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          answer: '+6512345678',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 400 when the transaction has expired', async () => {
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
          `/forms/${mockVerifiableFormId}/fieldverifications/${expiredTransactionId}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          answer: '+6512345678',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 400 when the otp could not be sent and fieldType is mobile', async () => {
      // Arrange
      MockTwilio.messages.create.mockRejectedValueOnce(new SmsSendError())
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          // 7 digits after +65 instead of 8
          answer: '+6512345678',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 400 when the otp could not be sent and fieldType is email', async () => {
      // Arrange
      // Retries on failure until limit hit, hence cannot just mock once
      MockTransport.sendMail.mockRejectedValue('no')
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockEmailFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Email,
          answer: 'mail@me.com',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when the requested form was not found', async () => {
      // Arrange
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${new ObjectId().toHexString()}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          answer: '+6512345678',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when the transaction was not found', async () => {
      // Arrange
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${new ObjectId().toHexString()}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          answer: '+6512345678',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when the field was not found', async () => {
      // Arrange
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${new ObjectId().toHexString()}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          answer: '+6512345678',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 422 when the user requested for otp without waiting', async () => {
      // Arrange
      const expectedResponse = {
        message: `You must wait for ${WAIT_FOR_OTP_SECONDS} seconds between each OTP request.`,
      }

      // Act
      await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          answer: '+6512345678',
        })
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          answer: '+6512345678',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 500 when the otp could not be hashed', async () => {
      // Arrange
      jest.spyOn(bcrypt, 'hash').mockRejectedValueOnce('hashbrowns')
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          answer: '+6512345678',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 500 when there is a database error', async () => {
      // Arrange
      jest.spyOn(VerificationModel, 'findById').mockReturnValue({
        exec: () => Promise.reject('no.'),
      })
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      const response = await request
        .post(
          `/forms/${mockVerifiableFormId}/fieldverifications/${mockTransactionId}/fields/${mockMobileFieldId}/otp/generate`,
        )
        .send({
          fieldType: VerifiableFieldType.Mobile,
          answer: '+6512345678',
        })

      // Assert
      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.body).toEqual(expectedResponse)
    })
  })
})
