import { ObjectID } from 'bson'
import { zipWith } from 'lodash'
import MockDate from 'mockdate'
import mongoose, { LeanDocument, Query } from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'

import getAdminVerificationModel from 'src/app/models/admin_verification.server.model'
import getUserModel from 'src/app/models/user.server.model'
import { InvalidDomainError } from 'src/app/modules/auth/auth.errors'
import * as UserService from 'src/app/modules/user/user.service'
import * as HashUtils from 'src/app/utils/hash'
import * as OtpUtils from 'src/app/utils/otp'
import { AgencyDocument, IPopulatedUser, IUserSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { ApplicationError, DatabaseError } from '../../core/core.errors'
import { InvalidOtpError, MissingUserError } from '../user.errors'

const AdminVerification = getAdminVerificationModel(mongoose)
const UserModel = getUserModel(mongoose)

const MOCKED_DATE = new Date(Date.now())
MockDate.set(MOCKED_DATE)

describe('user.service', () => {
  // Obtained from Twilio's
  // https://www.twilio.com/blog/2018/04/twilio-test-credentials-magic-numbers.html
  const MOCK_CONTACT = '+15005550006'
  const MOCK_OTP = '123456'
  const USER_ID = new ObjectID()
  const ALLOWED_DOMAIN = 'test.gov.sg'

  let defaultAgency: AgencyDocument
  let defaultUser: IUserSchema

  beforeAll(async () => {
    await dbHandler.connect()
  })
  beforeEach(async () => {
    // Insert user into collections.
    const { agency, user } = await dbHandler.insertFormCollectionReqs({
      userId: USER_ID,
      mailDomain: ALLOWED_DOMAIN,
    })

    defaultAgency = agency
    defaultUser = user
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('findContactsForEmails', () => {
    it('should call the correct model static method with the given emails', async () => {
      const mockNumbers = ['+6581234567', '+6581234568']
      const mockEmails = ['a@abc.com', 'b@def.com']
      const mockContacts = zipWith(
        mockEmails,
        mockNumbers,
        (email, contact) => ({ email, contact }),
      )
      const findContactsSpy = jest
        .spyOn(UserModel, 'findContactNumbersByEmails')
        .mockResolvedValueOnce(mockContacts)

      const result = await UserService.findContactsForEmails(mockEmails)

      expect(findContactsSpy).toHaveBeenCalledWith(mockEmails)
      expect(result._unsafeUnwrap()).toEqual(mockContacts)
    })

    it('should return DatabaseError when database query fails', async () => {
      const mockEmails = ['a@abc.com', 'b@def.com']
      const findContactsSpy = jest
        .spyOn(UserModel, 'findContactNumbersByEmails')
        .mockRejectedValueOnce(new Error())

      const result = await UserService.findContactsForEmails(mockEmails)

      expect(findContactsSpy).toHaveBeenCalledWith(mockEmails)
      expect(result._unsafeUnwrapErr()).toEqual(
        new DatabaseError('Failed to retrieve contacts for email addresses'),
      )
    })
  })

  describe('createContactOtp', () => {
    it('should create a new AdminVerification document and return otp', async () => {
      // Arrange
      // Should have no documents prior to this.
      jest.spyOn(OtpUtils, 'generateOtp').mockReturnValueOnce(MOCK_OTP)
      await expect(AdminVerification.countDocuments()).resolves.toEqual(0)

      // Act
      const actualResult = await UserService.createContactOtp(
        USER_ID,
        MOCK_CONTACT,
      )

      // Assert
      expect(actualResult.isOk()).toBe(true)
      expect(actualResult._unsafeUnwrap()).toEqual(MOCK_OTP)
      // An AdminVerification document should have been created.
      // Tests on the schema will be done in the schema's tests.
      await expect(AdminVerification.countDocuments()).resolves.toEqual(1)
    })

    it('should return MissingUserError when userId is invalid', async () => {
      // Arrange
      const invalidUserId = new ObjectID()

      // Act
      const actualResult = await UserService.createContactOtp(
        invalidUserId,
        MOCK_CONTACT,
      )

      // Assert
      expect(actualResult.isErr()).toBe(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(MissingUserError)
    })

    it('should return ApplicationError when hash fails', async () => {
      // Arrange
      // Should have no documents prior to this.
      await expect(AdminVerification.countDocuments()).resolves.toEqual(0)
      // First hash succeeds, second hash fails.
      jest
        .spyOn(HashUtils, 'hashData')
        .mockReturnValueOnce(okAsync('some hash'))
        .mockReturnValueOnce(errAsync(new ApplicationError()))

      // Act
      const actualResult = await UserService.createContactOtp(
        USER_ID,
        MOCK_CONTACT,
      )

      // Assert
      expect(actualResult.isErr()).toBe(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError)
    })
  })

  describe('verifyContactOtp', () => {
    it('should successfully verify otp', async () => {
      // Arrange
      jest.spyOn(OtpUtils, 'generateOtp').mockReturnValueOnce(MOCK_OTP)
      // Add a AdminVerification document to verify against.
      await UserService.createContactOtp(USER_ID, MOCK_CONTACT)
      await expect(AdminVerification.countDocuments()).resolves.toEqual(1)

      // Act
      const actualResult = await UserService.verifyContactOtp(
        MOCK_OTP,
        MOCK_CONTACT,
        USER_ID,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // AdminVerification document should be removed.
      await expect(AdminVerification.countDocuments()).resolves.toEqual(0)
    })

    it('should return MissingUserError when userId is invalid', async () => {
      // Arrange
      const invalidUserId = new ObjectID()

      // Act
      const actualResult = await UserService.verifyContactOtp(
        MOCK_OTP,
        MOCK_CONTACT,
        invalidUserId,
      )

      // Assert
      expect(actualResult.isErr()).toBe(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(MissingUserError)
    })

    it('should return InvalidOtpError when AdminVerification document does not exist', async () => {
      // Arrange
      // No OTP requested; should have no documents prior to acting.
      await expect(AdminVerification.countDocuments()).resolves.toEqual(0)

      // Act
      const actualResult = await UserService.verifyContactOtp(
        MOCK_OTP,
        MOCK_CONTACT,
        USER_ID,
      )
      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new InvalidOtpError('OTP has expired. Please request for a new OTP.'),
      )
    })

    it('should return InvalidOtpError when verification has been attempted too many times', async () => {
      // Arrange
      // Insert new AdminVerification document with initial MAX_OTP_ATTEMPTS.
      await UserService.createContactOtp(USER_ID, MOCK_CONTACT)
      await AdminVerification.findOneAndUpdate(
        { admin: USER_ID },
        { $inc: { numOtpAttempts: UserService.MAX_OTP_ATTEMPTS } },
      )

      // Act
      const actualResult = await UserService.verifyContactOtp(
        MOCK_OTP,
        MOCK_CONTACT,
        USER_ID,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new InvalidOtpError(
          'You have hit the max number of attempts. Please request for a new OTP.',
        ),
      )
    })

    it('should return InvalidOtpError when OTP hash does not match', async () => {
      // Arrange
      // Insert new AdminVerification document.
      await UserService.createContactOtp(USER_ID, MOCK_CONTACT)
      const invalidOtp = '654321'

      // Act
      const actualResult = await UserService.verifyContactOtp(
        invalidOtp,
        MOCK_CONTACT,
        USER_ID,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new InvalidOtpError('OTP is invalid. Please try again.'),
      )
    })

    it('should return InvalidOtpError when contact hash does not match', async () => {
      // Arrange
      jest.spyOn(OtpUtils, 'generateOtp').mockReturnValueOnce(MOCK_OTP)
      // Insert new AdminVerification document.
      await UserService.createContactOtp(USER_ID, MOCK_CONTACT)
      const invalidContact = '123456'

      // Act
      const actualResult = await UserService.verifyContactOtp(
        MOCK_OTP,
        invalidContact,
        USER_ID,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new InvalidOtpError(
          'Contact number given does not match the number the OTP is sent to. Please try again with the correct contact number.',
        ),
      )
    })
  })

  describe('updateUserContact', () => {
    it('should update user successfully', async () => {
      // Arrange
      // Create new user
      const user = await dbHandler.insertUser({
        agencyId: defaultAgency._id,
        mailName: 'updateUserContact',
      })
      // User should not have contact
      expect(user.contact).toBeUndefined()

      // Act
      const actualResult = await UserService.updateUserContact(
        MOCK_CONTACT,
        user._id,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      const actualUser = actualResult._unsafeUnwrap()
      expect(actualUser.contact).toEqual(MOCK_CONTACT)
      // Returned document's agency should be populated.
      expect(actualUser.agency.toObject()).toEqual(defaultAgency.toObject())
    })

    it('should return MissingUserError if userId is invalid', async () => {
      // Arrange
      const invalidUserId = new ObjectID()

      // Act
      const actualResult = await UserService.updateUserContact(
        MOCK_CONTACT,
        invalidUserId,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(MissingUserError)
    })
  })

  describe('updateUserLastSeenFeatureUpdateVersion', () => {
    const MOCK_FEATURE_VERSION = 10

    it('should update user successfully', async () => {
      const user = await dbHandler.insertUser({
        agencyId: defaultAgency._id,
        mailName: 'updateUserLastSeenFeatureUpdateVersion',
      })

      expect(user.flags?.lastSeenFeatureUpdateVersion).toBeUndefined()

      const actualResult =
        await UserService.updateUserLastSeenFeatureUpdateVersion(
          user._id,
          MOCK_FEATURE_VERSION,
        )

      const updatedUser = await UserService.getPopulatedUserById(user._id)
      expect(actualResult.isOk()).toEqual(true)
      expect(
        updatedUser._unsafeUnwrap()?.toObject().flags
          ?.lastSeenFeatureUpdateVersion,
      ).toEqual(MOCK_FEATURE_VERSION)
    })

    it('should return MissingUserError if userId is invalid', async () => {
      // Arrange
      const invalidUserId = new ObjectID()

      // Act
      const actualResult =
        await UserService.updateUserLastSeenFeatureUpdateVersion(
          invalidUserId,
          MOCK_FEATURE_VERSION,
        )
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(MissingUserError)
    })
  })

  describe('getPopulatedUserById', () => {
    it('should return populated user successfully', async () => {
      // Arrange
      const expected = {
        ...defaultUser.toObject(),
        agency: defaultAgency.toObject(),
      }

      // Act
      const actualResult = await UserService.getPopulatedUserById(USER_ID)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()?.toObject()).toEqual(expected)
    })

    it('should return populated user with last seen feature update version successfully', async () => {
      const mockUserIdWithLastSeenFeatureUpdate = new ObjectID()
      const { agency, user } = await dbHandler.insertFormCollectionReqs({
        userId: mockUserIdWithLastSeenFeatureUpdate,
        mailName: 'userWithLastSeenFeatureUpdate',
        mailDomain: ALLOWED_DOMAIN,
        flags: { lastSeenFeatureUpdateVersion: 3 },
      })

      const defaultUserWithLastSeenFeatureUpdate: IUserSchema = user
      const defaultAgencyWithLastSeenFeatureUpdate: AgencyDocument = agency
      const expected = {
        ...defaultUserWithLastSeenFeatureUpdate.toObject(),
        agency: defaultAgencyWithLastSeenFeatureUpdate.toObject(),
      }

      // Act
      const actualResult = await UserService.getPopulatedUserById(
        mockUserIdWithLastSeenFeatureUpdate,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()?.toObject()).toEqual(expected)
    })

    it('should return MissingUserError when user cannot be found', async () => {
      // Arrange
      const invalidUser = new ObjectID()

      // Act
      const actualResult = await UserService.getPopulatedUserById(invalidUser)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(MissingUserError)
    })
  })

  describe('retrieveUser', () => {
    it('should return InvalidDomainError on invalid email', async () => {
      // Arrange
      const notAnEmail = 'not an email'

      // Act
      const actualResult = await UserService.retrieveUser(
        notAnEmail,
        defaultAgency._id,
      )

      // Assert
      expect(actualResult.isErr()).toBe(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidDomainError)
    })

    it('should return new User document when user does not yet exist in the collection', async () => {
      // Arrange
      const newUserEmail = `newUser@${ALLOWED_DOMAIN}`
      // Should have the default user document in collection.
      await expect(UserModel.countDocuments()).resolves.toEqual(1)

      // Act
      const actualResult = await UserService.retrieveUser(
        newUserEmail,
        defaultAgency._id,
      )

      // Assert
      const expectedUser: Partial<LeanDocument<IPopulatedUser>> = {
        agency: defaultAgency.toObject(),
        email: newUserEmail,
        lastAccessed: MOCKED_DATE,
      }
      expect(actualResult.isOk()).toBe(true)
      // Should now have 2 user documents
      await expect(UserModel.countDocuments()).resolves.toEqual(2)
      expect(actualResult._unsafeUnwrap().toObject()).toEqual(
        expect.objectContaining(expectedUser),
      )
    })

    it('should return existing User document when user already exists', async () => {
      // Arrange
      // Should have the default user document in collection.
      await expect(UserModel.countDocuments()).resolves.toEqual(1)
      const userEmail = defaultUser.email

      // Act
      const actualResult = await UserService.retrieveUser(
        userEmail,
        defaultAgency._id,
      )

      // Assert
      const expectedUser: Partial<LeanDocument<IPopulatedUser>> = {
        ...defaultUser.toObject(),
        agency: defaultAgency.toObject(),
        lastAccessed: MOCKED_DATE,
      }
      expect(actualResult.isOk()).toBe(true)
      // Should still only have 1 user document.
      await expect(UserModel.countDocuments()).resolves.toEqual(1)
      expect(actualResult._unsafeUnwrap().toObject()).toEqual(
        expect.objectContaining(expectedUser),
      )
    })
  })

  describe('findUserById', () => {
    it('should return admin successfully', async () => {
      // Arrange
      const mockUserId = new ObjectID().toHexString()
      const findSpy = jest.spyOn(UserModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(defaultUser),
      } as unknown as Query<IUserSchema | null, IUserSchema, unknown>)

      // Act
      const actualResult = await UserService.findUserById(mockUserId)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(defaultUser)
      expect(findSpy).toHaveBeenCalledWith(mockUserId)
    })

    it('should return DatabaseError when query throws an error', async () => {
      // Arrange
      const mockUserId = new ObjectID().toHexString()
      const findSpy = jest.spyOn(UserModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockRejectedValue(new Error('database bad')),
      } as unknown as Query<IUserSchema | null, IUserSchema, unknown>)

      // Act
      const actualResult = await UserService.findUserById(mockUserId)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
      expect(findSpy).toHaveBeenCalledWith(mockUserId)
    })

    it('should return MissingUserError when query returns null', async () => {
      // Arrange
      const mockUserId = new ObjectID().toHexString()
      const findSpy = jest.spyOn(UserModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as unknown as Query<IUserSchema | null, IUserSchema, unknown>)

      // Act
      const actualResult = await UserService.findUserById(mockUserId)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(MissingUserError)
      expect(findSpy).toHaveBeenCalledWith(mockUserId)
    })
  })

  describe('findUserByEmail', () => {
    it('should return admin successfully', async () => {
      // Arrange
      const mockEmail = 'someemail@example.com'
      const findSpy = jest.spyOn(UserModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(defaultUser),
      } as unknown as Query<IUserSchema | null, IUserSchema, unknown>)

      // Act
      const actualResult = await UserService.findUserByEmail(mockEmail)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(defaultUser)
      expect(findSpy).toHaveBeenCalledWith({ email: mockEmail })
    })

    it('should return DatabaseError when query throws an error', async () => {
      // Arrange
      const mockEmail = 'another@example.com'
      const findSpy = jest.spyOn(UserModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockRejectedValue(new Error('database bad!')),
      } as unknown as Query<IUserSchema | null, IUserSchema, unknown>)

      // Act
      const actualResult = await UserService.findUserByEmail(mockEmail)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
      expect(findSpy).toHaveBeenCalledWith({ email: mockEmail })
    })

    it('should return MissingUserError when query returns null', async () => {
      // Arrange
      const mockEmail = 'mockEmail@example.com'
      const findSpy = jest.spyOn(UserModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as unknown as Query<IUserSchema | null, IUserSchema, unknown>)

      // Act
      const actualResult = await UserService.findUserByEmail(mockEmail)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(MissingUserError)
      expect(findSpy).toHaveBeenCalledWith({ email: mockEmail })
    })
  })
})
