import mongoose from 'mongoose'
import { ImportMock } from 'ts-mock-imports'

import getTokenModel from 'src/app/models/token.server.model'
import * as OtpUtils from 'src/app/utils/otp'
import { IAgencySchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { InvalidDomainError, InvalidOtpError } from '../auth.errors'
import * as AuthService from '../auth.service'

const TokenModel = getTokenModel(mongoose)

const VALID_EMAIL_DOMAIN = 'test.gov.sg'
const VALID_EMAIL = `valid@${VALID_EMAIL_DOMAIN}`
const MOCK_OTP = '123456'

// All calls to generateOtp will return MOCK_OTP.
ImportMock.mockFunction(OtpUtils, 'generateOtp', MOCK_OTP)

describe('auth.service', () => {
  let defaultAgency: IAgencySchema

  beforeAll(async () => {
    await dbHandler.connect()
    defaultAgency = await dbHandler.insertAgency({
      mailDomain: VALID_EMAIL_DOMAIN,
    })
  })

  // Only need to clear Token collection, and ignore other collections.
  beforeEach(
    async () =>
      await dbHandler.clearCollection(TokenModel.collection.collectionName),
  )

  afterAll(async () => await dbHandler.closeDatabase())

  describe('validateEmailDomain', () => {
    it('should retrieve agency successfully when email is valid and domain is in Agency collection', async () => {
      // Act
      const actual = await AuthService.validateEmailDomain(VALID_EMAIL)

      // Assert
      expect(actual.isOk()).toBe(true)
      expect(actual._unsafeUnwrap().toObject()).toEqual(
        defaultAgency.toObject(),
      )
    })

    it('should return InvalidDomainError error result when email is invalid', async () => {
      // Arrange
      const notAnEmail = 'not an email'

      // Act
      const actual = await AuthService.validateEmailDomain(notAnEmail)

      // Assert
      expect(actual.isErr()).toBe(true)
      expect(actual._unsafeUnwrapErr()).toEqual(new InvalidDomainError())
    })

    it('should return InvalidDomainError error result when valid email domain is not in Agency collection', async () => {
      // Arrange
      const invalidEmail = 'invalid@example.com'

      // Act
      const actual = await AuthService.validateEmailDomain(invalidEmail)

      // Assert
      expect(actual.isErr()).toBe(true)
      expect(actual._unsafeUnwrapErr()).toEqual(new InvalidDomainError())
    })
  })

  describe('createLoginOtp', () => {
    it('should create login otp successfully when email is valid', async () => {
      // Arrange
      // Should have no documents prior to this.
      await expect(TokenModel.countDocuments()).resolves.toEqual(0)

      // Act
      const actualResult = await AuthService.createLoginOtp(VALID_EMAIL)

      // Assert
      expect(actualResult.isOk()).toBe(true)
      expect(actualResult._unsafeUnwrap()).toEqual(MOCK_OTP)
      // Should have new token document inserted.
      await expect(TokenModel.countDocuments()).resolves.toEqual(1)
    })

    it('should return with InvalidDomainError when email is invalid', async () => {
      // Arrange
      const notAnEmail = 'not an email'

      // Act
      const actualResult = await AuthService.createLoginOtp(notAnEmail)

      // Assert
      expect(actualResult.isErr()).toBe(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(InvalidDomainError)
    })
  })

  describe('verifyLoginOtp', () => {
    it('should successfully return true and delete Token document when OTP hash matches', async () => {
      // Arrange
      // Add a Token document to verify against.
      await AuthService.createLoginOtp(VALID_EMAIL)
      await expect(TokenModel.countDocuments()).resolves.toEqual(1)

      // Act
      const actualResult = await AuthService.verifyLoginOtp(
        MOCK_OTP,
        VALID_EMAIL,
      )

      // Assert
      // Resolves successfully.
      expect(actualResult.isOk()).toBe(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Token document should be removed.
      await expect(TokenModel.countDocuments()).resolves.toEqual(0)
    })

    it('should return with InvalidOtpError when Token document cannot be retrieved', async () => {
      // Arrange
      // No OTP requested; should have no documents prior to acting.
      await expect(TokenModel.countDocuments()).resolves.toEqual(0)

      // Act
      const actualResult = await AuthService.verifyLoginOtp(
        MOCK_OTP,
        VALID_EMAIL,
      )

      // Assert
      const expectedError = new InvalidOtpError(
        'OTP has expired. Please request for a new OTP.',
      )
      expect(actualResult.isErr()).toBe(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should return with InvalidOtpError when verification has been attempted too many times', async () => {
      // Arrange
      // Add a Token document to verify against.
      await AuthService.createLoginOtp(VALID_EMAIL)
      // Update Token to already have MAX_OTP_ATTEMPTS.
      await TokenModel.findOneAndUpdate(
        { email: VALID_EMAIL },
        { $inc: { numOtpAttempts: AuthService.MAX_OTP_ATTEMPTS } },
      )

      // Act
      const actualResult = await AuthService.verifyLoginOtp(
        MOCK_OTP,
        VALID_EMAIL,
      )

      // Assert
      const expectedError = new InvalidOtpError(
        'You have hit the max number of attempts. Please request for a new OTP.',
      )
      expect(actualResult.isErr()).toBe(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should return with InvalidOtpError when the OTP hash does not match', async () => {
      // Arrange
      // Add a Token document to verify against.
      await AuthService.createLoginOtp(VALID_EMAIL)
      const invalidOtp = '654321'

      // Act
      const actualResult = await AuthService.verifyLoginOtp(
        invalidOtp,
        VALID_EMAIL,
      )

      // Assert
      const expectedError = new InvalidOtpError(
        'OTP is invalid. Please try again.',
      )
      expect(actualResult.isErr()).toBe(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
    })
  })
})
