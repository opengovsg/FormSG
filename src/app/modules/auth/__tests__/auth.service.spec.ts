import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync } from 'neverthrow'

import getTokenModel from 'src/app/models/token.server.model'
import { AgencyDocument, IPopulatedForm, IPopulatedUser } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import * as OtpUtils from '../../../utils/otp'
import { DatabaseError } from '../../core/core.errors'
import { PermissionLevel } from '../../form/admin-form/admin-form.types'
import * as AdminFormUtils from '../../form/admin-form/admin-form.utils'
import {
  ForbiddenFormError,
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import { InvalidDomainError, InvalidOtpError } from '../auth.errors'
import * as AuthService from '../auth.service'

jest.mock('../../form/form.service')
const MockFormService = jest.mocked(FormService)
jest.mock('../../form/admin-form/admin-form.utils')
const MockAdminFormUtils = jest.mocked(AdminFormUtils)

const TokenModel = getTokenModel(mongoose)

const VALID_EMAIL_DOMAIN = 'test.gov.sg'
const VALID_EMAIL = `valid@${VALID_EMAIL_DOMAIN}`
const MOCK_OTP = '123456'

describe('auth.service', () => {
  let defaultAgency: AgencyDocument

  beforeAll(async () => {
    await dbHandler.connect()
    defaultAgency = await dbHandler.insertAgency({
      mailDomain: VALID_EMAIL_DOMAIN,
    })
  })

  // Only need to clear Token collection, and ignore other collections.
  beforeEach(async () => {
    await dbHandler.clearCollection(TokenModel.collection.collectionName)
    jest.clearAllMocks()
  })

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
      jest.spyOn(OtpUtils, 'generateOtp').mockReturnValueOnce(MOCK_OTP)

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
      jest.spyOn(OtpUtils, 'generateOtp').mockReturnValueOnce(MOCK_OTP)
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

  describe('getFormAfterPermissionChecks', () => {
    const MOCK_USER = {
      _id: new ObjectId(),
    } as IPopulatedUser
    it('should return form when user has permissions', async () => {
      // Arrange
      const mockFormId = new ObjectId().toHexString()
      const expectedForm = {
        title: 'mock form',
        _id: mockFormId,
      } as IPopulatedForm
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(expectedForm),
      )
      MockAdminFormUtils.assertFormAvailable.mockReturnValueOnce(ok(true))
      MockAdminFormUtils.getAssertPermissionFn.mockReturnValueOnce(() =>
        ok(true),
      )

      // Act
      const actualResult = await AuthService.getFormAfterPermissionChecks({
        user: MOCK_USER,
        formId: mockFormId,
        level: PermissionLevel.Write,
      })

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
      expect(MockAdminFormUtils.getAssertPermissionFn).toHaveBeenCalledWith(
        PermissionLevel.Write,
      )
    })

    it('should return FormNotFoundError when form does not exist in the database', async () => {
      // Arrange
      const expectedError = new FormNotFoundError('not found')
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      const actualResult = await AuthService.getFormAfterPermissionChecks({
        user: MOCK_USER,
        formId: new ObjectId().toHexString(),
        level: PermissionLevel.Read,
      })

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should return FormDeletedError when form is already archived', async () => {
      // Arrange
      const mockFormId = new ObjectId().toHexString()
      const expectedError = new FormDeletedError('form deleted')
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync({} as IPopulatedForm),
      )
      MockAdminFormUtils.assertFormAvailable.mockReturnValueOnce(
        err(expectedError),
      )
      // Act
      const actualResult = await AuthService.getFormAfterPermissionChecks({
        user: MOCK_USER,
        formId: mockFormId,
        level: PermissionLevel.Delete,
      })

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should return ForbiddenFormError when user does not have permission', async () => {
      // Arrange
      const mockFormId = new ObjectId().toHexString()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync({} as IPopulatedForm),
      )
      const expectedError = new ForbiddenFormError('user not allowed')
      MockAdminFormUtils.assertFormAvailable.mockReturnValueOnce(ok(true))
      MockAdminFormUtils.getAssertPermissionFn.mockReturnValueOnce(() =>
        err(expectedError),
      )

      // Act
      const actualResult = await AuthService.getFormAfterPermissionChecks({
        user: MOCK_USER,
        formId: mockFormId,
        level: PermissionLevel.Write,
      })

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
      expect(MockAdminFormUtils.getAssertPermissionFn).toHaveBeenCalledWith(
        PermissionLevel.Write,
      )
    })

    it('should return DatabaseError when error occurs whilst retrieving form', async () => {
      // Arrange
      const mockFormId = new ObjectId().toHexString()
      const expectedError = new DatabaseError('db boom')
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync({} as IPopulatedForm),
      )
      MockAdminFormUtils.assertFormAvailable.mockReturnValueOnce(
        err(expectedError),
      )
      // Act
      const actualResult = await AuthService.getFormAfterPermissionChecks({
        user: MOCK_USER,
        formId: mockFormId,
        level: PermissionLevel.Delete,
      })

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
    })
  })

  describe('getFormIfPublic', () => {
    it('should return populated form when form to retrieve is public', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const expectedForm = {
        _id: mockFormId,
        title: 'some form',
      } as IPopulatedForm

      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(expectedForm),
      )
      MockFormService.isFormPublic.mockReturnValueOnce(ok(true))

      // Act
      const actualResult = await AuthService.getFormIfPublic(
        mockFormId.toHexString(),
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
    })

    it('should return FormNotFoundError when returned form is not found', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const expectedError = new FormNotFoundError('no form')
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      const actualResult = await AuthService.getFormIfPublic(
        mockFormId.toHexString(),
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
      expect(MockFormService.isFormPublic).not.toHaveBeenCalled()
    })

    it('should return FormDeletedError when form is already archived', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const expectedForm = {
        _id: mockFormId,
        title: 'some form',
      } as IPopulatedForm
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(expectedForm),
      )
      const expectedError = new FormDeletedError('gone')
      MockFormService.isFormPublic.mockReturnValueOnce(err(expectedError))

      // Act
      const actualResult = await AuthService.getFormIfPublic(
        mockFormId.toHexString(),
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
      expect(MockFormService.isFormPublic).toHaveBeenCalledWith(expectedForm)
    })

    it('should return PrivateFormError when form is private', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const expectedForm = {
        _id: mockFormId,
        title: 'some form',
      } as IPopulatedForm
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(expectedForm),
      )
      const expectedError = new PrivateFormError(
        'you have no access',
        expectedForm.title,
      )
      MockFormService.isFormPublic.mockReturnValueOnce(err(expectedError))

      // Act
      const actualResult = await AuthService.getFormIfPublic(
        mockFormId.toHexString(),
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
      expect(MockFormService.isFormPublic).toHaveBeenCalledWith(expectedForm)
    })

    it('should return DatabaseError when database error occurs when retrieving form', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const expectedError = new DatabaseError('bam goes the database')
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      const actualResult = await AuthService.getFormIfPublic(
        mockFormId.toHexString(),
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
      expect(MockFormService.isFormPublic).not.toHaveBeenCalled()
    })
  })
})
