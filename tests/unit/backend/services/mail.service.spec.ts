import { cloneDeep } from 'lodash'
import moment from 'moment-timezone'
import Mail, { Attachment } from 'nodemailer/lib/mailer'
import { ImportMock } from 'ts-mock-imports'

import {
  AutoreplySummaryRenderData,
  MailService,
  SendAutoReplyEmailsArgs,
} from 'src/app/services/mail.service'
import * as MailUtils from 'src/app/utils/mail'
import { IPopulatedForm, ISubmissionSchema } from 'src/types'

const MOCK_VALID_EMAIL = 'to@example.com'
const MOCK_VALID_EMAIL_2 = 'to2@example.com'
const MOCK_VALID_EMAIL_3 = 'to3@example.com'
const MOCK_VALID_EMAIL_4 = 'to4@example.com'
const MOCK_VALID_EMAIL_5 = 'to5@example.com'
const MOCK_SENDER_EMAIL = 'from@example.com'
const MOCK_APP_NAME = 'mockApp'
const MOCK_APP_URL = 'mockApp.example.com'
const MOCK_SENDER_STRING = `${MOCK_APP_NAME} <${MOCK_SENDER_EMAIL}>`
const MOCK_PDF = 'fake pdf'

const MOCK_RETRY_COUNT = 10

