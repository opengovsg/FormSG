const {
  MailService,
} = require('../../../../dist/backend/app/services/mail.service')
const { merge } = require('lodash')

const MOCK_VALID_EMAIL = 'to@example.com'
const MOCK_VALID_EMAIL_2 = 'to2@example.com'
const MOCK_SENDER_EMAIL = 'from@example.com'
const MOCK_APP_NAME = 'mockApp'
const MOCK_SENDER_STRING = `${MOCK_APP_NAME} <${MOCK_SENDER_EMAIL}>`

fdescribe('mail.service', () => {
  const mockTransporter = jasmine.createSpyObj('transporter', ['sendMail'])
  const mailService = new MailService({
    transporter: mockTransporter,
    senderMail: MOCK_SENDER_EMAIL,
    appName: MOCK_APP_NAME,
  })

  describe('Constructor', () => {
    it('should throw error when invalid senderMail param is passed ', () => {
      // Arrange
      const invalidParams = {
        transporter: mockTransporter,
        senderMail: 'notAnEmail',
      }
      // Act + Assert
      expect(() => new MailService(invalidParams)).toThrowError(
        'MailService constructor: senderMail parameter is not a valid email',
      )
    })
  })

  describe('sendNodeMail', () => {
    const MOCK_MAIL_PARAMS = {
      to: MOCK_VALID_EMAIL,
      from: MOCK_SENDER_EMAIL,
      subject: 'send node mail in tests',
      html: `<p>You are currently submitting a form.</p>`,
    }

    it('should receive correct response when mail is sent successfully with valid `to` email string', async () => {
      // Arrange
      // Mock response
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      // Act + Assert
      await expectAsync(
        mailService.sendNodeMail(MOCK_MAIL_PARAMS),
      ).toBeResolvedTo(mockedResponse)
    })

    it('should receive correct response when mail is sent successfully with valid `to` email array', async () => {
      // Arrange
      const arrayToMailParams = {
        ...MOCK_MAIL_PARAMS,
        to: [MOCK_VALID_EMAIL, MOCK_VALID_EMAIL_2],
      }

      // Mock response
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      // Act + Assert
      await expectAsync(
        mailService.sendNodeMail(arrayToMailParams),
      ).toBeResolvedTo(mockedResponse)
    })

    it('should reject with error when mail sending throws an error', async () => {
      // Arrange
      // Mock rejection with 4xx error
      const expectedError = merge(new Error('Rejected'), { responseCode: 404 })
      mockTransporter.sendMail.and.throwError(expectedError)

      // Act + Assert
      await expectAsync(
        mailService.sendNodeMail(MOCK_MAIL_PARAMS),
      ).toBeRejectedWith(expectedError)
    })

    it('should reject with error when mail params are missing', async () => {
      // Act + Assert
      await expectAsync(mailService.sendNodeMail()).toBeRejectedWithError(
        'Mail undefined error',
      )
    })

    it('should reject with error when invoked with invalid `to` email string', async () => {
      // Arrange
      const invalidMailParams = { ...MOCK_MAIL_PARAMS, to: 'notAnEmailAddress' }

      // Act + Assert
      await expectAsync(
        mailService.sendNodeMail(invalidMailParams),
      ).toBeRejectedWithError('Invalid email error')
    })

    it('should reject with error when invoked with invalid `to` email array', async () => {
      // Arrange
      const invalidMailParams = {
        ...MOCK_MAIL_PARAMS,
        to: [MOCK_VALID_EMAIL, 'notAnEmailAddress'],
      }

      // Act + Assert
      await expectAsync(
        mailService.sendNodeMail(invalidMailParams),
      ).toBeRejectedWithError('Invalid email error')
    })
  })

  describe('sendVerificationOtp', () => {
    const MOCK_OTP = '123456'

    it('should send verification otp successfully', async () => {
      // Arrange
      const sendSpy = spyOn(mailService, 'sendNodeMail').and.callThrough()
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      const expectedArguments = [
        {
          to: MOCK_VALID_EMAIL,
          from: MOCK_SENDER_STRING,
          subject: `Your OTP for submitting a form on ${MOCK_APP_NAME}`,
          // Can't use dedent here, original seems to work a little differently due to TypeScript compilation.
          html: `<p>You are currently submitting a form on ${MOCK_APP_NAME}.</p>
<p>
  Your OTP is <b>${MOCK_OTP}</b>. 
  It will expire in ${10} minutes. 
  Please use this to verify your submission.
</p>
<p>If your OTP does not work, please request for a new OTP.</p>`,
          headers: {
            // Hardcode in tests in case something changes this.
            'X-Formsg-Email-Type': 'Verification OTP',
          },
        },
        { mailId: 'verify' },
      ]

      // Act + Assert
      await expectAsync(
        mailService.sendVerificationOtp(MOCK_VALID_EMAIL, MOCK_OTP),
      ).toBeResolvedTo(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy).toHaveBeenCalledWith(...expectedArguments)
    })

    it('should reject with error when email is invalid', async () => {
      // Arrange
      const invalidEmail = 'notAnEmail'
      // Act + Assert
      await expectAsync(
        mailService.sendVerificationOtp(invalidEmail, MOCK_OTP),
      ).toBeRejectedWithError(`${invalidEmail} is not a valid email`)
    })
  })

  describe('sendLoginOtp', () => {
    const MOCK_HTML = '<p>Mock html</p>'

    it('should send login otp successfully', async () => {
      const sendSpy = spyOn(mailService, 'sendNodeMail').and.callThrough()
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      const expectedArguments = [
        {
          to: MOCK_VALID_EMAIL,
          from: MOCK_SENDER_STRING,
          subject: `One-Time Password (OTP) for ${MOCK_APP_NAME}`,
          html: MOCK_HTML,
          headers: {
            // Hardcode in tests in case something changes this.
            'X-Formsg-Email-Type': 'Login OTP',
          },
        },
        { mailId: 'OTP' },
      ]

      // Act + Assert
      await expectAsync(
        mailService.sendLoginOtp(MOCK_VALID_EMAIL, MOCK_HTML),
      ).toBeResolvedTo(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy).toHaveBeenCalledWith(...expectedArguments)
    })

    it('should reject with error when email is invalid', async () => {
      // Arrange
      const invalidEmail = 'notAnEmail'
      // Act + Assert
      await expectAsync(
        mailService.sendVerificationOtp(invalidEmail, MOCK_HTML),
      ).toBeRejectedWithError(`${invalidEmail} is not a valid email`)
    })
  })
})
