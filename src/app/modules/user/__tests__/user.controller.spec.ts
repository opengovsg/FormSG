import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import SmsFactory from 'src/app/factories/sms.factory'
import * as UserController from 'src/app/modules/user/user.controller'
import {
  InvalidOtpError,
  MissingUserError,
} from 'src/app/modules/user/user.errors'
import * as UserService from 'src/app/modules/user/user.service'
import { SmsSendError } from 'src/app/services/sms.service'
import { IPopulatedUser, IUser, IUserSchema } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { ApplicationError, DatabaseError } from '../../core/core.errors'

jest.mock('src/app/modules/user/user.service')
jest.mock('src/app/factories/sms.factory')
const MockUserService = mocked(UserService)
const MockSmsFactory = mocked(SmsFactory)

describe('user.controller', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const VALID_SESSION_USER_ID = 'mockSessionUserId'
  const INVALID_SESSION_USER = 'invalidSessionUser'

  describe('handleContactSendOtp', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      body: {
        contact: 'abc',
        userId: VALID_SESSION_USER_ID,
      },
      session: {
        user: {
          _id: VALID_SESSION_USER_ID,
        },
      },
    })

    it('should return 200 when successful', async () => {
      const mockRes = expressHandler.mockResponse()
      const expectedOtp = '123456'

      // Mock UserService and SmsFactory to pass without errors.
      MockUserService.createContactOtp.mockReturnValueOnce(okAsync(expectedOtp))
      MockSmsFactory.sendAdminContactOtp.mockReturnValueOnce(okAsync(true))

      // Act
      await UserController.handleContactSendOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      // Check passed in params.
      expect(MockUserService.createContactOtp).toBeCalledWith(
        MOCK_REQ.body.userId,
        MOCK_REQ.body.contact,
      )
      expect(MockSmsFactory.sendAdminContactOtp).toBeCalledWith(
        MOCK_REQ.body.contact,
        expectedOtp,
        MOCK_REQ.body.userId,
      )
      expect(mockRes.sendStatus).toBeCalledWith(200)
    })

    it('should return 401 when user id is not in session', async () => {
      // Arrange
      const reqWithoutSession = expressHandler.mockRequest({
        body: {
          contact: 'abc',
          userId: VALID_SESSION_USER_ID,
        },
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await UserController.handleContactSendOtp(
        reqWithoutSession,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Should trigger unauthorized response.
      expect(mockRes.status).toBeCalledWith(401)
      expect(mockRes.send).toBeCalledWith('User is unauthorized.')
      // Service functions should not be called.
      expect(MockUserService.verifyContactOtp).not.toHaveBeenCalled()
      expect(MockUserService.updateUserContact).not.toHaveBeenCalled()
    })

    it('should return 401 when user id does not match param', async () => {
      const reqWithDiffUserParam = expressHandler.mockRequest({
        body: {
          contact: 'abc',
          userId: INVALID_SESSION_USER,
        },
        session: {
          user: {
            _id: VALID_SESSION_USER_ID,
          },
        },
      })

      const mockRes = expressHandler.mockResponse()

      // Act
      await UserController.handleContactSendOtp(
        reqWithDiffUserParam,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Should trigger unauthorized response.
      expect(mockRes.status).toBeCalledWith(401)
      expect(mockRes.send).toBeCalledWith('User is unauthorized.')
      // Service functions should not be called.
      expect(MockUserService.verifyContactOtp).not.toHaveBeenCalled()
      expect(MockUserService.updateUserContact).not.toHaveBeenCalled()
    })

    it('should return 422 when sending of OTP fails', async () => {
      const mockRes = expressHandler.mockResponse()
      const expectedError = new SmsSendError()

      // Mock UserService to pass without errors.
      MockUserService.createContactOtp.mockReturnValueOnce(okAsync('123456'))
      // Mock SmsFactory to return error.
      MockSmsFactory.sendAdminContactOtp.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await UserController.handleContactSendOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(422)
      expect(mockRes.send).toBeCalledWith(
        'Failed to send emergency contact verification SMS',
      )
      // Service functions should not be called.
      expect(MockUserService.verifyContactOtp).not.toHaveBeenCalled()
      expect(MockUserService.updateUserContact).not.toHaveBeenCalled()
    })

    it('should return 500 when creating of OTP fails', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new DatabaseError('mock error')

      // Mock UserService to return error.
      MockUserService.createContactOtp.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await UserController.handleContactSendOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
      // Service functions should not be called.
      expect(MockUserService.verifyContactOtp).not.toHaveBeenCalled()
      expect(MockUserService.updateUserContact).not.toHaveBeenCalled()
    })
  })

  describe('handleContactVerifyOtp', () => {
    const MOCK_UPDATED_USER: IUser = {
      agency: 'mockAgency',
      email: 'mockEmail',
      _id: VALID_SESSION_USER_ID,
    }

    const MOCK_REQ = expressHandler.mockRequest({
      body: {
        contact: 'abc',
        userId: VALID_SESSION_USER_ID,
        otp: '123456',
      },
      session: {
        user: {
          _id: VALID_SESSION_USER_ID,
        },
      },
    })

    it('should return 200 with updated user when successful', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      // Mock all UserService calls to pass.
      MockUserService.verifyContactOtp.mockReturnValueOnce(okAsync(true))
      MockUserService.updateUserContact.mockReturnValueOnce(
        okAsync(MOCK_UPDATED_USER as IUserSchema),
      )

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      // Expect services to be called with correct arguments.
      expect(MockUserService.verifyContactOtp).toBeCalledWith(
        MOCK_REQ.body.otp,
        MOCK_REQ.body.contact,
        MOCK_REQ.body.userId,
      )
      expect(MockUserService.updateUserContact).toBeCalledWith(
        MOCK_REQ.body.contact,
        MOCK_REQ.body.userId,
      )
      expect(mockRes.status).toBeCalledWith(200)
      expect(mockRes.send).toBeCalledWith(MOCK_UPDATED_USER)
    })

    it('should return 401 when user id is not in session', async () => {
      // Arrange
      const reqWithoutSession = expressHandler.mockRequest({
        body: {
          contact: 'abc',
          userId: VALID_SESSION_USER_ID,
          otp: '123456',
        },
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await UserController.handleContactVerifyOtp(
        reqWithoutSession,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Should trigger unauthorized response.
      expect(mockRes.status).toBeCalledWith(401)
      expect(mockRes.send).toBeCalledWith('User is unauthorized.')
      // Service functions should not be called.
      expect(MockUserService.verifyContactOtp).not.toHaveBeenCalled()
      expect(MockUserService.updateUserContact).not.toHaveBeenCalled()
    })

    it('should return 401 when user id does not match param', async () => {
      const reqWithDiffUserParam = expressHandler.mockRequest({
        body: {
          contact: 'abc',
          userId: INVALID_SESSION_USER,
          otp: '123456',
        },
        session: {
          user: {
            _id: VALID_SESSION_USER_ID,
          },
        },
      })

      const mockRes = expressHandler.mockResponse()

      // Act
      await UserController.handleContactVerifyOtp(
        reqWithDiffUserParam,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Should trigger unauthorized response.
      expect(mockRes.status).toBeCalledWith(401)
      expect(mockRes.send).toBeCalledWith('User is unauthorized.')
      // Service functions should not be called.
      expect(MockUserService.verifyContactOtp).not.toHaveBeenCalled()
      expect(MockUserService.updateUserContact).not.toHaveBeenCalled()
    })

    it('should return 500 when updating user contact fails due to a database error', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new DatabaseError('mock update error')

      // Mock verify to pass.
      MockUserService.verifyContactOtp.mockReturnValueOnce(okAsync(true))
      // Mock update to fail.
      MockUserService.updateUserContact.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
      expect(MockUserService.verifyContactOtp).toHaveBeenCalledTimes(1)
      expect(MockUserService.updateUserContact).toHaveBeenCalledTimes(1)
    })

    it('should return 401 when verifying contact returns InvalidOtpError', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new InvalidOtpError('mock error')

      // Mock UserService to return error.
      MockUserService.verifyContactOtp.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(401)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
      expect(MockUserService.verifyContactOtp).toHaveBeenCalledTimes(1)
      expect(MockUserService.updateUserContact).not.toHaveBeenCalled()
    })

    it('should return 422 when verifying contact returns MissingUserError', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new MissingUserError('mock missing user error')

      // Mock UserService to return error.
      MockUserService.verifyContactOtp.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(422)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
      expect(MockUserService.verifyContactOtp).toHaveBeenCalledTimes(1)
      expect(MockUserService.updateUserContact).not.toHaveBeenCalled()
    })

    it('should return 500 when verifying contact returns ApplicationError', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new ApplicationError('mock missing user error')

      // Mock UserService to return error.
      MockUserService.verifyContactOtp.mockReturnValueOnce(
        errAsync(expectedError),
      )

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
      expect(MockUserService.verifyContactOtp).toHaveBeenCalledTimes(1)
      expect(MockUserService.updateUserContact).not.toHaveBeenCalled()
    })
  })

  describe('handleFetchUser', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      body: {},
      session: {
        user: {
          _id: VALID_SESSION_USER_ID,
        },
      },
    })
    it('should fetch user in session successfully', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      const mockPopulatedUser = {
        agency: {},
        email: 'mockEmail',
        _id: VALID_SESSION_USER_ID,
      }

      // Mock resolved value.
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        okAsync(mockPopulatedUser as IPopulatedUser),
      )

      // Act
      await UserController.handleFetchUser(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.send).toBeCalledWith(mockPopulatedUser)
    })

    it('should return 401 when user id is not in session', async () => {
      // Arrange
      const reqWithoutSession = expressHandler.mockRequest({
        body: {},
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await UserController.handleFetchUser(
        reqWithoutSession,
        mockRes,
        jest.fn(),
      )

      // Assert
      // Should trigger unauthorized response.
      expect(mockRes.status).toBeCalledWith(401)
      expect(mockRes.send).toBeCalledWith('User is unauthorized.')
    })

    it('should return 422 when MissingUserError is returned when retrieving user', async () => {
      // Arrange
      // Mock resolve to null.
      MockUserService.getPopulatedUserById.mockReturnValueOnce(
        errAsync(new MissingUserError()),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await UserController.handleFetchUser(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(422)
      expect(mockRes.send).toBeCalledWith('User not found')
    })
  })
})
