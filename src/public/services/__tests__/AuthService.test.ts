import axios from 'axios'
import { mocked } from 'ts-jest/utils'
import { Opaque } from 'type-fest'

import {
  AUTH_ENDPOINT,
  checkIsEmailAllowed,
  sendLoginOtp,
  verifyLoginOtp,
} from '../AuthService'
import * as UserService from '../UserService'

jest.mock('axios')
jest.mock('../UserService')

const MockUserService = mocked(UserService)
const MockAxios = mocked(axios, true)

// Duplicated here instead of exporting from AuthService to prevent production
// code from casting to Email type without going through a type guard/validator.
type TestEmail = Opaque<string, 'Email'>

describe('AuthService', () => {
  describe('checkIsEmailAllowed', () => {
    const EXPECTED_POST_ENDPOINT = `${AUTH_ENDPOINT}/email/validate`

    it('should return given email argument when email is allowed', async () => {
      // Arrange
      const mockEmail = 'this.should.RETURN@example.com'
      MockAxios.post.mockResolvedValueOnce({ status: 200 })

      // Act
      const actual = await checkIsEmailAllowed(mockEmail)

      // Assert
      expect(actual).toEqual(mockEmail)
      expect(MockAxios.post).toHaveBeenCalledWith(EXPECTED_POST_ENDPOINT, {
        email: mockEmail.toLowerCase(),
      })
    })
  })

  describe('sendLoginOtp', () => {
    const EXPECTED_POST_ENDPOINT = `${AUTH_ENDPOINT}/otp/generate`

    it('should return success string when OTP is successfully generated', async () => {
      // Arrange
      const mockEmail = 'otp-email@example.com'
      const mockSuccessStr = 'yippee ki yay'
      MockAxios.post.mockResolvedValueOnce({
        data: mockSuccessStr,
      })

      // Act
      const actual = await sendLoginOtp(mockEmail as TestEmail)

      // Assert
      expect(actual).toEqual(mockSuccessStr)
      expect(MockAxios.post).toHaveBeenCalledWith(EXPECTED_POST_ENDPOINT, {
        email: mockEmail.toLowerCase(),
      })
    })
  })

  describe('verifyLoginOtp', () => {
    const EXPECTED_POST_ENDPOINT = `${AUTH_ENDPOINT}/otp/verify`
    const MOCK_OTP = '123456'
    const MOCK_EMAIL = 'mockEmail@example.com'

    it('should save returned user to localStorage and return user on success', async () => {
      // Arrange
      const mockUser = {
        _id: 'some id',
        email: MOCK_EMAIL,
      }
      MockAxios.post.mockResolvedValueOnce({ data: mockUser })
      const expectedParams = { otp: MOCK_OTP, email: MOCK_EMAIL }

      // Act
      const actual = await verifyLoginOtp(expectedParams)

      // Assert
      expect(actual).toEqual(mockUser)
      expect(MockUserService.saveUserToLocalStorage).toHaveBeenCalledWith(
        mockUser,
      )
      expect(MockAxios.post).toHaveBeenCalledWith(
        EXPECTED_POST_ENDPOINT,
        expectedParams,
      )
    })
  })
})
