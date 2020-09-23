import { ObjectID } from 'bson'
import MockDate from 'mockdate'
import mongoose from 'mongoose'
import { ImportMock } from 'ts-mock-imports'

import getAdminVerificationModel from 'src/app/models/admin_verification.server.model'
import getUserModel from 'src/app/models/user.server.model'
import { InvalidDomainError } from 'src/app/modules/auth/auth.errors'
import * as UserService from 'src/app/modules/user/user.service'
import * as OtpUtils from 'src/app/utils/otp'
import { IAgencySchema, IPopulatedUser, IUserSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

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

  let defaultAgency: IAgencySchema
  let defaultUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    // Insert user into collections.
    const { agency, user } = await dbHandler.insertFormCollectionReqs({
      userId: USER_ID,
      mailDomain: ALLOWED_DOMAIN,
    })

    defaultAgency = agency.toObject()
    defaultUser = user.toObject()
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('createContactOtp', () => {
    it('should create a new AdminVerification document and return otp', async () => {
      // Arrange
      // All calls to generateOtp will return MOCK_OTP.
      ImportMock.mockFunction(OtpUtils, 'generateOtp', MOCK_OTP)
      // Should have no documents prior to this.
      await expect(AdminVerification.countDocuments()).resolves.toEqual(0)

      // Act
      const actualOtp = await UserService.createContactOtp(
        USER_ID,
        MOCK_CONTACT,
      )

      // Assert
      expect(actualOtp).toEqual(MOCK_OTP)
      // An AdminVerification document should have been created.
      // Tests on the schema will be done in the schema's tests.
      await expect(AdminVerification.countDocuments()).resolves.toEqual(1)
    })

    it('should throw error when userId is invalid', async () => {
      // Arrange
      const invalidUserId = new ObjectID()

      // Act + Assert
      await expect(
        UserService.createContactOtp(invalidUserId, MOCK_CONTACT),
      ).rejects.toThrowError('User id is invalid')
    })
  })

  describe('verifyContactOtp', () => {
    it('should successfully verify otp', async () => {
      // Arrange
      // Add a AdminVerification document to verify against.
      await UserService.createContactOtp(USER_ID, MOCK_CONTACT)
      await expect(AdminVerification.countDocuments()).resolves.toEqual(1)

      // Act
      const verifyPromise = UserService.verifyContactOtp(
        MOCK_OTP,
        MOCK_CONTACT,
        USER_ID,
      )

      // Assert
      // Resolves successfully.
      await expect(verifyPromise).resolves.toEqual(true)
      // AdminVerification document should be removed.
      await expect(AdminVerification.countDocuments()).resolves.toEqual(0)
    })

    it('should throw error when AdminVerification document cannot be retrieved', async () => {
      // Arrange
      // No OTP requested; should have no documents prior to acting.
      await expect(AdminVerification.countDocuments()).resolves.toEqual(0)

      // Act
      const verifyPromise = UserService.verifyContactOtp(
        MOCK_OTP,
        MOCK_CONTACT,
        USER_ID,
      )
      // Act + Assert
      await expect(verifyPromise).rejects.toThrowError(
        'OTP has expired. Please request for a new OTP.',
      )
    })

    it('should throw error when verification has been attempted too many times', async () => {
      // Arrange
      // Insert new AdminVerification document with initial MAX_OTP_ATTEMPTS.
      await UserService.createContactOtp(USER_ID, MOCK_CONTACT)
      await AdminVerification.findOneAndUpdate(
        { admin: USER_ID },
        { $inc: { numOtpAttempts: UserService.MAX_OTP_ATTEMPTS } },
      )

      // Act
      const verifyPromise = UserService.verifyContactOtp(
        MOCK_OTP,
        MOCK_CONTACT,
        USER_ID,
      )

      // Assert
      await expect(verifyPromise).rejects.toThrowError(
        'You have hit the max number of attempts. Please request for a new OTP.',
      )
    })

    it('should throw error when OTP hash does not match', async () => {
      // Arrange
      // Insert new AdminVerification document.
      await UserService.createContactOtp(USER_ID, MOCK_CONTACT)
      const invalidOtp = '654321'

      // Act
      const verifyPromise = UserService.verifyContactOtp(
        invalidOtp,
        MOCK_CONTACT,
        USER_ID,
      )

      // Assert
      await expect(verifyPromise).rejects.toThrowError(
        'OTP is invalid. Please try again.',
      )
    })

    it('should throw error when contact hash does not match', async () => {
      // Arrange
      // Insert new AdminVerification document.
      await UserService.createContactOtp(USER_ID, MOCK_CONTACT)
      const invalidContact = '123456'

      // Act
      const verifyPromise = UserService.verifyContactOtp(
        MOCK_OTP,
        invalidContact,
        USER_ID,
      )

      // Assert
      await expect(verifyPromise).rejects.toThrowError(
        'Contact number given does not match the number the OTP is sent to. Please try again with the correct contact number.',
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
      const updatedUser = await UserService.updateUserContact(
        MOCK_CONTACT,
        user._id,
      )

      // Assert
      expect(updatedUser.contact).toEqual(MOCK_CONTACT)
      // Returned document's agency should be populated.
      expect(updatedUser.agency.toObject()).toEqual(defaultAgency)
    })

    it('should throw error if userId is invalid', async () => {
      // Arrange
      const invalidUserId = new ObjectID()

      // Act
      const updatePromise = UserService.updateUserContact(
        MOCK_CONTACT,
        invalidUserId,
      )

      // Assert
      await expect(updatePromise).rejects.toThrowError('User id is invalid')
    })
  })

  describe('getPopulatedUserById', () => {
    it('should return populated user successfully', async () => {
      // Arrange
      const expected = {
        ...defaultUser,
        agency: defaultAgency,
      }

      // Act
      const actual = await UserService.getPopulatedUserById(USER_ID)

      // Assert
      expect(actual?.toObject()).toEqual(expected)
    })

    it('should return null when user cannot be found', async () => {
      // Act
      const userPromise = UserService.getPopulatedUserById(new ObjectID())

      // Assert
      await expect(userPromise).resolves.toBeNull()
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
      const expectedUser: Partial<IPopulatedUser> = {
        agency: defaultAgency,
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
      const expectedUser: Partial<IPopulatedUser> = {
        ...defaultUser,
        agency: defaultAgency,
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
})
