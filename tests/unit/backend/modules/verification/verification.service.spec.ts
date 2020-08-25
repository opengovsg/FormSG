import bcrypt from 'bcrypt'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import smsFactory from 'src/app/factories/sms.factory'
import getFormModel from 'src/app/models/form.server.model'
import getVerificationModel from 'src/app/models/verification.server.model'
import {
  createTransaction,
  getNewOtp,
  getTransactionMetadata,
  resetFieldInTransaction,
  verifyOtp,
} from 'src/app/modules/verification/verification.service'
import MailService from 'src/app/services/mail.service'
import { generateOtp } from 'src/app/utils/otp'
import formsgSdk from 'src/config/formsg-sdk'
import { BasicField, IUserSchema, IVerificationSchema } from 'src/types'

import dbHandler from '../../helpers/jest-db'

const Form = getFormModel(mongoose)
const Verification = getVerificationModel(mongoose)
const MOCK_FORM_TITLE = 'Verification service tests'

// Set up mocks
jest.mock('src/app/utils/otp')
const mockGenerateOtp = mocked(generateOtp, true)
jest.mock('src/config/formsg-sdk')
const mockFormsgSdk = mocked(formsgSdk, true)
jest.mock('src/app/factories/sms.factory')
const mockSmsFactory = mocked(smsFactory, true)
jest.mock('src/app/services/mail.service')
const mockMailService = mocked(MailService, true)
jest.mock('bcrypt')
const mockBcrypt = mocked(bcrypt, true)

