import { ObjectId } from 'bson-ext'
import { StatusCodes } from 'http-status-codes'
import { errAsync, okAsync } from 'neverthrow'
import { PassThrough } from 'stream'

import dbHandler from '../../../../../../__tests__/unit/backend/helpers/jest-db'
import expressHandler from '../../../../../../__tests__/unit/backend/helpers/jest-express'
import { FormIssueMetaDto } from '../../../../../../shared/types'
import { IPopulatedForm, IPopulatedUser } from '../../../../../types'
import * as AuthService from '../../../auth/auth.service'
import { DatabaseError } from '../../../core/core.errors'
import * as IssueService from '../../../issue/issue.service'
import { MissingUserError } from '../../../user/user.errors'
import * as UserService from '../../../user/user.service'
import { ForbiddenFormError, FormNotFoundError } from '../../form.errors'
import * as AdminFormIssueController from '../admin-form.issue.controller'
import { PermissionLevel } from '../admin-form.types'

jest.mock('../../../user/user.service')
const MockUserService = jest.mocked(UserService)
jest.mock('src/app/modules/auth/auth.service')
const MockAuthService = jest.mocked(AuthService)
jest.mock('src/app/modules/issue/issue.service')
const MockIssueService = jest.mocked(IssueService)

describe('admin-form.issue.controller', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearDatabase()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('handleGetFormIssue', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_USER_ID = new ObjectId()
    const MOCK_USER = {
      _id: MOCK_USER_ID,
      email: 'notarealuser@example.com',
    } as IPopulatedUser
    const MOCK_FORM = {
      admin: MOCK_USER as IPopulatedUser,
      _id: MOCK_FORM_ID,
      title: 'form title',
    } as IPopulatedForm
    const MOCK_REQ = expressHandler.mockRequest({
      params: { formId: MOCK_FORM_ID },
      session: {
        user: {
          _id: MOCK_USER_ID,
        },
      },
    })

    it('should return issues as request is processed successfully', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedFormIssue: FormIssueMetaDto = {
        count: 2,
        issues: [
          {
            issue: 'I dont understand english, how to fill?',
            email: 'email@example.com',
            index: 1,
            timestamp: Date.now(),
          },
          {
            issue: 'this form is too 啰嗦',
            email: 'email@example.com',
            index: 2,
            timestamp: Date.now(),
          },
        ],
      }
      // Mock success on all service invocations.
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER),
      )
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      MockIssueService.getFormIssues.mockReturnValueOnce(
        okAsync(expectedFormIssue),
      )
      // Act
      await AdminFormIssueController.handleGetFormIssue(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(expectedFormIssue)
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(MockIssueService.getFormIssues).toHaveBeenCalledWith(MOCK_FORM_ID)
    })

    it('should return 422 as user is not found (MissingUserError)', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        errAsync(new MissingUserError()),
      )
      // Act
      await AdminFormIssueController.handleGetFormIssue(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' })
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(
        MockAuthService.getFormAfterPermissionChecks,
      ).not.toHaveBeenCalled()
      expect(MockIssueService.getFormIssues).not.toHaveBeenCalled()
    })

    it('should return 404 as form is not found (FormNotFoundError)', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER),
      )
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )
      // Act
      await AdminFormIssueController.handleGetFormIssue(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Form not found' })
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(MockIssueService.getFormIssues).not.toHaveBeenCalled()
    })

    it('should return 500 as failed to retrieve issues (DatabaseError)', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER),
      )
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      MockIssueService.getFormIssues.mockReturnValueOnce(
        errAsync(new DatabaseError('Something is wrong')),
      )
      // Act
      await AdminFormIssueController.handleGetFormIssue(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Something is wrong',
      })
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(MockIssueService.getFormIssues).toHaveBeenCalledWith(MOCK_FORM_ID)
    })
  })

  describe('handleStreamFormIssue', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_USER_ID = new ObjectId()
    const MOCK_USER = {
      _id: MOCK_USER_ID,
      email: 'notarealuser@example.com',
    } as IPopulatedUser
    const MOCK_FORM = {
      admin: MOCK_USER as IPopulatedUser,
      _id: MOCK_FORM_ID,
      title: 'form title',
    } as IPopulatedForm
    const MOCK_REQ = expressHandler.mockRequest({
      params: { formId: MOCK_FORM_ID },
      session: {
        user: {
          _id: MOCK_USER_ID,
        },
      },
    })

    it('should return stream as request is processed successfully', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER),
      )
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      const mockCursor = new PassThrough()
      MockIssueService.getFormIssueStream.mockReturnValueOnce(mockCursor as any)

      // Act
      await AdminFormIssueController.handleStreamFormIssue(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(MockIssueService.getFormIssueStream).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
    })

    it('should return 422 as user is not found (MissingUserError)', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        errAsync(new MissingUserError()),
      )
      // Act
      await AdminFormIssueController.handleStreamFormIssue(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' })
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(
        MockAuthService.getFormAfterPermissionChecks,
      ).not.toHaveBeenCalled()
      expect(MockIssueService.getFormIssueStream).not.toHaveBeenCalled()
    })

    it('should return 403 as form is not accessible (ForbiddenFormError)', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER),
      )
      const expectedError = new ForbiddenFormError('This is a top secret form.')
      MockAuthService.getFormAfterPermissionChecks.mockReturnValueOnce(
        errAsync(expectedError),
      )
      // Act
      await AdminFormIssueController.handleStreamFormIssue(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedError.message,
      })
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockAuthService.getFormAfterPermissionChecks).toHaveBeenCalledWith(
        {
          user: MOCK_USER,
          formId: MOCK_FORM_ID,
          level: PermissionLevel.Read,
        },
      )
      expect(MockIssueService.getFormIssueStream).not.toHaveBeenCalled()
    })
  })
})
