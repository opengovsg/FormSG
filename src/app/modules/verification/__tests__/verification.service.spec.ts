import bcrypt from 'bcrypt'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import { BasicField, IVerificationSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import getVerificationModel from '../verification.model'
import { verifyOtp } from '../verification.service'

const Verification = getVerificationModel(mongoose)

// Set up mocks
jest.mock('bcrypt')
const MockBcrypt = mocked(bcrypt, true)

describe('Verification service', () => {
  beforeAll(async () => {
    await dbHandler.connect()
  })

  afterAll(async () => await dbHandler.closeDatabase())

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
