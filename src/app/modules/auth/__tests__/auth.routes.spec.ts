import { pick } from 'lodash'
import { errAsync, okAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'
import validator from 'validator'

import MailService from 'src/app/services/mail/mail.service'
import * as OtpUtils from 'src/app/utils/otp'
import { IAgencySchema } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { MailSendError } from '../../../services/mail/mail.errors'
import { ApplicationError, DatabaseError } from '../../core/core.errors'
import * as UserService from '../../user/user.service'
import { AuthRouter } from '../auth.routes'
import * as AuthService from '../auth.service'

const app = setupApp('/auth', AuthRouter)

describe('auth.routes', () => {
  let request: Session

  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => {
    request = supertest(app)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('POST /auth/checkuser', () => {
    it('should return 400 when body.email is not provided as a param', async () => {
      // Act
      const response = await request.post('/auth/checkuser')

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Some required parameters are missing' }),
      )
    })

    it('should return 400 when body.email is invalid', async () => {
      // Arrange
      const invalidEmail = 'not an email'

      // Act
      const response = await request
        .post('/auth/checkuser')
        .send({ email: invalidEmail })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Some required parameters are missing' }),
      )
    })

    it('should return 401 when domain of body.email does not exist in Agency collection', async () => {
      // Arrange
      const validEmailWithInvalidDomain = 'test@example.com'

      // Act
      const response = await request
        .post('/auth/checkuser')
        .send({ email: validEmailWithInvalidDomain })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.text).toEqual(
        'This is not a whitelisted public service email domain. Please log in with your official government or government-linked email address.',
      )
    })

    it('should return 200 when domain of body.email exists in Agency collection', async () => {
      // Arrange
      // Insert agency
      const validDomain = 'example.com'
      const validEmail = `test@${validDomain}`
      await dbHandler.insertDefaultAgency({ mailDomain: validDomain })

      // Act
      const response = await request
        .post('/auth/checkuser')
        .send({ email: validEmail })

      // Assert
      expect(response.status).toEqual(200)
      expect(response.text).toEqual('OK')
    })

    it('should return 500 when validating domain returns a database error', async () => {
      // Arrange
      // Insert agency
      const validDomain = 'example.com'
      const validEmail = `test@${validDomain}`
      const mockErrorString = 'Unable to validate email domain.'
      await dbHandler.insertDefaultAgency({ mailDomain: validDomain })

      const getAgencySpy = jest
        .spyOn(AuthService, 'validateEmailDomain')
        .mockReturnValueOnce(errAsync(new DatabaseError(mockErrorString)))

      // Act
      const response = await request
        .post('/auth/checkuser')
        .send({ email: validEmail })

      // Assert
      expect(getAgencySpy).toBeCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(mockErrorString)
    })
  })

  describe('POST /auth/sendotp', () => {
    const VALID_DOMAIN = 'example.com'
    const VALID_EMAIL = `test@${VALID_DOMAIN}`
    const INVALID_DOMAIN = 'example.org'

    beforeEach(async () =>
      dbHandler.insertDefaultAgency({ mailDomain: VALID_DOMAIN }),
    )

    it('should return 400 when body.email is not provided as a param', async () => {
      // Act
      const response = await request.post('/auth/sendotp')

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Some required parameters are missing' }),
      )
    })

    it('should return 400 when body.email is invalid', async () => {
      // Arrange
      const invalidEmail = 'not an email'

      // Act
      const response = await request
        .post('/auth/sendotp')
        .send({ email: invalidEmail })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Some required parameters are missing' }),
      )
    })

    it('should return 401 when domain of body.email does not exist in Agency collection', async () => {
      // Arrange
      const validEmailWithInvalidDomain = `test@${INVALID_DOMAIN}`
      expect(validator.isEmail(validEmailWithInvalidDomain)).toEqual(true)

      // Act
      const response = await request
        .post('/auth/sendotp')
        .send({ email: validEmailWithInvalidDomain })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.text).toEqual(
        'This is not a whitelisted public service email domain. Please log in with your official government or government-linked email address.',
      )
    })

    it('should return 500 when error occurs whilst creating OTP', async () => {
      // Arrange
      const createLoginOtpSpy = jest
        .spyOn(AuthService, 'createLoginOtp')
        .mockReturnValueOnce(errAsync(new ApplicationError()))

      // Act
      const response = await request
        .post('/auth/sendotp')
        .send({ email: VALID_EMAIL })

      // Assert
      expect(createLoginOtpSpy).toHaveBeenCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(
        'Failed to send login OTP. Please try again later and if the problem persists, contact us.',
      )
    })

    it('should return 500 when error occurs whilst sending login OTP', async () => {
      // Arrange
      const sendLoginOtpSpy = jest
        .spyOn(MailService, 'sendLoginOtp')
        .mockReturnValueOnce(errAsync(new MailSendError('some error')))

      // Act
      const response = await request
        .post('/auth/sendotp')
        .send({ email: VALID_EMAIL })

      // Assert
      expect(sendLoginOtpSpy).toHaveBeenCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(
        'Failed to send login OTP. Please try again later and if the problem persists, contact us.',
      )
    })

    it('should return 500 when validating domain returns a database error', async () => {
      // Arrange
      const getAgencySpy = jest
        .spyOn(AuthService, 'validateEmailDomain')
        .mockReturnValueOnce(errAsync(new DatabaseError()))

      // Act
      const response = await request
        .post('/auth/sendotp')
        .send({ email: VALID_EMAIL })

      // Assert
      expect(getAgencySpy).toBeCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(
        'Failed to send login OTP. Please try again later and if the problem persists, contact us.',
      )
    })

    it('should return 200 when otp is sent successfully', async () => {
      // Arrange
      const sendLoginOtpSpy = jest
        .spyOn(MailService, 'sendLoginOtp')
        .mockReturnValueOnce(okAsync(true))

      // Act
      const response = await request
        .post('/auth/sendotp')
        .send({ email: VALID_EMAIL })

      // Assert
      expect(sendLoginOtpSpy).toHaveBeenCalled()
      expect(response.status).toEqual(200)
      expect(response.text).toEqual(`OTP sent to ${VALID_EMAIL}!`)
    })
  })

  describe('POST /auth/verifyotp', () => {
    const MOCK_VALID_OTP = '123456'
    const VALID_DOMAIN = 'example.com'
    const VALID_EMAIL = `test@${VALID_DOMAIN}`
    const INVALID_DOMAIN = 'example.org'

    let defaultAgency: IAgencySchema

    beforeEach(async () => {
      defaultAgency = await dbHandler.insertDefaultAgency({
        mailDomain: VALID_DOMAIN,
      })
      jest.spyOn(OtpUtils, 'generateOtp').mockReturnValue(MOCK_VALID_OTP)
    })

    it('should return 400 when body.email is not provided as a param', async () => {
      // Act
      const response = await request.post('/auth/verifyotp').send({
        otp: MOCK_VALID_OTP,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Some required parameters are missing' }),
      )
    })

    it('should return 400 when body.otp is not provided as a param', async () => {
      // Act
      const response = await request.post('/auth/verifyotp').send({
        email: VALID_EMAIL,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Some required parameters are missing' }),
      )
    })

    it('should return 400 when body.email is invalid', async () => {
      // Arrange
      const invalidEmail = 'not an email'

      // Act
      const response = await request
        .post('/auth/verifyotp')
        .send({ email: invalidEmail, otp: MOCK_VALID_OTP })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Some required parameters are missing' }),
      )
    })

    it('should return 400 when body.otp is less than 6 digits', async () => {
      // Act
      const response = await request.post('/auth/verifyotp').send({
        email: VALID_EMAIL,
        otp: '12345',
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Some required parameters are missing' }),
      )
    })

    it('should return 400 when body.otp is 6 characters but does not consist purely of digits', async () => {
      // Act
      const response = await request.post('/auth/verifyotp').send({
        email: VALID_EMAIL,
        otp: '123abc',
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Some required parameters are missing' }),
      )
    })

    it('should return 401 when domain of body.email does not exist in Agency collection', async () => {
      // Arrange
      const validEmailWithInvalidDomain = `test@${INVALID_DOMAIN}`
      expect(validator.isEmail(validEmailWithInvalidDomain)).toEqual(true)

      // Act
      const response = await request
        .post('/auth/verifyotp')
        .send({ email: validEmailWithInvalidDomain, otp: MOCK_VALID_OTP })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.text).toEqual(
        'This is not a whitelisted public service email domain. Please log in with your official government or government-linked email address.',
      )
    })

    it('should return 500 when validating domain returns a database error', async () => {
      // Arrange
      const getAgencySpy = jest
        .spyOn(AuthService, 'validateEmailDomain')
        .mockReturnValueOnce(errAsync(new DatabaseError()))

      // Act
      const response = await request
        .post('/auth/verifyotp')
        .send({ email: VALID_EMAIL, otp: MOCK_VALID_OTP })

      // Assert
      expect(getAgencySpy).toBeCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual('Something went wrong. Please try again.')
    })

    it('should return 422 when hash does not exist for body.otp', async () => {
      // Act
      const response = await request
        .post('/auth/verifyotp')
        .send({ email: VALID_EMAIL, otp: MOCK_VALID_OTP })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.text).toEqual(
        expect.stringContaining(
          'OTP has expired. Please request for a new OTP.',
        ),
      )
    })

    it('should return 422 when body.otp is invalid', async () => {
      // Arrange
      const invalidOtp = '654321'
      // Request for OTP so the hash exists.
      await requestForOtp(VALID_EMAIL)

      // Act
      const response = await request
        .post('/auth/verifyotp')
        .send({ email: VALID_EMAIL, otp: invalidOtp })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.text).toEqual('OTP is invalid. Please try again.')
    })

    it('should should return 422 when invalid body.otp has been attempted too many times', async () => {
      // Arrange
      const invalidOtp = '654321'
      // Request for OTP so the hash exists.
      await requestForOtp(VALID_EMAIL)

      // Act
      // Attempt invalid OTP for MAX_OTP_ATTEMPTS.
      const verifyPromises = []
      for (let i = 0; i < AuthService.MAX_OTP_ATTEMPTS; i++) {
        verifyPromises.push(
          request
            .post('/auth/verifyotp')
            .send({ email: VALID_EMAIL, otp: invalidOtp }),
        )
      }
      const results = (await Promise.all(verifyPromises)).map((resolve) =>
        pick(resolve, ['status', 'text']),
      )
      // Should be all invalid OTP responses.
      expect(results).toEqual(
        Array(AuthService.MAX_OTP_ATTEMPTS).fill({
          status: 422,
          text: 'OTP is invalid. Please try again.',
        }),
      )

      // Act again, this time with a valid OTP.
      const response = await request
        .post('/auth/verifyotp')
        .send({ email: VALID_EMAIL, otp: MOCK_VALID_OTP })

      // Assert
      // Should still reject with max OTP attempts error.
      expect(response.status).toEqual(422)
      expect(response.text).toEqual(
        'You have hit the max number of attempts. Please request for a new OTP.',
      )
    })

    it('should return 200 with user object when body.otp is a valid OTP', async () => {
      // Arrange
      // Request for OTP so the hash exists.
      await requestForOtp(VALID_EMAIL)

      // Act
      const response = await request
        .post('/auth/verifyotp')
        .send({ email: VALID_EMAIL, otp: MOCK_VALID_OTP })

      // Assert
      expect(response.status).toEqual(200)
      // Body should be an user object.
      expect(response.body).toMatchObject({
        // Required since that's how the data is sent out from the application.
        agency: JSON.parse(JSON.stringify(defaultAgency.toObject())),
        _id: expect.any(String),
        created: expect.any(String),
        email: VALID_EMAIL,
      })
      // Should have session cookie returned.
      const sessionCookie = request.cookies.find(
        (cookie) => cookie.name === 'connect.sid',
      )
      expect(sessionCookie).toBeDefined()
    })

    it('should return 500 when upserting user document fails', async () => {
      // Arrange
      // Request for OTP so the hash exists.
      await requestForOtp(VALID_EMAIL)

      // Mock error returned when creating user
      const upsertSpy = jest
        .spyOn(UserService, 'retrieveUser')
        .mockReturnValueOnce(errAsync(new DatabaseError('some error')))

      // Act
      const response = await request
        .post('/auth/verifyotp')
        .send({ email: VALID_EMAIL, otp: MOCK_VALID_OTP })

      // Assert
      // Should have reached this spy.
      expect(upsertSpy).toBeCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(
        expect.stringContaining('Failed to process OTP.'),
      )
    })
  })

  describe('GET /auth/signout', () => {
    const MOCK_VALID_OTP = '123456'
    const VALID_DOMAIN = 'example.com'
    const VALID_EMAIL = `test@${VALID_DOMAIN}`

    beforeEach(async () => {
      await dbHandler.insertDefaultAgency({
        mailDomain: VALID_DOMAIN,
      })
      jest.spyOn(OtpUtils, 'generateOtp').mockReturnValue(MOCK_VALID_OTP)
    })

    it('should return 200 and clear cookies when signout is successful', async () => {
      // Act
      // Sign in user
      await signInUser(VALID_EMAIL, MOCK_VALID_OTP)

      // Arrange
      const response = await request.get('/auth/signout')

      // Assert
      expect(response.status).toEqual(200)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Sign out successful' }),
      )
      // connect.sid should now be empty.
      expect(response.header['set-cookie'][0]).toEqual(
        expect.stringContaining('connect.sid=;'),
      )
    })

    it('should return 200 even when user has not signed in before', async () => {
      // Note that no log in calls have been made with request yet.
      // Act
      const response = await request.get('/auth/signout')

      // Assert
      expect(response.status).toEqual(200)
      expect(response.text).toEqual(
        JSON.stringify({ message: 'Sign out successful' }),
      )
    })
  })

  // Helper functions
  const requestForOtp = async (email: string) => {
    // Set that so no real mail is sent.
    jest.spyOn(MailService, 'sendLoginOtp').mockReturnValue(okAsync(true))

    const response = await request.post('/auth/sendotp').send({ email })
    expect(response.text).toEqual(`OTP sent to ${email}!`)
  }

  const signInUser = async (email: string, otp: string) => {
    await requestForOtp(email)
    const response = await request.post('/auth/verifyotp').send({ email, otp })

    // Assert
    // Should have session cookie returned.
    const sessionCookie = request.cookies.find(
      (cookie) => cookie.name === 'connect.sid',
    )
    expect(sessionCookie).toBeDefined()
    return response.body
  }
})