describe('mail.service', () => {
  const sendMailSpy = jest.fn()
  const mockTransporter = ({
    sendMail: sendMailSpy,
  } as unknown) as Mail

  // Set up mocks for MailUtils
  beforeAll(() => {
    ImportMock.mockFunction(MailUtils, 'generateAutoreplyPdf', MOCK_PDF)
  })
  beforeEach(() => sendMailSpy.mockReset())
  afterAll(() => ImportMock.restore())

  const mailService = new MailService({
    transporter: mockTransporter,
    senderMail: MOCK_SENDER_EMAIL,
    appName: MOCK_APP_NAME,
    appUrl: MOCK_APP_URL,
    // Set for instant timeouts during testing.
    retryParams: { retries: MOCK_RETRY_COUNT, minTimeout: 0, factor: 2 },
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
        html: MailUtils.generateVerificationOtpHtml({
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

    it('should autoretry when error is thrown by sendNodeMail and pass if second try passes', async () => {
      // Arrange
      // sendMail should return mocked success response
      const mockedResponse = 'mockedSuccessResponse'
      const mockReject = 'something happened oh no'
      sendMailSpy
        .mockRejectedValueOnce(mockReject)
        .mockReturnValueOnce(mockedResponse)

      const expectedArgument = {
        to: MOCK_VALID_EMAIL,
        from: MOCK_SENDER_STRING,
        subject: `Your OTP for submitting a form on ${MOCK_APP_NAME}`,
        html: MailUtils.generateVerificationOtpHtml({
          appName: MOCK_APP_NAME,
          otp: MOCK_OTP,
          minutesToExpiry: 10,
        }),
        headers: {
          // Hardcode in tests in case something changes this.
          'X-Formsg-Email-Type': 'Verification OTP',
        },
      }

      // Act
      const pendingSendVerification = mailService.sendVerificationOtp(
        MOCK_VALID_EMAIL,
        MOCK_OTP,
      )

      // Act + Assert
      await expect(pendingSendVerification).resolves.toEqual(mockedResponse)
      // Check arguments passed to sendNodeMail
      // Should have been called two times since it rejected the first one and
      // resolved
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should autoreply MOCK_RETRY_COUNT times and return error when all retries fail', async () => {
      // Arrange
      const mockReject = 'something happened oh no'
      sendMailSpy.mockRejectedValue(mockReject)

      const expectedArgument = {
        to: MOCK_VALID_EMAIL,
        from: MOCK_SENDER_STRING,
        subject: `Your OTP for submitting a form on ${MOCK_APP_NAME}`,
        html: MailUtils.generateVerificationOtpHtml({
          appName: MOCK_APP_NAME,
          otp: MOCK_OTP,
          minutesToExpiry: 10,
        }),
        headers: {
          // Hardcode in tests in case something changes this.
          'X-Formsg-Email-Type': 'Verification OTP',
        },
      }

      // Act
      const pendingSendVerification = mailService.sendVerificationOtp(
        MOCK_VALID_EMAIL,
        MOCK_OTP,
      )

      // Act + Assert
      await expect(pendingSendVerification).rejects.toEqual(mockReject)
      // Check arguments passed to sendNodeMail
      // Should have been called MOCK_RETRY_COUNT + 1 times
      expect(sendMailSpy).toHaveBeenCalledTimes(MOCK_RETRY_COUNT + 1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })
  })

  describe('sendLoginOtp', () => {
    const MOCK_OTP = '123456'
    const MOCK_IP = 'mock:5000'
    it('should send login otp successfully', async () => {
      // Arrange
      // sendMail should return mocked success response
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const expectedArgument = {
        to: MOCK_VALID_EMAIL,
        from: MOCK_SENDER_STRING,
        subject: `One-Time Password (OTP) for ${MOCK_APP_NAME}`,
        html: await MailUtils.generateLoginOtpHtml({
          otp: MOCK_OTP,
          appName: MOCK_APP_NAME,
          appUrl: MOCK_APP_URL,
          ipAddress: MOCK_IP,
        }),
        headers: {
          // Hardcode in tests in case something changes this.
          'X-Formsg-Email-Type': 'Login OTP',
        },
      }

      // Act + Assert
      await expect(
        mailService.sendLoginOtp({
          recipient: MOCK_VALID_EMAIL,
          otp: MOCK_OTP,
          ipAddress: MOCK_IP,
        }),
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
    let expectedHtml: string

    const MOCK_VALID_SUBMISSION_PARAMS = {
      replyToEmails: ['test1@example.com', 'test2@example.com'],
      form: {
        title: 'Test form title',
        _id: 'mockFormId',
        emails: [MOCK_VALID_EMAIL],
      },
      submission: {
        id: 'mockSubmissionId',
        created: new Date(),
      },
      attachments: [],
      jsonData: [
        {
          question: 'some question',
          answer: 'some answer',
        },
      ],
      formData: [],
    }

    const FORMATTED_SUBMISSION_TIME = moment(
      MOCK_VALID_SUBMISSION_PARAMS.submission.created,
    )
      .tz('Asia/Singapore')
      .format('ddd, DD MMM YYYY hh:mm:ss A')

    // Should include the metadata in the front.
    const EXPECTED_JSON_DATA = [
      {
        question: 'Reference Number',
        answer: MOCK_VALID_SUBMISSION_PARAMS.submission.id,
      },
      {
        question: 'Timestamp',
        answer: FORMATTED_SUBMISSION_TIME,
      },
      ...MOCK_VALID_SUBMISSION_PARAMS.jsonData,
    ]

    beforeAll(async () => {
      const htmlData = {
        appName: MOCK_APP_NAME,
        formData: MOCK_VALID_SUBMISSION_PARAMS.formData,
        formTitle: MOCK_VALID_SUBMISSION_PARAMS.form.title,
        jsonData: EXPECTED_JSON_DATA,
        refNo: MOCK_VALID_SUBMISSION_PARAMS.submission.id,
        submissionTime: FORMATTED_SUBMISSION_TIME,
      }
      expectedHtml = await MailUtils.generateSubmissionToAdminHtml(htmlData)
    })

    it('should send submission mail to admin successfully if form.emails is an array with a single string', async () => {
      // sendMail should return mocked success response
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const expectedArgument = {
        to: MOCK_VALID_SUBMISSION_PARAMS.form.emails,
        from: MOCK_SENDER_STRING,
        subject: `formsg-auto: ${MOCK_VALID_SUBMISSION_PARAMS.form.title} (Ref: ${MOCK_VALID_SUBMISSION_PARAMS.submission.id})`,
        html: expectedHtml,
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

    it('should send submission mail to admin successfully if form.emails is an array with a single comma separated string', async () => {
      // sendMail should return mocked success response
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const formEmailsCommaSeparated = [
        `${MOCK_VALID_EMAIL}, ${MOCK_VALID_EMAIL_2}`,
      ]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formEmailsCommaSeparated

      const expectedArgument = {
        to: formEmailsCommaSeparated,
        from: MOCK_SENDER_STRING,
        subject: `formsg-auto: ${MOCK_VALID_SUBMISSION_PARAMS.form.title} (Ref: ${MOCK_VALID_SUBMISSION_PARAMS.submission.id})`,
        html: expectedHtml,
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

    it('should send submission mail to admin successfully if form.emails is an array with multiple emails', async () => {
      // Arrange
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const formMultipleEmailsArray = [MOCK_VALID_EMAIL, MOCK_VALID_EMAIL_2]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formMultipleEmailsArray

      const expectedArgument = {
        to: formMultipleEmailsArray,
        from: MOCK_SENDER_STRING,
        subject: `formsg-auto: ${MOCK_VALID_SUBMISSION_PARAMS.form.title} (Ref: ${MOCK_VALID_SUBMISSION_PARAMS.submission.id})`,
        html: expectedHtml,
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

    it('should send submission mail to admin successfully if form.emails is an array with a mixture of emails and comma separated emails strings', async () => {
      // Arrange
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const formEmailsMixture = [
        `${MOCK_VALID_EMAIL}, ${MOCK_VALID_EMAIL_2}`,
        MOCK_VALID_EMAIL_3,
      ]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formEmailsMixture

      const expectedArgument = {
        to: formEmailsMixture,
        from: MOCK_SENDER_STRING,
        subject: `formsg-auto: ${MOCK_VALID_SUBMISSION_PARAMS.form.title} (Ref: ${MOCK_VALID_SUBMISSION_PARAMS.submission.id})`,
        html: expectedHtml,
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

    it('should send submission mail to admin successfully if form.emails is an array with a mixture of emails, semi-colon, and comma separated emails strings', async () => {
      // Arrange
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const formEmailsMixture = [
        `${MOCK_VALID_EMAIL}, ${MOCK_VALID_EMAIL_2}`,
        `${MOCK_VALID_EMAIL_4};${MOCK_VALID_EMAIL_5},    ${MOCK_VALID_EMAIL_3}`,
      ]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formEmailsMixture

      const expectedArgument = {
        to: formEmailsMixture,
        from: MOCK_SENDER_STRING,
        subject: `formsg-auto: ${MOCK_VALID_SUBMISSION_PARAMS.form.title} (Ref: ${MOCK_VALID_SUBMISSION_PARAMS.submission.id})`,
        html: expectedHtml,
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

    it('should reject with error when form.emails array contains an invalid email string', async () => {
      // Arrange
      const invalidParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      invalidParams.form.emails = ['notAnEmail', MOCK_VALID_EMAIL]

      // Act + Assert
      await expect(
        mailService.sendSubmissionToAdmin(invalidParams),
      ).rejects.toThrowError('Invalid email error')
    })

    it('should reject with error when form.emails param is an empty array', async () => {
      // Arrange
      const invalidParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      invalidParams.form.emails = []
      // Act + Assert
      await expect(
        mailService.sendSubmissionToAdmin(invalidParams),
      ).rejects.toThrowError('Mail undefined error')
    })
  })

  describe('sendAutoReplyEmails', () => {
    let defaultHtml: string
    let defaultExpectedArg

    const MOCK_SENDER_NAME = 'John Doe'
    const MOCK_AUTOREPLY_PARAMS: SendAutoReplyEmailsArgs = {
      form: {
        title: 'Test form title',
        _id: 'mockFormId',
        admin: {
          agency: {
            fullName: MOCK_SENDER_NAME,
          },
        },
      } as IPopulatedForm,
      submission: {
        id: 'mockSubmissionId',
        created: new Date(),
      } as ISubmissionSchema,
      responsesData: [
        {
          question: 'some question',
          answerTemplate: ['some answer template'],
        },
      ],
      attachments: ['something'] as Attachment[],
      autoReplyMailDatas: [
        {
          email: MOCK_VALID_EMAIL_2,
        },
      ],
    }
    const DEFAULT_AUTO_REPLY_BODY = `Dear Sir or Madam,\n\nThank you for submitting this form.\n\nRegards,\n${MOCK_AUTOREPLY_PARAMS.form.admin.agency.fullName}`.split(
      '\n',
    )

    beforeAll(async () => {
      defaultHtml = await MailUtils.generateAutoreplyHtml({
        autoReplyBody: DEFAULT_AUTO_REPLY_BODY,
      })

      defaultExpectedArg = {
        to: MOCK_AUTOREPLY_PARAMS.autoReplyMailDatas[0].email,
        from: `${MOCK_AUTOREPLY_PARAMS.form.admin.agency.fullName} <${MOCK_SENDER_EMAIL}>`,
        subject: `Thank you for submitting ${MOCK_AUTOREPLY_PARAMS.form.title}`,
        html: defaultHtml,
        headers: {
          // Hardcode in tests in case something changes this.
          'X-Formsg-Email-Type': 'Email confirmation',
          'X-Formsg-Form-ID': MOCK_AUTOREPLY_PARAMS.form._id,
          'X-Formsg-Submission-ID': MOCK_AUTOREPLY_PARAMS.submission.id,
        },
        // Note this should be by default empty
        attachments: [],
      }
    })

    it('should send single autoreply mail successfully with defaults', async () => {
      // Arrange
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      // Act + Assert
      const expectedResponse = await Promise.allSettled([
        Promise.resolve(mockedResponse),
      ])
      await expect(
        mailService.sendAutoReplyEmails(MOCK_AUTOREPLY_PARAMS),
      ).resolves.toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(defaultExpectedArg)
    })

    it('should send array of multiple autoreply mails successfully with defaults', async () => {
      const firstMockedResponse = 'mockedSuccessResponse1'
      const secondMockedResponse = 'mockedSuccessResponse1'
      sendMailSpy
        .mockResolvedValueOnce(firstMockedResponse)
        .mockResolvedValueOnce(secondMockedResponse)

      const multipleEmailParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      multipleEmailParams.autoReplyMailDatas.push({
        email: MOCK_VALID_EMAIL_3,
      })

      const secondExpectedArg = cloneDeep(defaultExpectedArg)
      secondExpectedArg.to = MOCK_VALID_EMAIL_3

      // Act + Assert
      const expectedResponse = await Promise.allSettled([
        Promise.resolve(firstMockedResponse),
        Promise.resolve(secondMockedResponse),
      ])
      await expect(
        mailService.sendAutoReplyEmails(multipleEmailParams),
      ).resolves.toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenNthCalledWith(1, defaultExpectedArg)
      // Second call should be for a different email
      expect(sendMailSpy).toHaveBeenNthCalledWith(2, secondExpectedArg)
    })

    it('should send single autoreply mail successfully with custom autoreply subject', async () => {
      // Arrange
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const customSubject = 'customSubject'
      const customDataParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      customDataParams.autoReplyMailDatas[0].subject = customSubject

      const expectedArg = { ...defaultExpectedArg, subject: customSubject }

      // Act + Assert
      const expectedResponse = await Promise.allSettled([
        Promise.resolve(mockedResponse),
      ])
      await expect(
        mailService.sendAutoReplyEmails(customDataParams),
      ).resolves.toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should send single autoreply mail successfully with custom autoreply sender', async () => {
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const customSender = 'customSender@example.com'
      const customDataParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      customDataParams.autoReplyMailDatas[0].sender = customSender

      const expectedArg = {
        ...defaultExpectedArg,
        from: `${customSender} <${MOCK_SENDER_EMAIL}>`,
      }

      // Act + Assert
      const expectedResponse = await Promise.allSettled([
        Promise.resolve(mockedResponse),
      ])
      await expect(
        mailService.sendAutoReplyEmails(customDataParams),
      ).resolves.toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should send single autoreply mail with attachment if autoReply.includeFormSummary is true', async () => {
      // Arrange
      const mockedResponse = 'mockedSuccessResponse'
      sendMailSpy.mockResolvedValueOnce(mockedResponse)

      const customDataParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      customDataParams.autoReplyMailDatas[0].includeFormSummary = true

      const expectedRenderData: AutoreplySummaryRenderData = {
        formData: MOCK_AUTOREPLY_PARAMS.responsesData,
        formTitle: MOCK_AUTOREPLY_PARAMS.form.title,
        formUrl: `${MOCK_APP_URL}/${MOCK_AUTOREPLY_PARAMS.form._id}`,
        refNo: MOCK_AUTOREPLY_PARAMS.submission.id,
        submissionTime: moment(MOCK_AUTOREPLY_PARAMS.submission.created)
          .tz('Asia/Singapore')
          .format('ddd, DD MMM YYYY hh:mm:ss A'),
      }
      const expectedMailBody = await MailUtils.generateAutoreplyHtml({
        autoReplyBody: DEFAULT_AUTO_REPLY_BODY,
        ...expectedRenderData,
      })

      const expectedArg = {
        ...defaultExpectedArg,
        html: expectedMailBody,
        // Attachments should be concatted with mock pdf response
        attachments: [
          ...MOCK_AUTOREPLY_PARAMS.attachments,
          {
            content: MOCK_PDF,
            filename: 'response.pdf',
          },
        ],
      }

      // Act + Assert
      const expectedResponse = await Promise.allSettled([
        Promise.resolve(mockedResponse),
      ])
      await expect(
        mailService.sendAutoReplyEmails(customDataParams),
      ).resolves.toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should reject with error when autoReplyData.email param is an invalid email', async () => {
      // Arrange
      const invalidDataParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      invalidDataParams.autoReplyMailDatas[0].email = 'notAnEmail'

      // Act + Assert
      const expectedResponse = await Promise.allSettled([
        Promise.reject(Error('Invalid email error')),
      ])
      await expect(
        mailService.sendAutoReplyEmails(invalidDataParams),
      ).resolves.toEqual(expectedResponse)
    })
  })
})
