import { okAsync } from 'neverthrow'
import { Session } from 'supertest-session'

import MailService from 'src/app/services/mail.service'
import * as OtpUtils from 'src/app/utils/otp'

const MOCK_VALID_OTP = '123456'

export const getAuthedSession = async (
  email: string,
  request: Session,
): Promise<Session> => {
  // Set that so no real mail is sent.
  jest.spyOn(MailService, 'sendLoginOtp').mockReturnValue(okAsync(true))
  // Set that so OTP will always be static.
  jest.spyOn(OtpUtils, 'generateOtp').mockReturnValue(MOCK_VALID_OTP)

  const sendOtpResponse = await request.post('/auth/sendotp').send({ email })
  expect(sendOtpResponse.status).toEqual(200)
  expect(sendOtpResponse.text).toEqual(`OTP sent to ${email}!`)

  // Act
  await request.post('/auth/verifyotp').send({ email, otp: MOCK_VALID_OTP })

  // Assert
  // Should have session cookie returned.
  const sessionCookie = request.cookies.find(
    (cookie) => cookie.name === 'connect.sid',
  )
  expect(sessionCookie).toBeDefined()

  return request
}
