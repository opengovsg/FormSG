const {
  MailService,
} = require('../../../../dist/backend/app/services/mail.service')
const { merge, cloneDeep } = require('lodash')
const {
  generateLoginOtpHtml,
  generateVerificationOtpHtml,
} = require('../../../../dist/backend/app/utils/mail')

const MOCK_VALID_EMAIL = 'to@example.com'
const MOCK_VALID_EMAIL_2 = 'to2@example.com'
const MOCK_SENDER_EMAIL = 'from@example.com'
const MOCK_APP_NAME = 'mockApp'
const MOCK_APP_URL = 'mockApp.example.com'
const MOCK_SENDER_STRING = `${MOCK_APP_NAME} <${MOCK_SENDER_EMAIL}>`
const MOCK_HTML = '<p>Mock html</p>'

describe('mail.service', () => {
  const mockTransporter = jasmine.createSpyObj('transporter', ['sendMail'])
  const mailService = new MailService({
    transporter: mockTransporter,
    senderMail: MOCK_SENDER_EMAIL,
    appName: MOCK_APP_NAME,
    appUrl: MOCK_APP_URL,
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
        `MailService constructor: senderMail: ${invalidParams.senderMail} is not a valid email`,
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

    it('should reject with error when invoked with empty `to` array', async () => {
      // Arrange
      const invalidMailParams = { ...MOCK_MAIL_PARAMS, to: [] }

      // Act + Assert
      await expectAsync(
        mailService.sendNodeMail(invalidMailParams),
      ).toBeRejectedWithError('Mail undefined error')
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
          html: generateVerificationOtpHtml({
            appName: MOCK_APP_NAME,
            otp: MOCK_OTP,
            minutesToExpiry: 10,
          }),
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
      ).toBeRejectedWithError('Invalid email error')
    })
  })

  describe('sendLoginOtp', () => {
    const MOCK_OTP = '123456'
    it('should send login otp successfully', async () => {
      const sendSpy = spyOn(mailService, 'sendNodeMail').and.callThrough()
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      const expectedArguments = [
        {
          to: MOCK_VALID_EMAIL,
          from: MOCK_SENDER_STRING,
          subject: `One-Time Password (OTP) for ${MOCK_APP_NAME}`,
          html: generateLoginOtpHtml({
            otp: MOCK_OTP,
            appName: MOCK_APP_NAME,
            appUrl: MOCK_APP_URL,
          }),
          headers: {
            // Hardcode in tests in case something changes this.
            'X-Formsg-Email-Type': 'Login OTP',
          },
        },
        { mailId: 'OTP' },
      ]

      // Act + Assert
      await expectAsync(
        mailService.sendLoginOtp(MOCK_VALID_EMAIL, MOCK_OTP),
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
      ).toBeRejectedWithError('Invalid email error')
    })
  })

  describe('sendSubmissionToAdmin', () => {
    const MOCK_VALID_SUBMISSION_PARAMS = {
      adminEmails: MOCK_VALID_EMAIL,
      replyToEmails: ['test1@example.com', 'test2@example.com'],
      html: MOCK_HTML,
      form: {
        title: 'Test form title',
        _id: 'mockFormId',
      },
      submission: {
        id: 'mockSubmissionId',
      },
      attachments: [],
    }

    it('should send submission mail to admin successfully if adminEmail is a single string', async () => {
      const sendSpy = spyOn(mailService, 'sendNodeMail').and.callThrough()
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      const expectedArguments = [
        {
          to: MOCK_VALID_SUBMISSION_PARAMS.adminEmails,
          from: MOCK_SENDER_STRING,
          subject: `formsg-auto: ${MOCK_VALID_SUBMISSION_PARAMS.form.title} (Ref: ${MOCK_VALID_SUBMISSION_PARAMS.submission.id})`,
          html: MOCK_HTML,
          attachments: MOCK_VALID_SUBMISSION_PARAMS.attachments,
          headers: {
            // Hardcode in tests in case something changes this.
            'X-Formsg-Email-Type': 'Admin (response)',
            'X-Formsg-Form-ID': MOCK_VALID_SUBMISSION_PARAMS.form._id,
            'X-Formsg-Submission-ID':
              MOCK_VALID_SUBMISSION_PARAMS.submission.id,
          },
          replyTo: MOCK_VALID_SUBMISSION_PARAMS.replyToEmails.join(', '),
        },
        {
          mailId: MOCK_VALID_SUBMISSION_PARAMS.submission.id,
          formId: MOCK_VALID_SUBMISSION_PARAMS.form._id,
        },
      ]

      // Act + Assert
      await expectAsync(
        mailService.sendSubmissionToAdmin(MOCK_VALID_SUBMISSION_PARAMS),
      ).toBeResolvedTo(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy).toHaveBeenCalledWith(...expectedArguments)
    })

    it('should send submission mail to admin successfully if adminEmail is an array', async () => {
      const sendSpy = spyOn(mailService, 'sendNodeMail').and.callThrough()
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      const adminEmailArray = [MOCK_VALID_EMAIL, MOCK_VALID_EMAIL_2]
      const modifiedParams = {
        ...MOCK_VALID_SUBMISSION_PARAMS,
        adminEmails: adminEmailArray,
      }

      const expectedArguments = [
        {
          to: adminEmailArray,
          from: MOCK_SENDER_STRING,
          subject: `formsg-auto: ${MOCK_VALID_SUBMISSION_PARAMS.form.title} (Ref: ${MOCK_VALID_SUBMISSION_PARAMS.submission.id})`,
          html: MOCK_HTML,
          attachments: MOCK_VALID_SUBMISSION_PARAMS.attachments,
          headers: {
            // Hardcode in tests in case something changes this.
            'X-Formsg-Email-Type': 'Admin (response)',
            'X-Formsg-Form-ID': MOCK_VALID_SUBMISSION_PARAMS.form._id,
            'X-Formsg-Submission-ID':
              MOCK_VALID_SUBMISSION_PARAMS.submission.id,
          },
          replyTo: MOCK_VALID_SUBMISSION_PARAMS.replyToEmails.join(', '),
        },
        {
          mailId: MOCK_VALID_SUBMISSION_PARAMS.submission.id,
          formId: MOCK_VALID_SUBMISSION_PARAMS.form._id,
        },
      ]

      // Act + Assert
      await expectAsync(
        mailService.sendSubmissionToAdmin(modifiedParams),
      ).toBeResolvedTo(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy).toHaveBeenCalledWith(...expectedArguments)
    })

    it('should reject with error when adminEmail param is an invalid email string', async () => {
      // Arrange
      const invalidParams = {
        ...MOCK_VALID_SUBMISSION_PARAMS,
        adminEmails: 'notAnEmail',
      }
      // Act + Assert
      await expectAsync(
        mailService.sendSubmissionToAdmin(invalidParams),
      ).toBeRejectedWithError('Invalid email error')
    })

    it('should reject with error when adminEmail param is an empty array', async () => {
      // Arrange
      const invalidParams = {
        ...MOCK_VALID_SUBMISSION_PARAMS,
        adminEmails: [],
      }
      // Act + Assert
      await expectAsync(
        mailService.sendSubmissionToAdmin(invalidParams),
      ).toBeRejectedWithError('Mail undefined error')
    })

    it('should reject with error when adminEmail param array contains invalid emails', async () => {
      // Arrange
      const invalidParams = {
        ...MOCK_VALID_SUBMISSION_PARAMS,
        adminEmails: [MOCK_VALID_EMAIL, 'thisIsInvalidEmail'],
      }
      // Act + Assert
      await expectAsync(
        mailService.sendSubmissionToAdmin(invalidParams),
      ).toBeRejectedWithError('Invalid email error')
    })
  })

  describe('sendAutoReplyEmail', () => {
    const MOCK_SENDER_NAME = 'John Doe'
    const MOCK_AUTOREPLY_PARAMS = {
      html: MOCK_HTML,
      form: {
        title: 'Test form title',
        _id: 'mockFormId',
        admin: {
          agency: {
            fullName: MOCK_SENDER_NAME,
          },
        },
      },
      submission: {
        id: 'mockSubmissionId',
      },
      attachments: ['something'],
      autoReplyData: {
        email: MOCK_VALID_EMAIL_2,
      },
      index: 10,
    }

    const DEFAULT_EXPECTED_ARGS = [
      {
        to: MOCK_AUTOREPLY_PARAMS.autoReplyData.email,
        from: `${MOCK_AUTOREPLY_PARAMS.form.admin.agency.fullName} <${MOCK_SENDER_EMAIL}>`,
        subject: `Thank you for submitting ${MOCK_AUTOREPLY_PARAMS.form.title}`,
        html: MOCK_HTML,
        headers: {
          // Hardcode in tests in case something changes this.
          'X-Formsg-Email-Type': 'Email confirmation',
          'X-Formsg-Form-ID': MOCK_AUTOREPLY_PARAMS.form._id,
          'X-Formsg-Submission-ID': MOCK_AUTOREPLY_PARAMS.submission.id,
        },
        // Note this should be by default empty
        attachments: [],
      },
      {
        mailId: `${MOCK_AUTOREPLY_PARAMS.submission.id}-${MOCK_AUTOREPLY_PARAMS.index}`,
        formId: MOCK_AUTOREPLY_PARAMS.form._id,
      },
    ]

    it('should send autoreply mail successfully with defaults', async () => {
      const sendSpy = spyOn(mailService, 'sendNodeMail').and.callThrough()
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      // Act + Assert
      await expectAsync(
        mailService.sendAutoReplyEmail(MOCK_AUTOREPLY_PARAMS),
      ).toBeResolvedTo(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy).toHaveBeenCalledWith(...DEFAULT_EXPECTED_ARGS)
    })

    it('should send autoreply mail successfully with custom autoreply subject', async () => {
      const sendSpy = spyOn(mailService, 'sendNodeMail').and.callThrough()
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      const customSubject = 'customSubject'
      const customDataParams = merge(
        { autoReplyData: { subject: customSubject } },
        MOCK_AUTOREPLY_PARAMS,
      )

      const expectedArgs = cloneDeep(DEFAULT_EXPECTED_ARGS)
      expectedArgs[0].subject = customSubject

      // Act + Assert
      await expectAsync(
        mailService.sendAutoReplyEmail(customDataParams),
      ).toBeResolvedTo(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy).toHaveBeenCalledWith(...expectedArgs)
    })

    it('should send autoreply mail successfully with custom autoreply sender', async () => {
      const sendSpy = spyOn(mailService, 'sendNodeMail').and.callThrough()
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      const customSender = 'customSender@example.com'
      const customDataParams = merge(
        { autoReplyData: { sender: customSender } },
        MOCK_AUTOREPLY_PARAMS,
      )

      const expectedArgs = cloneDeep(DEFAULT_EXPECTED_ARGS)
      expectedArgs[0].from = `${customSender} <${MOCK_SENDER_EMAIL}>`

      // Act + Assert
      await expectAsync(
        mailService.sendAutoReplyEmail(customDataParams),
      ).toBeResolvedTo(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy).toHaveBeenCalledWith(...expectedArgs)
    })

    it('should send autoreply mail with attachment if autoReply.includeFormSummary is true', async () => {
      const sendSpy = spyOn(mailService, 'sendNodeMail').and.callThrough()
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      const customDataParams = merge(
        { autoReplyData: { includeFormSummary: true } },
        MOCK_AUTOREPLY_PARAMS,
      )

      const expectedArgs = cloneDeep(DEFAULT_EXPECTED_ARGS)
      expectedArgs[0].attachments = MOCK_AUTOREPLY_PARAMS.attachments

      // Act + Assert
      await expectAsync(
        mailService.sendAutoReplyEmail(customDataParams),
      ).toBeResolvedTo(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy).toHaveBeenCalledWith(...expectedArgs)
    })

    it('should reject with error when autoReplyData.email param is an invalid email', async () => {
      // Arrange
      const invalidDataParams = merge(
        { autoReplyData: { email: 'notAnEmail' } },
        MOCK_AUTOREPLY_PARAMS,
      )

      // Act + Assert
      await expectAsync(
        mailService.sendSubmissionToAdmin(invalidDataParams),
      ).toBeRejectedWithError('Mail undefined error')
    })
  })
})
