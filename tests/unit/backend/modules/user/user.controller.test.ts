import HttpStatus from 'http-status-codes'

import SmsFactory from 'src/app/factories/sms.factory'
import * as UserController from 'src/app/modules/user/user.controller'
import { InvalidOtpError } from 'src/app/modules/user/user.errors'
import * as UserService from 'src/app/modules/user/user.service'
import { IUserSchema } from 'src/types'

import expressHandler from '../../helpers/jest-express'

describe('user.controller', () => {
  describe('handleContactSendOtp', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      body: {
        contact: 'abc',
        userId: 'any',
      },
    })
    it('should return 200 when successful', async () => {
      const mockRes = expressHandler.mockResponse()

      // Mock UserService and SmsFactory to pass without errors.
      jest
        .spyOn(UserService, 'createContactOtp')
        .mockResolvedValueOnce('123456')
      jest.spyOn(SmsFactory, 'sendAdminContactOtp').mockResolvedValueOnce(true)

      // Act
      await UserController.handleContactSendOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.sendStatus).toBeCalledWith(HttpStatus.OK)
    })

    it('should return 400 when sending of OTP fails', async () => {
      const mockRes = expressHandler.mockResponse()
      const expectedError = new Error('mock error')

      // Mock UserService to pass without errors.
      jest
        .spyOn(UserService, 'createContactOtp')
        .mockResolvedValueOnce('123456')
      // Mock SmsFactory to throw error.
      jest
        .spyOn(SmsFactory, 'sendAdminContactOtp')
        .mockRejectedValueOnce(expectedError)

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
      jest
        .spyOn(UserService, 'createContactOtp')
        .mockRejectedValueOnce(expectedError)

      // Act
      await UserController.handleContactSendOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(HttpStatus.BAD_REQUEST)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
    })
  })

  describe('handleContactVerifyOtp', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      body: {
        contact: 'abc',
        userId: 'any',
        otp: '123456',
      },
    })
    it('should return 200 when successful', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()

      // Mock all UserService calls to pass.
      jest.spyOn(UserService, 'verifyContactOtp').mockResolvedValueOnce(true)
      jest
        .spyOn(UserService, 'updateUserContact')
        .mockResolvedValueOnce({} as IUserSchema)

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.sendStatus).toBeCalledWith(HttpStatus.OK)
    })

    it('should return 500 when updating user contact fails', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const expectedError = new Error('mock update error')

      // Mock verify to pass.
      jest.spyOn(UserService, 'verifyContactOtp').mockResolvedValueOnce(true)
      // Mock update to fail.
      jest
        .spyOn(UserService, 'updateUserContact')
        .mockRejectedValueOnce(expectedError)

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
      jest
        .spyOn(UserService, 'verifyContactOtp')
        .mockRejectedValueOnce(expectedError)

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
      jest
        .spyOn(UserService, 'verifyContactOtp')
        .mockRejectedValueOnce(expectedError)

      // Act
      await UserController.handleContactVerifyOtp(MOCK_REQ, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toBeCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockRes.send).toBeCalledWith(expectedError.message)
    })
  })
})
