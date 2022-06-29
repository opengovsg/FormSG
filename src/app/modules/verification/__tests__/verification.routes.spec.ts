/* eslint-disable @typescript-eslint/ban-ts-comment */
import bcrypt from 'bcrypt'
import subMinutes from 'date-fns/subMinutes'
import { getReasonPhrase, StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import session, { Session } from 'supertest-session'

import { IVerificationSchema } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import { generateDefaultField } from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { BasicField } from '../../../../../shared/types'
import getVerificationModel from '../verification.model'
import { VfnRouter } from '../verification.routes'

import {
  generateFieldParams,
  MOCK_HASHED_OTP,
  MOCK_OTP,
  MOCK_RECIPIENT,
  MOCK_SIGNED_DATA,
} from './verification.test.helpers'

const verificationApp = setupApp('/transaction', VfnRouter)
const VerificationModel = getVerificationModel(mongoose)

// Prevent rate limiting.
jest.mock('src/app/utils/limit-rate')

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

describe('verification.routes', () => {
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
    const ROUTE = '/transaction'

    it('should return 400 when formId is not provided in body', async () => {
      const response = await request.post(ROUTE)

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'formId' } }),
      )
    })

    it('should return 400 when formId is malformed', async () => {
      const response = await request.post(ROUTE).send({ formId: 'malformed' })

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'formId',
            message: '"formId" length must be 24 characters long',
          },
        }),
      )
    })

    it('should return 200 when form has no verifiable fields', async () => {
      const response = await request
        .post(ROUTE)
        // ID of form with no verifiable fields
        .send({ formId: mockEmptyFormId })

      expect(response.status).toBe(StatusCodes.OK)
      expect(response.body).toEqual({})
    })

    it('should return 201 when form has verifiable fields', async () => {
      const response = await request
        .post(ROUTE)
        // ID of form with verifiable fields
        .send({ formId: mockVerifiableFormId })

      expect(response.status).toBe(StatusCodes.CREATED)
      expect(response.body).toEqual({
        transactionId: expect.any(String),
        expireAt: expect.any(String),
      })
    })
  })

  describe('POST /:transactionId/reset', () => {
    it('should return 400 when fieldId is not provided in body', async () => {
      const response = await request.post(
        `/transaction/${mockTransactionId}/reset`,
      )

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'fieldId' } }),
      )
    })

    it('should return 400 when fieldId is malformed', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/reset`)
        .send({ fieldId: 'malformed' })

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'fieldId',
            message: '"fieldId" length must be 24 characters long',
          },
        }),
      )
    })

    it('should return 200 when transactionId and fieldId for email field are valid', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/reset`)
        .send({ fieldId: mockEmailFieldId })

      expect(response.status).toBe(StatusCodes.OK)
      expect(response.text).toBe(getReasonPhrase(StatusCodes.OK))
    })

    it('should return 200 when transactionId and fieldId for mobile field are valid', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/reset`)
        .send({ fieldId: mockMobileFieldId })

      expect(response.status).toBe(StatusCodes.OK)
    })
  })

  describe('POST /:transactionId/otp', () => {
    it('should return 400 when fieldId is not provided in body', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp`)
        .send({ answer: MOCK_RECIPIENT })

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'fieldId' } }),
      )
    })

    it('should return 400 when fieldId is malformed', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp`)
        .send({ fieldId: 'malformed', answer: MOCK_RECIPIENT })

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'fieldId',
            message: '"fieldId" length must be 24 characters long',
          },
        }),
      )
    })

    it('should return 400 when answer is not provided in body', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp`)
        .send({ fieldId: mockEmailFieldId })

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'answer',
          },
        }),
      )
    })

    it('should return 201 for valid transaction ID and email field ID', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp`)
        .send({ fieldId: mockEmailFieldId, answer: 'abc@abc.com' })

      expect(response.status).toBe(StatusCodes.CREATED)
    })

    it('should return 201 for valid transaction ID and mobile field ID', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp`)
        .send({ fieldId: mockMobileFieldId, answer: '+6581234567' })

      expect(response.status).toBe(StatusCodes.CREATED)
    })
  })

  describe('POST /:transactionId/otp/verify', () => {
    beforeEach(() => {
      // @ts-ignore
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true)
    })

    it('should return 400 when fieldId is not provided in body', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp/verify`)
        .send({ otp: MOCK_OTP })

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'fieldId' } }),
      )
    })

    it('should return 400 when fieldId is malformed', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp/verify`)
        .send({ fieldId: 'malformed', otp: MOCK_OTP })

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'fieldId',
            message: '"fieldId" length must be 24 characters long',
          },
        }),
      )
    })

    it('should return 400 when OTP is not provided in body', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp/verify`)
        .send({ fieldId: mockEmailFieldId })

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'otp',
          },
        }),
      )
    })

    it('should return 400 when OTP is malformed', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp/verify`)
        .send({ fieldId: mockEmailFieldId, otp: 'malformed' })

      expect(response.status).toBe(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'otp',
            message: 'Please enter a valid OTP',
          },
        }),
      )
    })

    it('should return 200 with signedData when params are valid for email field', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp/verify`)
        .send({ fieldId: mockEmailFieldId, otp: MOCK_OTP })

      expect(response.status).toBe(StatusCodes.OK)
      expect(response.body).toBe(MOCK_SIGNED_DATA)
    })

    it('should return 200 with signedData when params are valid for mobile field', async () => {
      const response = await request
        .post(`/transaction/${mockTransactionId}/otp/verify`)
        .send({ fieldId: mockMobileFieldId, otp: MOCK_OTP })

      expect(response.status).toBe(StatusCodes.OK)
      expect(response.body).toBe(MOCK_SIGNED_DATA)
    })
  })
})
