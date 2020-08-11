import { merge } from 'lodash'
import Mail, { Attachment } from 'nodemailer/lib/mailer'

import { MailService } from 'src/app/services/mail.service'
import {
  generateLoginOtpHtml,
  generateVerificationOtpHtml,
} from 'src/app/utils/mail'
import { IPopulatedForm, ISubmissionSchema } from 'src/types'

const MOCK_VALID_EMAIL = 'to@example.com'
const MOCK_VALID_EMAIL_2 = 'to2@example.com'
const MOCK_SENDER_EMAIL = 'from@example.com'
const MOCK_APP_NAME = 'mockApp'
const MOCK_APP_URL = 'mockApp.example.com'
const MOCK_SENDER_STRING = `${MOCK_APP_NAME} <${MOCK_SENDER_EMAIL}>`
const MOCK_HTML = '<p>Mock html</p>'

describe('mail.service', () => {
  const sendMailSpy = jest.fn()
  const mockTransporter = ({
    sendMail: sendMailSpy,
  } as unknown) as Mail

  beforeEach(() => sendMailSpy.mockReset())

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

    it('should create service successfully', () => {
      expect(mailService).toBeDefined()
    })
  })

  describe('sendVerificationOtp', () => {
    const MOCK_OTP = '123456'

    it('should send verification otp successfully', async () => {
      // Arrange
      // sendMail should return mocked success response
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const expectedArgument = {
        to: MOCK_VALID_EMAIL,
        from: MOCK_SENDER_STRING,
        subject: `Your OTP for submitting a form on ${MOCK_APP_NAME}`,
        html: generateVerificationOtpHtml({
          appName: MOCK_APP_NAME,
          otp: MOCK_OTP,
          minutesToExpiry: 10,
        }),
        headers: {
          // Hardcode in tests in case something changes this.
          'X-Formsg-Email-Type': 'Verification OTP',
        },
      }

      // Act + Assert
      await expect(
        mailService.sendVerificationOtp(MOCK_VALID_EMAIL, MOCK_OTP),
      ).resolves.toEqual(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should reject with error when email is invalid', async () => {
      // Arrange
      const invalidEmail = 'notAnEmail'
      // Act + Assert
      await expect(
        mailService.sendVerificationOtp(invalidEmail, MOCK_OTP),
      ).rejects.toThrowError('Invalid email error')
    })
  })

  describe('sendLoginOtp', () => {
    const MOCK_OTP = '123456'
    it('should send login otp successfully', async () => {
      // Arrange
      // sendMail should return mocked success response
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const expectedArgument = {
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
      }

      // Act + Assert
      await expect(
        mailService.sendLoginOtp(MOCK_VALID_EMAIL, MOCK_OTP),
      ).resolves.toEqual(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should reject with error when email is invalid', async () => {
      // Arrange
      const invalidEmail = 'notAnEmail'
      // Act + Assert
      await expect(
        mailService.sendVerificationOtp(invalidEmail, MOCK_OTP),
      ).rejects.toThrowError('Invalid email error')
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
      // sendMail should return mocked success response
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const expectedArgument = {
        to: MOCK_VALID_SUBMISSION_PARAMS.adminEmails,
        from: MOCK_SENDER_STRING,
        subject: `formsg-auto: ${MOCK_VALID_SUBMISSION_PARAMS.form.title} (Ref: ${MOCK_VALID_SUBMISSION_PARAMS.submission.id})`,
        html: MOCK_HTML,
        attachments: MOCK_VALID_SUBMISSION_PARAMS.attachments,
        headers: {
          // Hardcode in tests in case something changes this.
          'X-Formsg-Email-Type': 'Admin (response)',
          'X-Formsg-Form-ID': MOCK_VALID_SUBMISSION_PARAMS.form._id,
          'X-Formsg-Submission-ID': MOCK_VALID_SUBMISSION_PARAMS.submission.id,
        },
        replyTo: MOCK_VALID_SUBMISSION_PARAMS.replyToEmails.join(', '),
      }

      // Act + Assert
      await expect(
        mailService.sendSubmissionToAdmin(MOCK_VALID_SUBMISSION_PARAMS),
      ).resolves.toEqual(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should send submission mail to admin successfully if adminEmail is an array', async () => {
      // Arrange
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const adminEmailArray = [MOCK_VALID_EMAIL, MOCK_VALID_EMAIL_2]
      const modifiedParams = {
        ...MOCK_VALID_SUBMISSION_PARAMS,
        adminEmails: adminEmailArray,
      }

      const expectedArgument = {
        to: adminEmailArray,
        from: MOCK_SENDER_STRING,
        subject: `formsg-auto: ${MOCK_VALID_SUBMISSION_PARAMS.form.title} (Ref: ${MOCK_VALID_SUBMISSION_PARAMS.submission.id})`,
        html: MOCK_HTML,
        attachments: MOCK_VALID_SUBMISSION_PARAMS.attachments,
        headers: {
          // Hardcode in tests in case something changes this.
          'X-Formsg-Email-Type': 'Admin (response)',
          'X-Formsg-Form-ID': MOCK_VALID_SUBMISSION_PARAMS.form._id,
          'X-Formsg-Submission-ID': MOCK_VALID_SUBMISSION_PARAMS.submission.id,
        },
        replyTo: MOCK_VALID_SUBMISSION_PARAMS.replyToEmails.join(', '),
      }
      // Act + Assert
      await expect(
        mailService.sendSubmissionToAdmin(modifiedParams),
      ).resolves.toEqual(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should reject with error when adminEmail param is an invalid email string', async () => {
      // Arrange
      const invalidParams = {
        ...MOCK_VALID_SUBMISSION_PARAMS,
        adminEmails: 'notAnEmail',
      }
      // Act + Assert
      await expect(
        mailService.sendSubmissionToAdmin(invalidParams),
      ).rejects.toThrowError('Invalid email error')
    })

    it('should reject with error when adminEmail param is an empty array', async () => {
      // Arrange
      const invalidParams = {
        ...MOCK_VALID_SUBMISSION_PARAMS,
        adminEmails: [],
      }
      // Act + Assert
      await expect(
        mailService.sendSubmissionToAdmin(invalidParams),
      ).rejects.toThrowError('Mail undefined error')
    })

    it('should reject with error when adminEmail param array contains invalid emails', async () => {
      // Arrange
      const invalidParams = {
        ...MOCK_VALID_SUBMISSION_PARAMS,
        adminEmails: [MOCK_VALID_EMAIL, 'thisIsInvalidEmail'],
      }
      // Act + Assert
      await expect(
        mailService.sendSubmissionToAdmin(invalidParams),
      ).rejects.toThrowError('Invalid email error')
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
      } as IPopulatedForm,
      submission: ({
        id: 'mockSubmissionId',
      } as unknown) as ISubmissionSchema,
      attachments: ['something'] as Attachment[],
      autoReplyData: {
        email: MOCK_VALID_EMAIL_2,
      },
      index: 10,
    }

    const DEFAULT_EXPECTED_ARG = {
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
    }

    it('should send autoreply mail successfully with defaults', async () => {
      // Arrange
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      // Act + Assert
      await expect(
        mailService.sendAutoReplyEmail(MOCK_AUTOREPLY_PARAMS),
      ).resolves.toEqual(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(DEFAULT_EXPECTED_ARG)
    })

    it('should send autoreply mail successfully with custom autoreply subject', async () => {
      // Arrange
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const customSubject = 'customSubject'
      const customDataParams = merge(
        { autoReplyData: { subject: customSubject } },
        MOCK_AUTOREPLY_PARAMS,
      )

      const expectedArg = { ...DEFAULT_EXPECTED_ARG, subject: customSubject }

      // Act + Assert
      await expect(
        mailService.sendAutoReplyEmail(customDataParams),
      ).resolves.toEqual(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should send autoreply mail successfully with custom autoreply sender', async () => {
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const customSender = 'customSender@example.com'
      const customDataParams = merge(
        { autoReplyData: { sender: customSender } },
        MOCK_AUTOREPLY_PARAMS,
      )

      const expectedArg = {
        ...DEFAULT_EXPECTED_ARG,
        from: `${customSender} <${MOCK_SENDER_EMAIL}>`,
      }

      // Act + Assert
      await expect(
        mailService.sendAutoReplyEmail(customDataParams),
      ).resolves.toEqual(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should send autoreply mail with attachment if autoReply.includeFormSummary is true', async () => {
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const customDataParams = merge(
        { autoReplyData: { includeFormSummary: true } },
        MOCK_AUTOREPLY_PARAMS,
      )

      const expectedArg = {
        ...DEFAULT_EXPECTED_ARG,
        attachments: MOCK_AUTOREPLY_PARAMS.attachments,
      }

      // Act + Assert
      await expect(
        mailService.sendAutoReplyEmail(customDataParams),
      ).resolves.toEqual(mockedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should reject with error when autoReplyData.email param is an invalid email', async () => {
      // Arrange
      const invalidDataParams = merge({}, MOCK_AUTOREPLY_PARAMS, {
        autoReplyData: { email: 'notAnEmail' },
      })

      // Act + Assert
      await expect(
        mailService.sendAutoReplyEmail(invalidDataParams),
      ).rejects.toThrowError('Invalid email error')
    })
  })
})
