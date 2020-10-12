import { okAsync } from 'neverthrow'
import { Session } from 'supertest-session'

import MailService from 'src/app/services/mail/mail.service'
import * as OtpUtils from 'src/app/utils/otp'

const MOCK_VALID_OTP = '123456'

/**
 * Integration test helper to create an authenticated session where the user
 * corresponding to the given email is logged in.
 *
 * ! This function mocks MailService#sendLoginOtp and OtpUtils#generateOtp.
 *
 * The mocks are cleared at the end of this function. However, The spies are
 * still mocking the functions, so the onus is on the calling test to restore
 * or implement new mocks when needed.
 *
 * @precondition The agency document relating to the domain of the given email must have been created prior to calling this function
 * @param email the email of the user to log in.
 * @param request the session to inject authenticated information into
 */
export const createAuthedSession = async (
  email: string,
  request: Session,
): Promise<Session> => {
  // Set that so no real mail is sent.
  const mailSpy = jest
    .spyOn(MailService, 'sendLoginOtp')
    .mockReturnValueOnce(okAsync(true))
  // Set that so OTP will always be static.
  const otpSpy = jest
    .spyOn(OtpUtils, 'generateOtp')
    .mockReturnValueOnce(MOCK_VALID_OTP)

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

  // Clear this test's mocked spies so calls do not pollute calling test.
  // Note that the spies are still mocking the functions, so the onus is on the
  // calling test to restore or implement new mocks when needed.
  mailSpy.mockClear()
  otpSpy.mockClear()
  return request
}
