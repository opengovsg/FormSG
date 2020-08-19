import HttpStatus from 'http-status-codes'

import SmsFactory from 'src/app/factories/sms.factory'
import * as UserController from 'src/app/modules/user/user.controller'
import { InvalidOtpError } from 'src/app/modules/user/user.errors'
import * as UserService from 'src/app/modules/user/user.service'
import { IPopulatedUser, IUser, IUserSchema } from 'src/types'

import expressHandler from '../../helpers/jest-express'

describe('user.controller', () => {
  // Spy on services used in controller.
  const VERIFY_CONTACT_SPY = jest.spyOn(UserService, 'verifyContactOtp')
  const UPDATE_CONTACT_SPY = jest.spyOn(UserService, 'updateUserContact')
  const CREATE_CONTACT_SPY = jest.spyOn(UserService, 'createContactOtp')
  const SEND_CONTACT_SPY = jest.spyOn(SmsFactory, 'sendAdminContactOtp')

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

      // Mock UserService and SmsFactory to pass without errors.
      CREATE_CONTACT_SPY.mockResolvedValueOnce('123456')
      SEND_CONTACT_SPY.mockResolvedValueOnce(true)

      // Act
      await UserController.handleContactSendOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.sendStatus).toBeCalledWith(HttpStatus.OK)
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
      expect(mockRes.status).toBeCalledWith(HttpStatus.UNAUTHORIZED)
      expect(mockRes.send).toBeCalledWith('User is unauthorized.')
      // Service functions should not be called.
      expect(VERIFY_CONTACT_SPY).not.toHaveBeenCalled()
      expect(UPDATE_CONTACT_SPY).not.toHaveBeenCalled()
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
      expect(mockRes.status).toBeCalledWith(HttpStatus.UNAUTHORIZED)
      expect(mockRes.send).toBeCalledWith('User is unauthorized.')
      // Service functions should not be called.
      expect(VERIFY_CONTACT_SPY).not.toHaveBeenCalled()
      expect(UPDATE_CONTACT_SPY).not.toHaveBeenCalled()
    })

    it('should return 400 when sending of OTP fails', async () => {
      const mockRes = expressHandler.mockResponse()
      const expectedError = new Error('mock error')

      // Mock UserService to pass without errors.
      CREATE_CONTACT_SPY.mockResolvedValueOnce('123456')
      // Mock SmsFactory to throw error.
      SEND_CONTACT_SPY.mockRejectedValueOnce(expectedError)

      // Act
      await UserController.handleContactSendOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(HttpStatus.BAD_REQUEST)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
    })

    it('should return 400 when creating of OTP fails', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new Error('mock error')

      // Mock UserService to throw error.
      CREATE_CONTACT_SPY.mockRejectedValueOnce(expectedError)

      // Act
      await UserController.handleContactSendOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(HttpStatus.BAD_REQUEST)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
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
      VERIFY_CONTACT_SPY.mockResolvedValueOnce(true)
      UPDATE_CONTACT_SPY.mockResolvedValueOnce(MOCK_UPDATED_USER as IUserSchema)

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(HttpStatus.OK)
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
      expect(mockRes.status).toBeCalledWith(HttpStatus.UNAUTHORIZED)
      expect(mockRes.send).toBeCalledWith('User is unauthorized.')
      // Service functions should not be called.
      expect(VERIFY_CONTACT_SPY).not.toHaveBeenCalled()
      expect(UPDATE_CONTACT_SPY).not.toHaveBeenCalled()
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
      expect(mockRes.status).toBeCalledWith(HttpStatus.UNAUTHORIZED)
      expect(mockRes.send).toBeCalledWith('User is unauthorized.')
      // Service functions should not be called.
      expect(VERIFY_CONTACT_SPY).not.toHaveBeenCalled()
      expect(UPDATE_CONTACT_SPY).not.toHaveBeenCalled()
    })

    it('should return 500 when updating user contact fails', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new Error('mock update error')

      // Mock verify to pass.
      VERIFY_CONTACT_SPY.mockResolvedValueOnce(true)
      // Mock update to fail.
      UPDATE_CONTACT_SPY.mockRejectedValueOnce(expectedError)

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
    })

    it('should return correct status and message when verifying contact throws ApplicationError', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new InvalidOtpError('mock error')

      // Mock UserService to throw error.
      VERIFY_CONTACT_SPY.mockRejectedValueOnce(expectedError)

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(expectedError.status)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
    })

    it('should return 500 when verifying contact throws non-ApplicationError', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Non ApplicationError instantiation.
      const expectedError = new Error('mock error')

      // Mock UserService to throw error.
      VERIFY_CONTACT_SPY.mockRejectedValueOnce(expectedError)

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
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
      jest
        .spyOn(UserService, 'getPopulatedUserById')
        .mockResolvedValueOnce(mockPopulatedUser as IPopulatedUser)

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
      expect(mockRes.status).toBeCalledWith(HttpStatus.UNAUTHORIZED)
      expect(mockRes.send).toBeCalledWith('User is unauthorized.')
    })

    it('should return 500 when retrieved user is null', async () => {
      // Arrange
      // Mock resolve to null.
      jest
        .spyOn(UserService, 'getPopulatedUserById')
        .mockResolvedValueOnce(null)
      const mockRes = expressHandler.mockResponse()

      // Act
      await UserController.handleFetchUser(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockRes.send).toBeCalledWith('Unable to retrieve user')
    })
  })
})
