import { PresignedPost } from 'aws-sdk/clients/s3'
import { ObjectId } from 'bson-ext'
import { merge } from 'lodash'
import { err, errAsync, ok, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import * as SubmissionService from 'src/app/modules/submission/submission.service'
import { MissingUserError } from 'src/app/modules/user/user.errors'
import { IPopulatedForm, IPopulatedUser } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import * as UserService from '../../../user/user.service'
import {
  ForbiddenFormError,
  FormDeletedError,
  FormNotFoundError,
} from '../../form.errors'
import * as FormService from '../../form.service'
import * as AdminFormController from '../admin-form.controller'
import {
  CreatePresignedUrlError,
  InvalidFileTypeError,
} from '../admin-form.errors'
import * as AdminFormService from '../admin-form.service'
import * as AdminFormUtils from '../admin-form.utils'

jest.mock('src/app/modules/submission/submission.service')
const MockSubmissionService = mocked(SubmissionService)
jest.mock('../admin-form.service')
const MockAdminFormService = mocked(AdminFormService)
jest.mock('../../../user/user.service')
const MockUserService = mocked(UserService)
jest.mock('../../form.service')
const MockFormService = mocked(FormService)

describe('admin-form.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('handleListDashboardForms', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      session: {
        user: {
          _id: 'exists',
        },
      },
    })
    it('should return 200 with list of forms', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock return array.
      MockAdminFormService.getDashboardForms.mockReturnValueOnce(okAsync([]))

      // Act
      await AdminFormController.handleListDashboardForms(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith([])
    })

    it('should return 422 on MissingUserError', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockAdminFormService.getDashboardForms.mockReturnValueOnce(
        errAsync(new MissingUserError()),
      )

      // Act
      await AdminFormController.handleListDashboardForms(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(422)
      expect(mockRes.json).toBeCalledWith({ message: 'User not found' })
    })

    it('should return 500 when database error occurs', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'
      MockAdminFormService.getDashboardForms.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )

      // Act
      await AdminFormController.handleListDashboardForms(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })
  })

  describe('handleCreatePresignedPostForImages', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      body: {
        fileId: 'any file id',
        fileMd5Hash: 'any hash',
        fileType: 'any type',
      },
    })

    it('should return 200 with presigned POST object when successful', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedPresignedPost: PresignedPost = {
        fields: {
          'X-Amz-Signature': 'some-amz-signature',
          Policy: 'some policy',
        },
        url: 'some url',
      }
      MockAdminFormService.createPresignedPostForImages.mockReturnValueOnce(
        okAsync(expectedPresignedPost),
      )

      // Act
      await AdminFormController.handleCreatePresignedPostForImages(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(expectedPresignedPost)
    })

    it('should return 400 when InvalidFileTypeError is returned when creating presigned POST', async () => {
      // Arrange
      // Mock error
      const mockErrorString = 'bad file type, bad!'
      const mockRes = expressHandler.mockResponse()
      MockAdminFormService.createPresignedPostForImages.mockReturnValueOnce(
        errAsync(new InvalidFileTypeError(mockErrorString)),
      )

      // Act
      await AdminFormController.handleCreatePresignedPostForImages(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
    })

    it('should return 400 when CreatePresignedUrlError is returned when creating presigned POST', async () => {
      // Arrange
      // Mock error
      const mockErrorString = 'creating presigned post failed, oh no'
      const mockRes = expressHandler.mockResponse()
      MockAdminFormService.createPresignedPostForImages.mockReturnValueOnce(
        errAsync(new CreatePresignedUrlError(mockErrorString)),
      )

      // Act
      await AdminFormController.handleCreatePresignedPostForImages(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
    })
  })

  describe('handleCreatePresignedPostForLogos', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      body: {
        fileId: 'any file id',
        fileMd5Hash: 'any hash',
        fileType: 'any type',
      },
    })

    it('should return 200 with presigned POST object when successful', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedPresignedPost: PresignedPost = {
        fields: {
          'X-Amz-Signature': 'some-amz-signature',
          Policy: 'some policy',
        },
        url: 'some url',
      }
      MockAdminFormService.createPresignedPostForLogos.mockReturnValueOnce(
        okAsync(expectedPresignedPost),
      )

      // Act
      await AdminFormController.handleCreatePresignedPostForLogos(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(expectedPresignedPost)
    })

    it('should return 400 when InvalidFileTypeError is returned when creating presigned POST', async () => {
      // Arrange
      // Mock error
      const mockErrorString = 'bad file type, bad!'
      const mockRes = expressHandler.mockResponse()
      MockAdminFormService.createPresignedPostForLogos.mockReturnValueOnce(
        errAsync(new InvalidFileTypeError(mockErrorString)),
      )

      // Act
      await AdminFormController.handleCreatePresignedPostForLogos(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
    })

    it('should return 400 when CreatePresignedUrlError is returned when creating presigned POST', async () => {
      // Arrange
      // Mock error
      const mockErrorString = 'creating presigned post failed, oh no'
      const mockRes = expressHandler.mockResponse()
      MockAdminFormService.createPresignedPostForLogos.mockReturnValueOnce(
        errAsync(new CreatePresignedUrlError(mockErrorString)),
      )

      // Act
      await AdminFormController.handleCreatePresignedPostForLogos(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockErrorString,
      })
    })
  })
  describe('handleCountFormSubmissions', () => {
    const MOCK_USER_ID = new ObjectId()
    const MOCK_FORM_ID = new ObjectId()
    const MOCK_USER: Partial<IPopulatedUser> = {
      _id: MOCK_USER_ID,
      email: 'somerandom@example.com',
    }
    const MOCK_FORM: Partial<IPopulatedForm> = {
      admin: MOCK_USER as IPopulatedUser,
      _id: MOCK_FORM_ID,
      title: 'mock title',
    }

    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        formId: MOCK_FORM_ID.toHexString(),
      },
      session: {
        user: {
          _id: MOCK_USER_ID,
        },
      },
    })

    it('should return 200 with submission counts of given form when query params are not provided', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock return count.
      const expectedSubmissionCount = 201
      // Mock various services to return expected results.
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER as IPopulatedUser),
      )
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM as IPopulatedForm),
      )
      const readPermsSpy = jest
        .spyOn(AdminFormUtils, 'assertHasReadPermissions')
        .mockReturnValueOnce(ok(true))
      MockSubmissionService.getFormSubmissionsCount.mockReturnValueOnce(
        okAsync(expectedSubmissionCount),
      )

      // Act
      await AdminFormController.handleCountFormSubmissions(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check all arguments of called services.
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID.toHexString(),
      )
      expect(readPermsSpy).toHaveBeenCalledWith(MOCK_USER, MOCK_FORM)
      expect(
        MockSubmissionService.getFormSubmissionsCount,
      ).toHaveBeenCalledWith(String(MOCK_FORM._id), {
        startDate: undefined,
        endDate: undefined,
      })
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith(expectedSubmissionCount)
    })

    it('should return 200 with submission counts of given form when query params are provided', async () => {
      // Arrange
      const expectedDateRange = {
        startDate: '2020-01-01',
        endDate: '2021-01-01',
      }

      const mockReqWithQuery = merge({}, MOCK_REQ, { query: expectedDateRange })
      const mockRes = expressHandler.mockResponse()
      // Mock return count.
      const expectedSubmissionCount = 12
      // Mock various services to return expected results.
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER as IPopulatedUser),
      )
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM as IPopulatedForm),
      )
      const readPermsSpy = jest
        .spyOn(AdminFormUtils, 'assertHasReadPermissions')
        .mockReturnValueOnce(ok(true))
      MockSubmissionService.getFormSubmissionsCount.mockReturnValueOnce(
        okAsync(expectedSubmissionCount),
      )

      // Act
      await AdminFormController.handleCountFormSubmissions(
        mockReqWithQuery,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check all arguments of called services.
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID.toHexString(),
      )
      expect(readPermsSpy).toHaveBeenCalledWith(MOCK_USER, MOCK_FORM)
      expect(
        MockSubmissionService.getFormSubmissionsCount,
      ).toHaveBeenCalledWith(String(MOCK_FORM._id), expectedDateRange)
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith(expectedSubmissionCount)
    })

    it('should return 403 when ForbiddenFormError is returned when verifying user permissions', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock various services to return expected results.
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER as IPopulatedUser),
      )
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM as IPopulatedForm),
      )
      // Mock error here.
      const expectedErrorString = 'no read access'
      const readPermsSpy = jest
        .spyOn(AdminFormUtils, 'assertHasReadPermissions')
        .mockReturnValueOnce(err(new ForbiddenFormError(expectedErrorString)))

      // Act
      await AdminFormController.handleCountFormSubmissions(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check all arguments of called services.
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID.toHexString(),
      )
      expect(readPermsSpy).toHaveBeenCalledWith(MOCK_USER, MOCK_FORM)
      expect(
        MockSubmissionService.getFormSubmissionsCount,
      ).not.toHaveBeenCalledWith()
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedErrorString,
      })
    })

    it('should return 404 when FormNotFoundError is returned when retrieving form', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock various services to return expected results.
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER as IPopulatedUser),
      )
      // Mock error when retrieving form.
      const expectedErrorString = 'form is not found'
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(new FormNotFoundError(expectedErrorString)),
      )

      // Act
      await AdminFormController.handleCountFormSubmissions(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check all arguments of called services.
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID.toHexString(),
      )
      expect(
        MockSubmissionService.getFormSubmissionsCount,
      ).not.toHaveBeenCalledWith()
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedErrorString,
      })
    })

    it('should return 410 when FormDeletedError is returned when retrieving form', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock various services to return expected results.
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER as IPopulatedUser),
      )
      // Mock error when retrieving form.
      const expectedErrorString = 'form is deleted'
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(new FormDeletedError(expectedErrorString)),
      )

      // Act
      await AdminFormController.handleCountFormSubmissions(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check all arguments of called services.
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID.toHexString(),
      )
      expect(
        MockSubmissionService.getFormSubmissionsCount,
      ).not.toHaveBeenCalledWith()
      expect(mockRes.status).toHaveBeenCalledWith(410)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedErrorString,
      })
    })

    it('should return 422 when MissingUserError is returned when retrieving logged in user', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock various services to return expected results.
      const expectedErrorString = 'user is not found'
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        errAsync(new MissingUserError(expectedErrorString)),
      )

      // Act
      await AdminFormController.handleCountFormSubmissions(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check all arguments of called services.
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockFormService.retrieveFullFormById).not.toHaveBeenCalled()
      expect(
        MockSubmissionService.getFormSubmissionsCount,
      ).not.toHaveBeenCalledWith()
      expect(mockRes.status).toHaveBeenCalledWith(422)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedErrorString,
      })
    })

    it('should return 500 when database error occurs whilst retrieving user in session', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock various services to return expected results.
      const expectedErrorString = 'database goes boom'
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        errAsync(new DatabaseError(expectedErrorString)),
      )

      // Act
      await AdminFormController.handleCountFormSubmissions(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check all arguments of called services.
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockFormService.retrieveFullFormById).not.toHaveBeenCalled()
      expect(
        MockSubmissionService.getFormSubmissionsCount,
      ).not.toHaveBeenCalledWith()
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedErrorString,
      })
    })

    it('should return 500 when database error occurs whilst retrieving populated form', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock various services to return expected results.
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER as IPopulatedUser),
      )
      // Mock error when retrieving form.
      const expectedErrorString = 'database goes boom'
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(new DatabaseError(expectedErrorString)),
      )

      // Act
      await AdminFormController.handleCountFormSubmissions(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check all arguments of called services.
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID.toHexString(),
      )
      expect(
        MockSubmissionService.getFormSubmissionsCount,
      ).not.toHaveBeenCalledWith()
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedErrorString,
      })
    })

    it('should return 500 when database error occurs whilst retrieving form submission count', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock various services to return expected results.
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(MOCK_USER as IPopulatedUser),
      )
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM as IPopulatedForm),
      )
      const readPermsSpy = jest
        .spyOn(AdminFormUtils, 'assertHasReadPermissions')
        .mockReturnValueOnce(ok(true))
      const expectedErrorString = 'database goes boom'
      MockSubmissionService.getFormSubmissionsCount.mockReturnValueOnce(
        errAsync(new DatabaseError(expectedErrorString)),
      )

      // Act
      await AdminFormController.handleCountFormSubmissions(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Check all arguments of called services.
      expect(MockUserService.getPopulatedUserById).toHaveBeenCalledWith(
        MOCK_USER_ID,
      )
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID.toHexString(),
      )
      expect(readPermsSpy).toHaveBeenCalledWith(MOCK_USER, MOCK_FORM)
      expect(
        MockSubmissionService.getFormSubmissionsCount,
      ).toHaveBeenCalledWith(String(MOCK_FORM._id), {
        startDate: undefined,
        endDate: undefined,
      })
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expectedErrorString,
      })
    })
  })
})
