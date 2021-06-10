import axios from 'axios'
import { mocked } from 'ts-jest/utils'
import { Opaque } from 'type-fest'

import {
  AUTH_ENDPOINT,
  checkIsEmailAllowed,
  sendLoginOtp,
} from '../AuthService'

jest.mock('axios')

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
})
