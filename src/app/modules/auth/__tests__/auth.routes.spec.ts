import request from 'supertest'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import validator from 'validator'

import MailService from 'src/app/services/mail.service'

import { AuthRouter } from '../auth.routes'
import * as AuthService from '../auth.service'

describe('auth.routes', () => {
  const app = setupApp('/auth', AuthRouter)

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('POST /auth/checkuser', () => {
    it('should return 400 when body.email is not provided as a param', async () => {
      // Act
      const response = await request(app).post('/auth/checkuser')

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('"email" is required')
    })

    it('should return 400 when body.email is invalid', async () => {
      // Arrange
      const invalidEmail = 'not an email'

      // Act
      const response = await request(app)
        .post('/auth/checkuser')
        .send({ email: invalidEmail })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('Please enter a valid email')
    })

    it('should return 401 when domain of body.email does not exist in Agency collection', async () => {
      // Arrange
      const validEmailWithInvalidDomain = 'test@example.com'

      // Act
      const response = await request(app)
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
      const response = await request(app)
        .post('/auth/checkuser')
        .send({ email: validEmail })

      // Assert
      expect(response.status).toEqual(200)
      expect(response.text).toEqual('OK')
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
      const response = await request(app).post('/auth/sendotp')

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('"email" is required')
    })

    it('should return 400 when body.email is invalid', async () => {
      // Arrange
      const invalidEmail = 'not an email'

      // Act
      const response = await request(app)
        .post('/auth/sendotp')
        .send({ email: invalidEmail })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('Please enter a valid email')
    })

    it('should return 401 when domain of body.email does not exist in Agency collection', async () => {
      // Arrange
      const validEmailWithInvalidDomain = `test@${INVALID_DOMAIN}`
      expect(validator.isEmail(validEmailWithInvalidDomain)).toEqual(true)

      // Act
      const response = await request(app)
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
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const response = await request(app)
        .post('/auth/sendotp')
        .send({ email: VALID_EMAIL })

      // Assert
      expect(createLoginOtpSpy).toHaveBeenCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(
        'Failed to send login OTP. Please try again later and if the problem persists, contact us.',
      )
      createLoginOtpSpy.mockRestore()
    })

    it('should return 500 when error occurs whilst sending login OTP', async () => {
      // Arrange
      const sendLoginOtpSpy = jest
        .spyOn(MailService, 'sendLoginOtp')
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const response = await request(app)
        .post('/auth/sendotp')
        .send({ email: VALID_EMAIL })

      // Assert
      expect(sendLoginOtpSpy).toHaveBeenCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(
        'Error sending OTP. Please try again later and if the problem persists, contact us.',
      )
      sendLoginOtpSpy.mockRestore()
    })

    it('should return 200 when otp is sent successfully', async () => {
      // Arrange
      const sendLoginOtpSpy = jest
        .spyOn(MailService, 'sendLoginOtp')
        .mockResolvedValueOnce(true)

      // Act
      const response = await request(app)
        .post('/auth/sendotp')
        .send({ email: VALID_EMAIL })

      // Assert
      expect(sendLoginOtpSpy).toHaveBeenCalled()
      expect(response.status).toEqual(200)
      expect(response.text).toEqual(`OTP sent to ${VALID_EMAIL}!`)
      sendLoginOtpSpy.mockRestore()
    })
  })
})
