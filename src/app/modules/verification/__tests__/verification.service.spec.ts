import bcrypt from 'bcrypt'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import MailService from 'src/app/services/mail/mail.service'
import { SmsFactory } from 'src/app/services/sms/sms.factory'
import { generateOtp } from 'src/app/utils/otp'
import formsgSdk from 'src/config/formsg-sdk'
import { SALT_ROUNDS } from 'src/shared/util/verification'
import { BasicField, IVerificationSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import getVerificationModel from '../verification.model'
import { getNewOtp, verifyOtp } from '../verification.service'

const Verification = getVerificationModel(mongoose)

// Set up mocks
jest.mock('src/app/utils/otp')
const MockGenerateOtp = mocked(generateOtp, true)
jest.mock('src/config/formsg-sdk')
const MockFormsgSdk = mocked(formsgSdk, true)
jest.mock('src/app/services/sms/sms.factory')
const MockSmsFactory = mocked(SmsFactory, true)
jest.mock('src/app/services/mail/mail.service')
const MockMailService = mocked(MailService, true)
jest.mock('bcrypt')
const MockBcrypt = mocked(bcrypt, true)

describe('Verification service', () => {
  beforeAll(async () => {
    await dbHandler.connect()
  })

  afterAll(async () => await dbHandler.closeDatabase())

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
      MockGenerateOtp.mockReturnValue(mockOtp)
      MockBcrypt.hash.mockReturnValue(Promise.resolve(hashedOtp))
      MockFormsgSdk.verification.generateSignature!.mockReturnValue(signedData)
    })

    afterEach(async () => await dbHandler.clearDatabase())

    it('should throw error when transaction is expired', async () => {
      transaction.expireAt = new Date(1)
      await transaction.save()
      return expect(
        getNewOtp(transaction, transaction.fields[0]._id!, mockAnswer),
      ).rejects.toThrowError('TRANSACTION_NOT_FOUND')
    })

    it('should throw error when field ID is invalid', async () => {
      return expect(
        getNewOtp(transaction, String(new ObjectId()), mockAnswer),
      ).rejects.toThrowError('Field not found in transaction')
    })

    it('should throw error when OTP is requested too soon', async () => {
      // 1min in the future
      transaction.fields[0].hashCreatedAt = new Date(Date.now() + 6e4)
      // Actual error is 'Wait for _ seconds before requesting'
      return expect(
        getNewOtp(transaction, transaction.fields[0]._id!, mockAnswer),
      ).rejects.toThrowError('seconds before requesting for a new otp')
    })

    it('should send OTP when params are valid for email field', async () => {
      // Arrange
      // Reset field so we can it update later on
      transaction.fields[0].hashedOtp = null
      transaction.fields[0].signedData = null
      transaction.fields[0].hashCreatedAt = null
      transaction.fields[0].hashRetries = 1
      await transaction.save()
      // Mock success of mail sending.
      MockMailService.sendVerificationOtp.mockReturnValueOnce(okAsync(true))

      // Act
      await getNewOtp(transaction, transaction.fields[0]._id!, mockAnswer)

      // Assert
      expect(MockGenerateOtp).toHaveBeenCalled()
      expect(MockBcrypt.hash).toHaveBeenCalledWith(mockOtp, SALT_ROUNDS)
      expect(MockFormsgSdk.verification.generateSignature).toHaveBeenCalledWith(
        {
          transactionId: transaction._id,
          formId: transaction.formId,
          fieldId: transaction.fields[0]._id!,
          answer: mockAnswer,
        },
      )
      expect(MockMailService.sendVerificationOtp).toHaveBeenCalledWith(
        mockAnswer,
        mockOtp,
      )
      // Verification document should have been updated.
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })

      expect(foundTransaction!.fields[0]).toEqual(
        expect.objectContaining({
          hashCreatedAt: expect.any(Date),
          hashedOtp,
          signedData,
          hashRetries: 0,
        }),
      )
    })

    it('should send OTP when params are valid for mobile field', async () => {
      // Arrange
      // Reset field so we can test update later on
      transaction.fields[1].hashedOtp = null
      transaction.fields[1].signedData = null
      transaction.fields[1].hashCreatedAt = null
      transaction.fields[1].hashRetries = 1
      await transaction.save()
      // Mock success of sms sending.
      MockSmsFactory.sendVerificationOtp.mockReturnValueOnce(okAsync(true))

      // Act
      await getNewOtp(transaction, transaction.fields[1]._id!, mockAnswer)

      // Assert
      expect(MockGenerateOtp).toHaveBeenCalled()
      expect(MockBcrypt.hash).toHaveBeenCalledWith(mockOtp, SALT_ROUNDS)
      expect(MockFormsgSdk.verification.generateSignature).toHaveBeenCalledWith(
        {
          transactionId: transaction._id,
          formId: transaction.formId,
          fieldId: transaction.fields[1]._id,
          answer: mockAnswer,
        },
      )
      expect(MockSmsFactory.sendVerificationOtp).toHaveBeenCalledWith(
        mockAnswer,
        mockOtp,
        transaction.formId,
      )
      // Verification document should have been updated.
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction!.fields[1]).toEqual(
        expect.objectContaining({
          hashCreatedAt: expect.any(Date),
          hashedOtp,
          signedData,
          hashRetries: 0,
        }),
      )
    })

    it('should catch and re-throw errors thrown when sending email', async () => {
      // So we don't trigger WAIT_FOR_SECONDS error
      transaction.fields[0].hashCreatedAt = null
      transaction.fields[0].signedData = null
      transaction.fields[0].hashCreatedAt = null
      transaction.fields[0].hashRetries = 1
      await transaction.save()
      const myErrorMsg = "I'd like to have an argument please"
      MockMailService.sendVerificationOtp.mockImplementationOnce(() => {
        throw new Error(myErrorMsg)
      })
      return expect(
        getNewOtp(transaction, transaction.fields[0]._id!, mockAnswer),
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
      MockSmsFactory.sendVerificationOtp.mockImplementationOnce(() => {
        throw new Error(myErrorMsg)
      })
      return expect(
        getNewOtp(transaction, transaction.fields[1]._id!, mockAnswer),
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

    it('should throw error when transaction is expired', async () => {
      transaction.expireAt = new Date(1)
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id!, mockOtp),
      ).rejects.toThrowError('TRANSACTION_NOT_FOUND')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction!.fields[0].hashRetries).toBe(hashRetries)
    })

    it('should throw error when field ID is invalid', async () => {
      await transaction.save()
      await expect(
        verifyOtp(transaction, String(new ObjectId()), mockOtp),
      ).rejects.toThrowError('Field not found in transaction')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction!.fields[0].hashRetries).toBe(hashRetries)
    })

    it('should throw error when hashed OTP is invalid', async () => {
      transaction.fields[0].hashedOtp = null
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id!, mockOtp),
      ).rejects.toThrowError('RESEND_OTP')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction!.fields[0].hashRetries).toBe(hashRetries)
    })

    it('should throw error when hashCreatedAt is invalid', async () => {
      transaction.fields[0].hashCreatedAt = null
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id!, mockOtp),
      ).rejects.toThrowError('RESEND_OTP')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction!.fields[0].hashRetries).toBe(hashRetries)
    })

    it('should throw error when hash is expired', async () => {
      // 10min 10s ago
      transaction.fields[0].hashCreatedAt = new Date(Date.now() - 6.1e5)
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id!, mockOtp),
      ).rejects.toThrowError('RESEND_OTP')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction!.fields[0].hashRetries).toBe(hashRetries)
    })

    it('should throw error when retries are maxed out', async () => {
      const tooManyRetries = 4
      transaction.fields[0].hashRetries = tooManyRetries
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id!, mockOtp),
      ).rejects.toThrowError('RESEND_OTP')
      // Check that database was not updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction!.fields[0].hashRetries).toBe(tooManyRetries)
    })

    it('should reject when OTP is invalid', async () => {
      MockBcrypt.compare.mockReturnValueOnce(Promise.resolve(false))
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id!, mockOtp),
      ).rejects.toThrowError('INVALID_OTP')
      // Check that database was updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction!.fields[0].hashRetries).toBe(hashRetries + 1)
    })

    it('should resolve when OTP is invalid', async () => {
      MockBcrypt.compare.mockReturnValueOnce(Promise.resolve(true))
      await transaction.save()
      await expect(
        verifyOtp(transaction, transaction.fields[0]._id!, mockOtp),
      ).resolves.toBe(signedData)
      // Check that database was updated
      const foundTransaction = await Verification.findOne({
        _id: transaction._id,
      })
      expect(foundTransaction!.fields[0].hashRetries).toBe(hashRetries + 1)
    })
  })
})
