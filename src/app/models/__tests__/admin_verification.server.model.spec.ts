import { ObjectID } from 'bson'
import mongoose from 'mongoose'

import getAdminVerificationModel from 'src/app/models/admin_verification.server.model'
import {
  IAdminVerification,
  UpsertOtpParams,
} from 'src/types/admin_verification'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

const AdminVerification = getAdminVerificationModel(mongoose)

describe('AdminVerification Model', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    const DEFAULT_PARAMS: IAdminVerification = {
      admin: new ObjectID(),
      expireAt: new Date(),
      hashedContact: 'mockHashedContact',
      hashedOtp: 'mockHashedOtp',
    }
    it('should create and save successfully', async () => {
      // Act
      const actual = await AdminVerification.create(DEFAULT_PARAMS)

      // Assert
      // All fields should exist
      // Object Id should be defined when successfully saved to MongoDB.
      expect(actual._id).toBeDefined()
      expect(actual.createdAt).toBeInstanceOf(Date)
      expect(actual.updatedAt).toBeInstanceOf(Date)
      expect(actual.toObject()).toMatchObject({
        ...DEFAULT_PARAMS,
        // Add defaults
        numOtpAttempts: 0,
        numOtpSent: 0,
      })
    })

    it('should create and save successfully with defaults overriden', async () => {
      // Arrange
      const customParams: IAdminVerification = {
        ...DEFAULT_PARAMS,
        numOtpAttempts: 10,
      }

      // Act
      const actual = await AdminVerification.create(customParams)

      // Assert
      // All fields should exist
      // Object Id should be defined when successfully saved to MongoDB.
      expect(actual._id).toBeDefined()
      expect(actual.createdAt).toBeInstanceOf(Date)
      expect(actual.updatedAt).toBeInstanceOf(Date)
      expect(actual).toEqual(
        expect.objectContaining({
          ...customParams,
          // Add defaults that has not been overridden.
          numOtpSent: 0,
        }),
      )
    })

    it('should throw validation error on missing admin', async () => {
      // Arrange
      const missingAdminParams = { ...DEFAULT_PARAMS, admin: undefined }

      // Act
      const actualPromise = AdminVerification.create(missingAdminParams)

      // Assert
      await expect(actualPromise).rejects.toThrow(
        'AdminVerificationSchema must have an Admin',
      )
    })

    it('should throw validation error on missing hashedContact', async () => {
      // Arrange
      const missingContactParams = {
        ...DEFAULT_PARAMS,
        hashedContact: undefined,
      }

      // Act
      const actualPromise = AdminVerification.create(missingContactParams)

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error on missing hashedOtp', async () => {
      // Arrange
      const missingOtpParams = {
        ...DEFAULT_PARAMS,
        hashedOtp: undefined,
      }

      // Act
      const actualPromise = AdminVerification.create(missingOtpParams)

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error on missing expireAt', async () => {
      // Arrange
      const missingExpireParams = {
        ...DEFAULT_PARAMS,
        expireAt: undefined,
      }

      // Act
      const actualPromise = AdminVerification.create(missingExpireParams)

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })
  })

  describe('Statics', () => {
    describe('upsertOtp', () => {
      it('should create successfully when document does not exist', async () => {
        // Arrange
        const params: UpsertOtpParams = {
          admin: new ObjectID(),
          expireAt: new Date(),
          hashedContact: 'mockHashedContact',
          hashedOtp: 'mockHashedOtp',
        }
        // Should have no documents yet.
        await expect(AdminVerification.countDocuments()).resolves.toEqual(0)

        // Act
        const actual = await AdminVerification.upsertOtp(params)

        // Assert
        // Add defaults to expected result
        const expected = { ...params, numOtpAttempts: 0, numOtpSent: 1 }
        // Should now have one document.
        await expect(AdminVerification.countDocuments()).resolves.toEqual(1)
        expect(actual).toEqual(expect.objectContaining(expected))
      })

      it('should update successfully when a document already exists', async () => {
        // Arrange
        // Insert mock document into collection.
        const adminId = new ObjectID()
        const oldExpireAt = new Date()
        const newExpireAt = new Date(Date.now() + 9000000)
        const oldNumOtpSent = 3
        await AdminVerification.create({
          admin: adminId,
          expireAt: oldExpireAt,
          hashedContact: 'oldMockHashedContact',
          hashedOtp: 'oldMockHashedOtp',
          numOtpAttempts: 10,
          numOtpSent: oldNumOtpSent,
        })
        // Should have the added document.
        await expect(AdminVerification.countDocuments()).resolves.toEqual(1)

        const upsertParams: UpsertOtpParams = {
          admin: adminId,
          expireAt: newExpireAt,
          hashedContact: 'mockHashedContact',
          hashedOtp: 'mockHashedOtp',
        }

        // Act
        const actual = await AdminVerification.upsertOtp(upsertParams)
        // Assert
        // Add defaults to expected result
        // numOtpAttempts should be reset, but the numOtpSent should be
        // incremented.
        const expected = {
          ...upsertParams,
          numOtpAttempts: 0,
          numOtpSent: oldNumOtpSent + 1,
        }
        // Should still only have one document.
        await expect(AdminVerification.countDocuments()).resolves.toEqual(1)
        expect(actual).toEqual(expect.objectContaining(expected))
      })

      it('should throw error if validation fails due to invalid upsert parameters', async () => {
        // Arrange
        const invalidParams: UpsertOtpParams = {
          // Invalid admin parameter.
          admin: undefined,
          expireAt: new Date(),
          hashedContact: 'mockHashedContact',
          hashedOtp: 'mockHashedOtp',
        }
        // Should have no documents yet.
        await expect(AdminVerification.countDocuments()).resolves.toEqual(0)

        // Act
        const actualPromise = AdminVerification.upsertOtp(invalidParams)

        // Assert
        await expect(actualPromise).rejects.toThrow(
          'AdminVerificationSchema must have an Admin',
        )
      })
    })

    describe('incrementAttemptsByAdminId', () => {
      it('should increment successfully', async () => {
        // Arrange
        // Insert mock document into collection.
        const adminId = new ObjectID()
        const initialOtpAttempts = 5
        const adminVerificationParams = {
          admin: adminId,
          expireAt: new Date(),
          hashedContact: 'oldMockHashedContact',
          hashedOtp: 'oldMockHashedOtp',
          numOtpAttempts: initialOtpAttempts,
          numOtpSent: 3,
        }
        await AdminVerification.create(adminVerificationParams)
        // Should have the added document.
        await expect(AdminVerification.countDocuments()).resolves.toEqual(1)

        // Act
        const actualPromise =
          AdminVerification.incrementAttemptsByAdminId(adminId)

        // Assert
        // Exactly the same as initial params, but with numOtpAttempts
        // incremented by 1.
        await expect(actualPromise).resolves.toEqual(
          expect.objectContaining({
            ...adminVerificationParams,
            numOtpAttempts: initialOtpAttempts + 1,
          }),
        )
      })

      it('should return null if document cannot be retrieved', async () => {
        // Arrange
        // Should have no documents yet.
        await expect(AdminVerification.countDocuments()).resolves.toEqual(0)
        const freshAdminId = new ObjectID()

        // Act
        const actualPromise =
          AdminVerification.incrementAttemptsByAdminId(freshAdminId)

        // Assert
        await expect(actualPromise).resolves.toBeNull()
      })
    })
  })
})
