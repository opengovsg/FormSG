import axios from 'axios'

import { GOOGLE_RECAPTCHA_URL } from '../captcha.constants'
import {
  CaptchaConnectionError,
  MissingCaptchaError,
  VerifyCaptchaError,
} from '../captcha.errors'
import { verifyCaptchaResponse } from '../captcha.service'

const MOCK_PRIVATE_KEY = process.env.GOOGLE_CAPTCHA
const MOCK_RESPONSE = 'captchaResponse'
const MOCK_REMOTE_IP = 'remoteIp'
jest.mock('axios')
const MockAxios = jest.mocked(axios)

describe('captcha.service', () => {
  describe('verifyCaptchaResponse', () => {
    beforeEach(() => jest.clearAllMocks())

    it('should return MissingCaptchaError when response is falsy', async () => {
      const result = await verifyCaptchaResponse(null, undefined)

      expect(result._unsafeUnwrapErr()).toEqual(new MissingCaptchaError())
    })

    it('should return VerifyCaptchaError when captcha response is incorrect', async () => {
      MockAxios.get.mockResolvedValueOnce({ data: { success: false } })

      const result = await verifyCaptchaResponse(MOCK_RESPONSE, MOCK_REMOTE_IP)

      expect(MockAxios.get).toHaveBeenCalledWith(GOOGLE_RECAPTCHA_URL, {
        params: {
          secret: MOCK_PRIVATE_KEY,
          response: MOCK_RESPONSE,
          remoteip: MOCK_REMOTE_IP,
        },
      })
      expect(result._unsafeUnwrapErr()).toEqual(new VerifyCaptchaError())
    })

    it('should return true when captcha response is correct', async () => {
      MockAxios.get.mockResolvedValueOnce({ data: { success: true } })

      const result = await verifyCaptchaResponse(MOCK_RESPONSE, MOCK_REMOTE_IP)

      expect(MockAxios.get).toHaveBeenCalledWith(GOOGLE_RECAPTCHA_URL, {
        params: {
          secret: MOCK_PRIVATE_KEY,
          response: MOCK_RESPONSE,
          remoteip: MOCK_REMOTE_IP,
        },
      })
      expect(result._unsafeUnwrap()).toEqual(true)
    })

    it('should return CaptchaConnectionError when connection with captcha server fails', async () => {
      MockAxios.get.mockRejectedValueOnce(false)

      const result = await verifyCaptchaResponse(MOCK_RESPONSE, MOCK_REMOTE_IP)

      expect(MockAxios.get).toHaveBeenCalledWith(GOOGLE_RECAPTCHA_URL, {
        params: {
          secret: MOCK_PRIVATE_KEY,
          response: MOCK_RESPONSE,
          remoteip: MOCK_REMOTE_IP,
        },
      })
      expect(result._unsafeUnwrapErr()).toEqual(new CaptchaConnectionError())
    })
  })
})
