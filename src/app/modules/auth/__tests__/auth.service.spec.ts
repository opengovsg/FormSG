import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { ImportMock } from 'ts-mock-imports'

import getTokenModel from 'src/app/models/token.server.model'
import * as OtpUtils from 'src/app/utils/otp'
import { IAgencySchema } from 'src/types'

import { InvalidDomainError } from '../auth.errors'
import * as AuthService from '../auth.service'

const TokenModel = getTokenModel(mongoose)

const VALID_EMAIL_DOMAIN = 'test.gov.sg'
const VALID_EMAIL = `valid@${VALID_EMAIL_DOMAIN}`

describe('auth.service', () => {
  let defaultAgency: IAgencySchema

  beforeAll(async () => {
    await dbHandler.connect()
    defaultAgency = await dbHandler.insertDefaultAgency({
      mailDomain: VALID_EMAIL_DOMAIN,
    })
  })

  // Only need to clear Token collection, and ignore agency
  beforeEach(
    async () =>
      await dbHandler.clearCollection(TokenModel.collection.collectionName),
  )

  afterAll(async () => await dbHandler.closeDatabase())

  describe('getAgencyWithEmail', () => {
    it('should retrieve agency successfully when email is valid and domain is in Agency collection', async () => {
      // Act
      const actual = await AuthService.getAgencyWithEmail(VALID_EMAIL)

      // Assert
      expect(actual.toObject()).toEqual(defaultAgency.toObject())
    })

    it('should throw InvalidDomainError when email is invalid', async () => {
      // Arrange
      const notAnEmail = 'not an email'

      // Act
      const actualPromise = AuthService.getAgencyWithEmail(notAnEmail)

      // Assert
      await expect(actualPromise).rejects.toThrowError(InvalidDomainError)
    })

    it('should throw InvalidDomainError when valid email domain is not in Agency collection', async () => {
      // Arrange
      const invalidEmail = 'invalid@example.com'

      // Act
      const actualPromise = AuthService.getAgencyWithEmail(invalidEmail)

      // Assert
      await expect(actualPromise).rejects.toThrowError(InvalidDomainError)
    })
  })

  describe('createLoginOtp', () => {
    it('should create login otp successfully when email is valid', async () => {
      // Arrange
      const expectedOtp = '123456'
      // All calls to generateOtp will return MOCK_OTP.
      ImportMock.mockFunction(OtpUtils, 'generateOtp', expectedOtp)
      // Should have no documents prior to this.
      await expect(TokenModel.countDocuments()).resolves.toEqual(0)

      // Act
      const actualOtp = await AuthService.createLoginOtp(VALID_EMAIL)

      // Assert
      expect(actualOtp).toEqual(expectedOtp)
      // Should have new token document inserted.
      await expect(TokenModel.countDocuments()).resolves.toEqual(1)
    })

    it('should throw InvalidDomainError when email is invalid', async () => {
      // Arrange
      const notAnEmail = 'not an email'

      // Act
      const actualPromise = AuthService.createLoginOtp(notAnEmail)

      // Assert
      await expect(actualPromise).rejects.toThrowError(InvalidDomainError)
    })
  })
})
