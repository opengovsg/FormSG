import { StatusCodes } from 'http-status-codes'

import { ApiService, HttpError } from '~services/ApiService'

import {
  OTP_RATE_LIMIT_ERROR_MESSAGE,
  triggerSendOtp,
  verifyOtp,
} from './VerifiableFieldService'

const MOCK_FORM_ID = '61540ece3d4a6e50ac0cc6ff'
const MOCK_TRANSACTION_ID = '61540ece3d4a6e50ac0cc700'
const MOCK_FIELD_ID = '61540ece3d4a6e50ac0cc701'

describe('VerifiableFieldService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('triggerSendOtp', () => {
    it('should show OTP-specific copy when the route rate limit is exceeded', async () => {
      vi.spyOn(ApiService, 'post').mockRejectedValue(
        new HttpError('Please try again later.', StatusCodes.TOO_MANY_REQUESTS),
      )

      await expect(
        triggerSendOtp({
          formId: MOCK_FORM_ID,
          transactionId: MOCK_TRANSACTION_ID,
          fieldId: MOCK_FIELD_ID,
          answer: 'test@example.com',
        }),
      ).rejects.toMatchObject({
        code: StatusCodes.TOO_MANY_REQUESTS,
        message: OTP_RATE_LIMIT_ERROR_MESSAGE,
      })
    })

    it('should preserve existing non-rate-limit OTP messages', async () => {
      const resendCooldownMessage =
        'Please wait for a while before requesting another OTP.'

      vi.spyOn(ApiService, 'post').mockRejectedValue(
        new HttpError(resendCooldownMessage, StatusCodes.UNPROCESSABLE_ENTITY),
      )

      await expect(
        triggerSendOtp({
          formId: MOCK_FORM_ID,
          transactionId: MOCK_TRANSACTION_ID,
          fieldId: MOCK_FIELD_ID,
          answer: 'test@example.com',
        }),
      ).rejects.toMatchObject({
        code: StatusCodes.UNPROCESSABLE_ENTITY,
        message: resendCooldownMessage,
      })
    })
  })

  describe('verifyOtp', () => {
    it('should show OTP-specific copy when the route rate limit is exceeded', async () => {
      vi.spyOn(ApiService, 'post').mockRejectedValue(
        new HttpError('Please try again later.', StatusCodes.TOO_MANY_REQUESTS),
      )

      await expect(
        verifyOtp({
          formId: MOCK_FORM_ID,
          transactionId: MOCK_TRANSACTION_ID,
          fieldId: MOCK_FIELD_ID,
          otp: '123456',
        }),
      ).rejects.toMatchObject({
        code: StatusCodes.TOO_MANY_REQUESTS,
        message: OTP_RATE_LIMIT_ERROR_MESSAGE,
      })
    })

    it('should preserve existing non-rate-limit OTP messages', async () => {
      const wrongOtpMessage = 'OTP provided is not valid.'

      vi.spyOn(ApiService, 'post').mockRejectedValue(
        new HttpError(wrongOtpMessage, StatusCodes.UNPROCESSABLE_ENTITY),
      )

      await expect(
        verifyOtp({
          formId: MOCK_FORM_ID,
          transactionId: MOCK_TRANSACTION_ID,
          fieldId: MOCK_FIELD_ID,
          otp: '123456',
        }),
      ).rejects.toMatchObject({
        code: StatusCodes.UNPROCESSABLE_ENTITY,
        message: wrongOtpMessage,
      })
    })
  })
})