describe('Verification service', () => {
  let user: IUserSchema
  beforeAll(async () => {
    await dbHandler.connect()
  })
  beforeEach(async () => {
    const preloadedDocuments = await dbHandler.insertFormCollectionReqs({})
    user = preloadedDocuments.user
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('createTransaction', () => {
    afterEach(async () => await dbHandler.clearDatabase())

    it('should return null when form_fields does not exist', async () => {
      const testForm = new Form({
        admin: user,
        title: MOCK_FORM_TITLE,
      })
      await testForm.save()
      await expect(createTransaction(testForm._id)).resolves.toBe(null)
      // Document should not have been created
      await expect(
        Verification.findOne({ formId: testForm._id }),
      ).resolves.toBe(null)
    })

    it('should return null when there are no verifiable fields', async () => {
      const testForm = new Form({
        form_fields: [{ fieldType: BasicField.YesNo }],
        admin: user,
        title: MOCK_FORM_TITLE,
      })
      await testForm.save()
      await expect(createTransaction(testForm._id)).resolves.toBe(null)
      // Document should not have been created
      await expect(
        Verification.findOne({ formId: testForm._id }),
      ).resolves.toBe(null)
    })

    it('should correctly save and return transaction', async () => {
      const testForm = new Form({
        form_fields: [{ fieldType: BasicField.Email, isVerifiable: true }],
        admin: user,
        title: MOCK_FORM_TITLE,
      })
      await testForm.save()
      const returnedTransaction = await createTransaction(testForm._id)
      const foundTransaction = await Verification.findOne({
        formId: testForm._id,
      })
      expect(foundTransaction).toBeTruthy()
      expect(returnedTransaction).toEqual({
        transactionId: foundTransaction._id,
        expireAt: foundTransaction.expireAt,
      })
    })
  })

  describe('getTransactionMetadata', () => {
    afterEach(async () => await dbHandler.clearDatabase())

    it('should throw error when transaction does not exist', async () => {
      return expect(
        getTransactionMetadata(String(new ObjectId())),
      ).rejects.toThrowError('TRANSACTION_NOT_FOUND')
    })

    it('should correctly return metadata', async () => {
      const formId = new ObjectId()
      const expireAt = new Date()
      const testVerification = new Verification({ formId, expireAt })
      await testVerification.save()
      const actual = await getTransactionMetadata(testVerification._id)
      expect(actual.toObject()).toEqual({
        _id: testVerification._id,
        formId,
        expireAt,
      })
    })
  })

  describe('resetFieldInTransaction', () => {
    afterEach(async () => await dbHandler.clearDatabase())

    it('should correctly reset one field', async () => {
      const testForm = new Form({
        admin: user,
        title: MOCK_FORM_TITLE,
        form_fields: [
          { fieldType: BasicField.Email, isVerifiable: true },
          { fieldType: BasicField.Mobile, isVerifiable: true },
        ],
      })
      const formId = testForm._id
      const hashCreatedAt = new Date()
      const hashedOtp = 'hash'
      const signedData = 'signedData'
      const hashRetries = 1
      const transaction = new Verification({
        formId,
        fields: testForm.form_fields.map(({ _id, fieldType }) => ({
          _id,
          fieldType,
          hashCreatedAt,
          hashedOtp,
          signedData,
          hashRetries,
        })),
      })
      await transaction.save()
      await resetFieldInTransaction(transaction, testForm.form_fields[0]._id)
      const actual = await Verification.findOne({ formId })
      expect(actual.fields[0].toObject()).toEqual({
        _id: String(testForm.form_fields[0]._id),
        fieldType: testForm.form_fields[0].fieldType,
        hashCreatedAt: null,
        hashedOtp: null,
        signedData: null,
        hashRetries: 0,
      })
      expect(actual.fields[1].toObject()).toEqual({
        _id: String(testForm.form_fields[1]._id),
        fieldType: testForm.form_fields[1].fieldType,
        hashCreatedAt,
        hashedOtp,
        signedData,
        hashRetries,
      })
    })

    it('should throw error if field ID does not exist', async () => {
      const transaction = new Verification({ formId: new ObjectId() })
      await transaction.save()
      return expect(
        resetFieldInTransaction(transaction, String(new ObjectId())),
      ).rejects.toThrowError('Field not found in transaction')
    })

    it('should throw error if transaction ID does not exist', async () => {
      const transaction = new Verification({ formId: new ObjectId() })
      return expect(
        resetFieldInTransaction(transaction, String(new ObjectId())),
      ).rejects.toThrowError('Field not found in transaction')
    })
  })

  describe('getNewOtp', () => {
    let transaction: IVerificationSchema, mockAnswer: string, mockOtp: string
    let hashedOtp: string, signedData: string, hashRetries: number
    let hashCreatedAt: Date
    beforeEach(() => {
      jest.clearAllMocks()
      mockAnswer = 'answer'
      mockOtp = '123456'
      hashedOtp = 'hash'
      signedData = 'signedData'
      hashRetries = 1
      hashCreatedAt = new Date()
      const defaultParams = {
        hashCreatedAt,
        hashedOtp,
        signedData,
        hashRetries,
        isVerifiable: true,
      }
      transaction = new Verification({
        formId: new ObjectId(),
        fields: [
          {
            fieldType: BasicField.Email,
            ...defaultParams,
            _id: new ObjectId(),
          },
          {
            fieldType: BasicField.Mobile,
            ...defaultParams,
            _id: new ObjectId(),
          },
        ],
        expireAt: new Date(Date.now() + 6e5), // so it won't expire in tests
      })
      mockGenerateOtp.mockReturnValue(mockOtp)
      mockBcrypt.hash.mockReturnValue(Promise.resolve(hashedOtp))
      mockFormsgSdk.verification.generateSignature.mockReturnValue(signedData)
    })

    afterEach(async () => await dbHandler.clearDatabase())

    it('should throw error for expired transaction', async () => {
      transaction.expireAt = new Date(1)
      await transaction.save()
      return expect(
        getNewOtp(transaction, transaction.fields[0]._id, mockAnswer),
      ).rejects.toThrowError('TRANSACTION_NOT_FOUND')
    })

    it('should throw error for invalid field ID', async () => {
      return expect(
        getNewOtp(transaction, String(new ObjectId()), mockAnswer),
      ).rejects.toThrowError('Field not found in transaction')
    })

    it('should throw error for OTP requested too soon', async () => {
      // 1min in the future
      transaction.fields[0].hashCreatedAt = new Date(Date.now() + 6e4)
      // Actual error is 'Wait for _ seconds before requesting'
      return expect(
        getNewOtp(transaction, transaction.fields[0]._id, mockAnswer),
      ).rejects.toThrowError('seconds before requesting for a new otp')
    })

    it('should send OTP for email field', async () => {
      // Reset field so we can it update later on
      transaction.fields[0].hashedOtp = null
      transaction.fields[0].signedData = null
      transaction.fields[0].hashCreatedAt = null
      transaction.fields[0].hashRetries = 1
      await transaction.save()
      await getNewOtp(transaction, transaction.fields[0]._id, mockAnswer)
      expect(mockGenerateOtp).toHaveBeenCalled()
      expect(mockBcrypt.hash.mock.calls[0][0]).toBe(mockOtp)
      expect(
        mockFormsgSdk.verification.generateSignature.mock.calls[0][0],
      ).toEqual({
        transactionId: transaction._id,
        formId: transaction.formId,
        fieldId: transaction.fields[0]._id,
        answer: mockAnswer,
      })
      expect(mockMailService.sendVerificationOtp.mock.calls[0]).toEqual([
        mockAnswer,
        mockOtp,
      ])
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction.fields[0].hashCreatedAt).toBeInstanceOf(Date)
      expect(foundTransaction.fields[0].hashedOtp).toBe(hashedOtp)
      expect(foundTransaction.fields[0].signedData).toBe(signedData)
      expect(foundTransaction.fields[0].hashRetries).toBe(0)
    })

    it('should send OTP for mobile field', async () => {
      // Reset field so we can it update later on
      transaction.fields[1].hashedOtp = null
      transaction.fields[1].signedData = null
      transaction.fields[1].hashCreatedAt = null
      transaction.fields[1].hashRetries = 1
      await transaction.save()
      await getNewOtp(transaction, transaction.fields[1]._id, mockAnswer)
      expect(mockGenerateOtp).toHaveBeenCalled()
      expect(mockBcrypt.hash.mock.calls[0][0]).toBe(mockOtp)
      expect(
        mockFormsgSdk.verification.generateSignature.mock.calls[0][0],
      ).toEqual({
        transactionId: transaction._id,
        formId: transaction.formId,
        fieldId: transaction.fields[1]._id,
        answer: mockAnswer,
      })
      expect(mockSmsFactory.sendVerificationOtp.mock.calls[0]).toEqual([
        mockAnswer,
        mockOtp,
        transaction.formId,
      ])
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction.fields[1].hashCreatedAt).toBeInstanceOf(Date)
      expect(foundTransaction.fields[1].hashedOtp).toBe(hashedOtp)
      expect(foundTransaction.fields[1].signedData).toBe(signedData)
      expect(foundTransaction.fields[1].hashRetries).toBe(0)
    })

    it('should catch and re-throw errors thrown when sending email', async () => {
      // So we don't trigger WAIT_FOR_SECONDS error
      transaction.fields[0].hashCreatedAt = null
      transaction.fields[0].signedData = null
      transaction.fields[0].hashCreatedAt = null
      transaction.fields[0].hashRetries = 1
      await transaction.save()
      const myErrorMsg = "I'd like to have an argument please"
      mockMailService.sendVerificationOtp.mockImplementationOnce(() => {
        throw new Error(myErrorMsg)
      })
      return expect(
        getNewOtp(transaction, transaction.fields[0]._id, mockAnswer),
      ).rejects.toThrowError(myErrorMsg)
    })

    it('should catch and re-throw errors thrown when sending sms', async () => {
      // So we don't trigger WAIT_FOR_SECONDS error
      transaction.fields[1].hashCreatedAt = null
      transaction.fields[1].signedData = null
      transaction.fields[1].hashCreatedAt = null
      transaction.fields[1].hashRetries = 1
      await transaction.save()
      const myErrorMsg = 'Tis but a scratch!'
      mockSmsFactory.sendVerificationOtp.mockImplementationOnce(() => {
        throw new Error(myErrorMsg)
      })
      return expect(
        getNewOtp(transaction, transaction.fields[1]._id, mockAnswer),
      ).rejects.toThrowError(myErrorMsg)
    })
  })

  describe('verifyOtp', () => {
    let mockOtp: string, transaction: IVerificationSchema, hashRetries: number
    let signedData: string
    beforeEach(() => {
      jest.clearAllMocks()
      mockOtp = '123456'
      hashRetries = 0
      signedData = 'signedData'
      const defaultParams = {
        hashCreatedAt: new Date(),
        hashedOtp: 'hash',
        signedData,
        hashRetries,
        isVerifiable: true,
      }
      transaction = new Verification({
        formId: new ObjectId(),
        fields: [
          {
            fieldType: BasicField.Email,
            ...defaultParams,
            _id: new ObjectId(),
          },
          {
            fieldType: BasicField.Mobile,
            ...defaultParams,
            _id: new ObjectId(),
          },
        ],
        expireAt: new Date(Date.now() + 6e5), // so it won't expire in tests
      })
    })

    afterEach(async () => await dbHandler.clearDatabase())

    it('should throw error for expired transaction', async () => {
      transaction.expireAt = new Date(1)
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id, mockOtp),
      ).rejects.toThrowError('TRANSACTION_NOT_FOUND')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction.fields[0].hashRetries).toBe(hashRetries)
    })

    it('should throw error for invalid field ID', async () => {
      await transaction.save()
      await expect(
        verifyOtp(transaction, String(new ObjectId()), mockOtp),
      ).rejects.toThrowError('Field not found in transaction')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction.fields[0].hashRetries).toBe(hashRetries)
    })

    it('should throw error for invalid hashed OTP', async () => {
      transaction.fields[0].hashedOtp = null
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id, mockOtp),
      ).rejects.toThrowError('RESEND_OTP')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction.fields[0].hashRetries).toBe(hashRetries)
    })

    it('should throw error for invalid hashCreatedAt', async () => {
      transaction.fields[0].hashCreatedAt = null
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id, mockOtp),
      ).rejects.toThrowError('RESEND_OTP')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction.fields[0].hashRetries).toBe(hashRetries)
    })

    it('should throw error for expired hash', async () => {
      // 10min 10s ago
      transaction.fields[0].hashCreatedAt = new Date(Date.now() - 6.1e5)
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id, mockOtp),
      ).rejects.toThrowError('RESEND_OTP')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction.fields[0].hashRetries).toBe(hashRetries)
    })

    it('should throw error if too many retries', async () => {
      const tooManyRetries = 4
      transaction.fields[0].hashRetries = tooManyRetries
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id, mockOtp),
      ).rejects.toThrowError('RESEND_OTP')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction.fields[0].hashRetries).toBe(tooManyRetries)
    })

    it('should reject invalid OTP', async () => {
      mockBcrypt.compare.mockReturnValueOnce(Promise.resolve(false))
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id, mockOtp),
      ).rejects.toThrowError('INVALID_OTP')
      // Check that database was updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction.fields[0].hashRetries).toBe(hashRetries + 1)
    })

    it('should accept valid OTP', async () => {
      mockBcrypt.compare.mockReturnValueOnce(Promise.resolve(true))
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id, mockOtp),
      ).resolves.toBe(signedData)
      // Check that database was updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction.fields[0].hashRetries).toBe(hashRetries + 1)
    })
  })
})
