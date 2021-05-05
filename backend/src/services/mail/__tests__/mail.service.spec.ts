import { cloneDeep } from 'lodash'
import moment from 'moment-timezone'
import { err, ok, okAsync } from 'neverthrow'
import Mail, { Attachment } from 'nodemailer/lib/mailer'

import { MailSendError } from 'services/mail/mail.errors'
import { MailService } from 'services/mail/mail.service'
import {
  AutoreplySummaryRenderData,
  MailOptions,
  SendAutoReplyEmailsArgs,
} from 'services/mail/mail.types'
import * as MailUtils from 'services/mail/mail.utils'
import { BounceType, IPopulatedForm, ISubmissionSchema } from '@root/types'

const MOCK_VALID_EMAIL = 'to@example.com'
const MOCK_VALID_EMAIL_2 = 'to2@example.com'
const MOCK_VALID_EMAIL_3 = 'to3@example.com'
const MOCK_VALID_EMAIL_4 = 'to4@example.com'
const MOCK_VALID_EMAIL_5 = 'to5@example.com'
const MOCK_SENDER_EMAIL = 'from@example.com'
const MOCK_APP_NAME = 'mockApp'
const MOCK_APP_URL = 'mockApp.example.com'
const MOCK_SENDER_STRING = `${MOCK_APP_NAME} <${MOCK_SENDER_EMAIL}>`
const MOCK_PDF = Buffer.from('fake pdf')

const MOCK_RETRY_COUNT = 10

describe('mail.service', () => {
  const sendMailSpy = jest.fn()
  const mockTransporter = ({
    sendMail: sendMailSpy,
  } as unknown) as Mail

  // Set up mocks for MailUtils
  beforeAll(() => {
    jest
      .spyOn(MailUtils, 'generateAutoreplyPdf')
      .mockReturnValue(okAsync(MOCK_PDF))
  })
  beforeEach(() => sendMailSpy.mockReset())

  const mailService = new MailService({
    transporter: mockTransporter,
    senderMail: MOCK_SENDER_EMAIL,
    appName: MOCK_APP_NAME,
    appUrl: MOCK_APP_URL,
    // Set for instant timeouts during testing.
    retryParams: { retries: MOCK_RETRY_COUNT, minTimeout: 0, factor: 2 },
  })

  describe('Constructor', () => {
    it('should throw error when invalid senderMail param is passed', () => {
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

    const generateExpectedArg = async () => {
      return {
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
    }

    it('should send verification otp successfully', async () => {
      // Arrange
      // sendMail should return mocked success response
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      const expectedArgument = await generateExpectedArg()

      // Act
      const actualResult = await mailService.sendVerificationOtp(
        MOCK_VALID_EMAIL,
        MOCK_OTP,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should reject with error when email is invalid', async () => {
      // Arrange
      const invalidEmail = 'notAnEmail'

      // Act
      const actualResult = await mailService.sendVerificationOtp(
        invalidEmail,
        MOCK_OTP,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MailSendError('Invalid email error'),
      )
    })

    it('should autoretry when 4xx error is thrown by sendNodeMail and pass if second try passes', async () => {
      // Arrange
      // sendMail should return mocked success response
      const mock4xxReject = {
        responseCode: 454,
        message: 'oh no something went wrong',
      }
      sendMailSpy
        .mockRejectedValueOnce(mock4xxReject)
        .mockResolvedValueOnce('mockedSuccessResponse')

      const expectedArgument = await generateExpectedArg()

      // Act
      const actualResult = await mailService.sendVerificationOtp(
        MOCK_VALID_EMAIL,
        MOCK_OTP,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      // Should have been called two times since it rejected the first one and
      // resolved
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should autoretry MOCK_RETRY_COUNT times and return error when all retries fail with 4xx errors', async () => {
      // Arrange
      const mock4xxReject = {
        responseCode: 413,
        message: 'oh no something went wrong',
      }
      sendMailSpy.mockRejectedValue(mock4xxReject)

      const expectedArgument = await generateExpectedArg()

      // Act
      const actualResult = await mailService.sendVerificationOtp(
        MOCK_VALID_EMAIL,
        MOCK_OTP,
      )

      // Assert
      const actualError = actualResult._unsafeUnwrapErr()
      // error equality does not check for existence of meta. Jest bug?
      expect(actualError).toEqual(new MailSendError('Failed to send mail'))
      expect(actualError.meta).toEqual({ originalError: mock4xxReject })

      // Check arguments passed to sendNodeMail
      // Should have been called MOCK_RETRY_COUNT + 1 times
      expect(sendMailSpy).toHaveBeenCalledTimes(MOCK_RETRY_COUNT + 1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should stop autoretrying when the returned error is not a 4xx error', async () => {
      // Arrange
      const mockError = new Error('this is not 4xx error')
      const mock4xxReject = {
        responseCode: 413,
        message: 'oh no something went wrong',
      }
      sendMailSpy
        .mockRejectedValueOnce(mock4xxReject)
        .mockRejectedValueOnce(mockError)

      const expectedArgument = await generateExpectedArg()

      // Act
      const actualResult = await mailService.sendVerificationOtp(
        MOCK_VALID_EMAIL,
        MOCK_OTP,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MailSendError('Failed to send mail'),
      )
      // Check arguments passed to sendNodeMail
      // Should retry two times and stop since the second rejected value is
      // non-4xx error.
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })
  })

  describe('sendLoginOtp', () => {
    const MOCK_OTP = '123456'
    const MOCK_IP = 'mock:5000'

    const generateExpectedArg = async () => {
      return {
        to: MOCK_VALID_EMAIL,
        from: MOCK_SENDER_STRING,
        subject: `One-Time Password (OTP) for ${MOCK_APP_NAME}`,
        html: (
          await MailUtils.generateLoginOtpHtml({
            otp: MOCK_OTP,
            appName: MOCK_APP_NAME,
            appUrl: MOCK_APP_URL,
            ipAddress: MOCK_IP,
          })
        )._unsafeUnwrap(),
        headers: {
          // Hardcode in tests in case something changes this.
          'X-Formsg-Email-Type': 'Login OTP',
        },
      }
    }

    it('should send login otp successfully', async () => {
      // Arrange
      // sendMail should return mocked success response
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      const expectedArgument = await generateExpectedArg()

      // Act
      const actualResult = await mailService.sendLoginOtp({
        recipient: MOCK_VALID_EMAIL,
        otp: MOCK_OTP,
        ipAddress: MOCK_IP,
      })

      // Assert
      expect(actualResult.isOk()).toBe(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should return a MailSendError when email is invalid', async () => {
      // Arrange
      const invalidEmail = 'notAnEmail'

      // Act
      const actualResult = await mailService.sendLoginOtp({
        recipient: invalidEmail,
        otp: MOCK_OTP,
        ipAddress: MOCK_IP,
      })
      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MailSendError('Invalid email error'),
      )
    })

    it('should autoretry when 4xx error is thrown by sendNodeMail and pass if second try passes', async () => {
      // Arrange
      // sendMail should return mocked success response
      const mock4xxReject = {
        responseCode: 454,
        message: 'oh no something went wrong',
      }
      sendMailSpy
        .mockRejectedValueOnce(mock4xxReject)
        .mockResolvedValueOnce('mockedSuccessResponse')

      const expectedArgument = await generateExpectedArg()

      // Act
      const actualResult = await mailService.sendLoginOtp({
        recipient: MOCK_VALID_EMAIL,
        otp: MOCK_OTP,
        ipAddress: MOCK_IP,
      })

      // Assert
      expect(actualResult.isOk()).toBe(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      // Should have been called two times since it rejected the first one and
      // resolved
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should autoretry MOCK_RETRY_COUNT times and return error when all retries fail with 4xx errors', async () => {
      // Arrange
      const mock4xxReject = {
        responseCode: 454,
        message: 'oh no something went wrong',
      }
      sendMailSpy.mockRejectedValue(mock4xxReject)

      const expectedArgument = await generateExpectedArg()

      // Act
      const actualResult = await mailService.sendLoginOtp({
        recipient: MOCK_VALID_EMAIL,
        otp: MOCK_OTP,
        ipAddress: MOCK_IP,
      })

      // Assert
      const actualError = actualResult._unsafeUnwrapErr()
      expect(actualError).toEqual(new MailSendError('Failed to send mail'))
      expect(actualError.meta).toEqual({ originalError: mock4xxReject })
      // Check arguments passed to sendNodeMail
      // Should have been called MOCK_RETRY_COUNT + 1 times
      expect(sendMailSpy).toHaveBeenCalledTimes(MOCK_RETRY_COUNT + 1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should stop autoretrying when the returned error is not a 4xx error', async () => {
      // Arrange
      const mockError = new Error('this should be returned at the end')
      const mock4xxReject = {
        responseCode: 413,
        message: 'oh no something went wrong',
      }
      sendMailSpy
        .mockRejectedValueOnce(mock4xxReject)
        .mockRejectedValueOnce(mockError)

      const expectedArgument = await generateExpectedArg()

      // Act
      const actualResult = await mailService.sendLoginOtp({
        recipient: MOCK_VALID_EMAIL,
        otp: MOCK_OTP,
        ipAddress: MOCK_IP,
      })

      // Assert
      const actualError = actualResult._unsafeUnwrapErr()
      expect(actualError).toEqual(new MailSendError('Failed to send mail'))
      // Should not be the 4xx error but the final error.
      expect(actualError.meta).toEqual({ originalError: mockError })
      // Check arguments passed to sendNodeMail
      // Should only invoke two times and stop since the second rejected value
      // is non-4xx error.
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
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
      dataCollationData: [
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
      ...MOCK_VALID_SUBMISSION_PARAMS.dataCollationData,
    ]

    const generateExpectedArgWithToField = (toField: string[]) => {
      return {
        to: toField,
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
    }

    beforeAll(async () => {
      const htmlData = {
        appName: MOCK_APP_NAME,
        formData: MOCK_VALID_SUBMISSION_PARAMS.formData,
        formTitle: MOCK_VALID_SUBMISSION_PARAMS.form.title,
        dataCollationData: EXPECTED_JSON_DATA,
        refNo: MOCK_VALID_SUBMISSION_PARAMS.submission.id,
        submissionTime: FORMATTED_SUBMISSION_TIME,
      }
      expectedHtml = (
        await MailUtils.generateSubmissionToAdminHtml(htmlData)
      )._unsafeUnwrap()
    })

    it('should send submission mail to admin successfully if form.emails is an array with a single string', async () => {
      // Arrange
      // sendMail should return mocked success response
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      const expectedArgument = generateExpectedArgWithToField(
        MOCK_VALID_SUBMISSION_PARAMS.form.emails,
      )

      // Act
      const actualResult = await mailService.sendSubmissionToAdmin(
        MOCK_VALID_SUBMISSION_PARAMS,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should send submission mail to admin successfully if form.emails is an array with a single comma separated string', async () => {
      // Arrange
      // sendMail should return mocked success response
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      const formEmailsCommaSeparated = [
        `${MOCK_VALID_EMAIL}, ${MOCK_VALID_EMAIL_2}`,
      ]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formEmailsCommaSeparated

      const expectedArgument = generateExpectedArgWithToField(
        formEmailsCommaSeparated,
      )

      // Act
      const actualResult = await mailService.sendSubmissionToAdmin(
        modifiedParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should send submission mail to admin successfully if form.emails is an array with multiple emails', async () => {
      // Arrange
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      const formMultipleEmailsArray = [MOCK_VALID_EMAIL, MOCK_VALID_EMAIL_2]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formMultipleEmailsArray

      const expectedArgument = generateExpectedArgWithToField(
        formMultipleEmailsArray,
      )

      // Act
      const actualResult = await mailService.sendSubmissionToAdmin(
        modifiedParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should send submission mail to admin successfully if form.emails is an array with a mixture of emails and comma separated emails strings', async () => {
      // Arrange
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      const formEmailsMixture = [
        `${MOCK_VALID_EMAIL}, ${MOCK_VALID_EMAIL_2}`,
        MOCK_VALID_EMAIL_3,
      ]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formEmailsMixture

      const expectedArgument = generateExpectedArgWithToField(formEmailsMixture)

      // Act
      const actualResult = await mailService.sendSubmissionToAdmin(
        modifiedParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should return MailSendError when if form.emails is an array with a mixture of emails, semi-colon, and comma separated emails strings', async () => {
      // Arrange
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      const formEmailsMixture = [
        `${MOCK_VALID_EMAIL}, ${MOCK_VALID_EMAIL_2}`,
        `${MOCK_VALID_EMAIL_4};${MOCK_VALID_EMAIL_5},    ${MOCK_VALID_EMAIL_3}`,
      ]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formEmailsMixture

      // Act
      const actualResult = await mailService.sendSubmissionToAdmin(
        modifiedParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MailSendError('Invalid email error'),
      )
    })

    it('should return MailSendError when form.emails array contains an invalid email string', async () => {
      // Arrange
      const invalidParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      invalidParams.form.emails = ['notAnEmail', MOCK_VALID_EMAIL]

      // Act
      const actualResult = await mailService.sendSubmissionToAdmin(
        invalidParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MailSendError('Invalid email error'),
      )
    })

    it('should return MailSendError when form.emails param is an empty array', async () => {
      // Arrange
      const invalidParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      invalidParams.form.emails = []

      // Act
      const actualResult = await mailService.sendSubmissionToAdmin(
        invalidParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MailSendError('Mail undefined error'),
      )
    })

    it('should autoretry when 4xx error is thrown by sendNodeMail and pass if second try passes', async () => {
      // Arrange
      const mock4xxReject = {
        responseCode: 454,
        message: 'oh no something went wrong',
      }
      sendMailSpy
        .mockRejectedValueOnce(mock4xxReject)
        .mockResolvedValueOnce('mockedSuccessResponse')

      const formEmailsMixture = [
        `${MOCK_VALID_EMAIL}, ${MOCK_VALID_EMAIL_2}`,
        MOCK_VALID_EMAIL_3,
      ]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formEmailsMixture

      const expectedArgument = generateExpectedArgWithToField(formEmailsMixture)

      // Act
      const actualResult = await mailService.sendSubmissionToAdmin(
        modifiedParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      // Should have been called two times since it rejected the first one and
      // resolved
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should autoretry MOCK_RETRY_COUNT times and return error when all retries fail with 4xx errors', async () => {
      // Arrange
      const mock4xxReject = {
        responseCode: 400,
        message: 'oh no something went wrong',
      }
      sendMailSpy.mockRejectedValue(mock4xxReject)

      const formEmailsCommaSeparated = [
        `${MOCK_VALID_EMAIL}, ${MOCK_VALID_EMAIL_2}`,
      ]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formEmailsCommaSeparated

      const expectedArgument = generateExpectedArgWithToField(
        formEmailsCommaSeparated,
      )

      // Act
      const actualResult = await mailService.sendSubmissionToAdmin(
        modifiedParams,
      )

      // Assert
      const actualError = actualResult._unsafeUnwrapErr()
      expect(actualError).toEqual(new MailSendError('Failed to send mail'))
      expect(actualError.meta).toEqual({ originalError: mock4xxReject })
      // Check arguments passed to sendNodeMail
      // Should have been called MOCK_RETRY_COUNT + 1 times
      expect(sendMailSpy).toHaveBeenCalledTimes(MOCK_RETRY_COUNT + 1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })

    it('should stop autoretrying when the returned error is not a 4xx error', async () => {
      // Arrange
      const mockError = new Error('this is not a 4xx error')
      const mock4xxReject = {
        responseCode: 454,
        message: 'oh no something went wrong',
      }

      // Mock 4xx error then non 4xx error.
      sendMailSpy
        .mockRejectedValueOnce(mock4xxReject)
        .mockRejectedValueOnce(mockError)

      const formEmailsMixture = [
        `${MOCK_VALID_EMAIL}, ${MOCK_VALID_EMAIL_2}`,
        MOCK_VALID_EMAIL_3,
      ]
      const modifiedParams = cloneDeep(MOCK_VALID_SUBMISSION_PARAMS)
      modifiedParams.form.emails = formEmailsMixture

      const expectedArgument = generateExpectedArgWithToField(formEmailsMixture)

      // Act
      const actualResult = await mailService.sendSubmissionToAdmin(
        modifiedParams,
      )

      // Assert
      const actualError = actualResult._unsafeUnwrapErr()
      expect(actualError).toEqual(new MailSendError('Failed to send mail'))
      // Final error logged should be the non-4xx error.
      expect(actualError.meta).toEqual({ originalError: mockError })
      // Check arguments passed to sendNodeMail
      // Should retry two times and stop since the second rejected value is
      // non-4xx error.
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgument)
    })
  })

  describe('sendAutoReplyEmails', () => {
    let defaultHtml: string
    let defaultExpectedArg: MailOptions

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
      defaultHtml = (
        await MailUtils.generateAutoreplyHtml({
          autoReplyBody: DEFAULT_AUTO_REPLY_BODY,
        })
      )._unsafeUnwrap()

      defaultExpectedArg = {
        to: MOCK_AUTOREPLY_PARAMS.autoReplyMailDatas[0].email,
        from: `"${MOCK_AUTOREPLY_PARAMS.form.admin.agency.fullName}" <${MOCK_SENDER_EMAIL}>`,
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
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      const expectedResponse = await Promise.allSettled([ok(true)])

      // Act
      const actualResult = await mailService.sendAutoReplyEmails(
        MOCK_AUTOREPLY_PARAMS,
      )

      // Assert
      expect(actualResult).toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(defaultExpectedArg)
    })

    it('should send array of multiple autoreply mails successfully with defaults', async () => {
      // Arrange
      const firstMockedResponse = 'mockedSuccessResponse1'
      const secondMockedResponse = 'mockedSuccessResponse2'
      sendMailSpy
        .mockResolvedValueOnce(firstMockedResponse)
        .mockResolvedValueOnce(secondMockedResponse)

      const multipleEmailParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      multipleEmailParams.autoReplyMailDatas.push({
        email: MOCK_VALID_EMAIL_3,
      })

      const secondExpectedArg = cloneDeep(defaultExpectedArg)
      secondExpectedArg.to = MOCK_VALID_EMAIL_3

      const expectedResponse = await Promise.allSettled([ok(true), ok(true)])
      // Act
      const actualResult = await mailService.sendAutoReplyEmails(
        multipleEmailParams,
      )

      // Assert
      expect(actualResult).toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenNthCalledWith(1, defaultExpectedArg)
      // Second call should be for a different email
      expect(sendMailSpy).toHaveBeenNthCalledWith(2, secondExpectedArg)
    })

    it('should successfully continue sending of multiple autoreply mails with defaults even if some errors occur', async () => {
      // Arrange
      const firstMockedResponse = 'mockedSuccessResponse1'
      const secondMockedResponse = 'mockedSuccessResponse2'
      sendMailSpy
        .mockResolvedValueOnce(firstMockedResponse)
        .mockRejectedValueOnce(new Error('some fatal error'))
        .mockResolvedValueOnce(secondMockedResponse)

      const multipleEmailParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      multipleEmailParams.autoReplyMailDatas.push(
        { email: MOCK_VALID_EMAIL_3 },
        { email: MOCK_VALID_EMAIL_4 },
      )

      const secondExpectedArg = cloneDeep(defaultExpectedArg)
      secondExpectedArg.to = MOCK_VALID_EMAIL_3
      const thirdExpectedArg = cloneDeep(defaultExpectedArg)
      thirdExpectedArg.to = MOCK_VALID_EMAIL_4

      // Should have error intersped somewhere.
      const expectedResponse = await Promise.allSettled([
        ok(true),
        err(new MailSendError('Failed to send mail')),
        ok(true),
      ])

      // Act
      const actualResult = await mailService.sendAutoReplyEmails(
        multipleEmailParams,
      )

      // Assert
      expect(actualResult).toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(3)
      // Subsequent calls should be for different emails
      expect(sendMailSpy).toHaveBeenNthCalledWith(1, defaultExpectedArg)
      expect(sendMailSpy).toHaveBeenNthCalledWith(2, secondExpectedArg)
      expect(sendMailSpy).toHaveBeenNthCalledWith(3, thirdExpectedArg)
    })

    it('should send single autoreply mail successfully with custom autoreply subject', async () => {
      // Arrange
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      const customSubject = 'customSubject'
      const customDataParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      customDataParams.autoReplyMailDatas[0].subject = customSubject

      const expectedArg = { ...defaultExpectedArg, subject: customSubject }

      const expectedResponse = await Promise.allSettled([ok(true)])

      // Act
      const actualResult = await mailService.sendAutoReplyEmails(
        customDataParams,
      )

      // Assert
      expect(actualResult).toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should send single autoreply mail successfully with custom autoreply sender', async () => {
      // Arrange
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      const customSender = 'customSender@example.com'
      const customDataParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      customDataParams.autoReplyMailDatas[0].sender = customSender

      const expectedArg = {
        ...defaultExpectedArg,
        from: `"${customSender}" <${MOCK_SENDER_EMAIL}>`,
      }
      const expectedResponse = await Promise.allSettled([ok(true)])

      // Act
      const actualResult = await mailService.sendAutoReplyEmails(
        customDataParams,
      )

      // Assert
      expect(actualResult).toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should send single autoreply mail with attachment if autoReply.includeFormSummary is true', async () => {
      // Arrange
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

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
      const expectedMailBody = (
        await MailUtils.generateAutoreplyHtml({
          autoReplyBody: DEFAULT_AUTO_REPLY_BODY,
          ...expectedRenderData,
        })
      )._unsafeUnwrap()

      const expectedArg = {
        ...defaultExpectedArg,
        html: expectedMailBody,
        // Attachments should be concatted with mock pdf response
        attachments: [
          ...(MOCK_AUTOREPLY_PARAMS.attachments ?? []),
          {
            content: MOCK_PDF,
            filename: 'response.pdf',
          },
        ],
      }
      const expectedResponse = await Promise.allSettled([ok(true)])

      // Act
      const actualResult = await mailService.sendAutoReplyEmails(
        customDataParams,
      )

      // Assert
      expect(actualResult).toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should return MailSendError when autoReplyData.email param is an invalid email', async () => {
      // Arrange
      const invalidDataParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      invalidDataParams.autoReplyMailDatas[0].email = 'notAnEmail'

      // Act
      const actualResult = await mailService.sendAutoReplyEmails(
        invalidDataParams,
      )

      // Assert
      const expectedResponse = await Promise.allSettled([
        err(new MailSendError('Invalid email error')),
      ])
      expect(actualResult).toEqual(expectedResponse)
    })

    it('should autoretry when 4xx error is thrown by sendNodeMail and pass if second try passes', async () => {
      // Arrange
      const mock4xxReject = {
        responseCode: 454,
        message: 'oh no something went wrong',
      }
      sendMailSpy
        .mockRejectedValueOnce(mock4xxReject)
        .mockResolvedValueOnce('mockedSuccessResponse')

      const customSubject = 'customSubject'
      const customDataParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      customDataParams.autoReplyMailDatas[0].subject = customSubject

      const expectedArg = { ...defaultExpectedArg, subject: customSubject }
      const expectedResponse = await Promise.allSettled([ok(true)])

      // Act
      const actualResult = await mailService.sendAutoReplyEmails(
        customDataParams,
      )

      // Assert
      expect(actualResult).toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      // Should have been called two times since it rejected the first one and
      // resolved
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should autoretry MOCK_RETRY_COUNT times and return error when all retries fail with 4xx errors', async () => {
      // Arrange
      const mock4xxReject = {
        responseCode: 454,
        message: 'oh no something went wrong',
      }
      sendMailSpy.mockRejectedValue(mock4xxReject)

      const customSubject = 'customSubject'
      const customDataParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      customDataParams.autoReplyMailDatas[0].subject = customSubject

      const expectedArg = { ...defaultExpectedArg, subject: customSubject }

      // Act
      const actualResult = await mailService.sendAutoReplyEmails(
        customDataParams,
      )

      // Assert
      const expectedResponse = await Promise.allSettled([
        err(new MailSendError('Failed to send mail')),
      ])
      expect(actualResult).toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      // Should have been called MOCK_RETRY_COUNT + 1 times
      expect(sendMailSpy).toHaveBeenCalledTimes(MOCK_RETRY_COUNT + 1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })

    it('should stop autoretrying when the returned error is not a 4xx error', async () => {
      // Arrange
      const mockError = new Error('this should be returned at the end')
      const mock4xxReject = {
        responseCode: 413,
        message: 'oh no something went wrong',
      }
      sendMailSpy
        .mockRejectedValueOnce(mock4xxReject)
        .mockRejectedValueOnce(mockError)

      const customSubject = 'customSubject'
      const customDataParams = cloneDeep(MOCK_AUTOREPLY_PARAMS)
      customDataParams.autoReplyMailDatas[0].subject = customSubject

      const expectedArg = { ...defaultExpectedArg, subject: customSubject }

      // Act
      const actualResult = await mailService.sendAutoReplyEmails(
        customDataParams,
      )

      // Assert
      const expectedResponse = await Promise.allSettled([
        err(new MailSendError('Failed to send mail')),
      ])
      expect(actualResult).toEqual(expectedResponse)
      // Check arguments passed to sendNodeMail
      // Should only invoke two times and stop since the second rejected value
      // is non-4xx error.
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArg)
    })
  })

  describe('sendBounceNotification', () => {
    const MOCK_RECIPIENTS = [MOCK_VALID_EMAIL, MOCK_VALID_EMAIL_2]
    const MOCK_BOUNCED_EMAILS = [MOCK_VALID_EMAIL_3, MOCK_VALID_EMAIL_4]
    const MOCK_FORM_ID = 'mockFormId'
    const MOCK_FORM_TITLE = 'You are all individuals!'
    const MOCK_BOUNCE_TYPE = BounceType.Permanent

    const generateExpectedArg = async (bounceType: BounceType) => {
      return {
        to: MOCK_RECIPIENTS,
        from: MOCK_SENDER_STRING,
        subject: `[Urgent] FormSG Response Delivery Failure / Bounce`,
        html: (
          await MailUtils.generateBounceNotificationHtml(
            {
              appName: MOCK_APP_NAME,
              bouncedRecipients: MOCK_BOUNCED_EMAILS.join(', '),
              formLink: `${MOCK_APP_URL}/${MOCK_FORM_ID}`,
              formTitle: MOCK_FORM_TITLE,
            },
            bounceType,
          )
        )._unsafeUnwrap(),
        headers: {
          // Hardcode in tests in case something changes this.
          'X-Formsg-Email-Type': 'Admin (bounce notification)',
          'X-Formsg-Form-ID': MOCK_FORM_ID,
        },
      }
    }

    it('should send permanent bounce notification successfully', async () => {
      // Arrange
      // sendMail should return mocked success response
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      // Act
      const actualResult = await mailService.sendBounceNotification({
        emailRecipients: MOCK_RECIPIENTS,
        bounceType: BounceType.Permanent,
        bouncedRecipients: MOCK_BOUNCED_EMAILS,
        formId: MOCK_FORM_ID,
        formTitle: MOCK_FORM_TITLE,
      })
      const expectedArgs = await generateExpectedArg(BounceType.Permanent)
      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgs)
    })

    it('should send transient bounce notification successfully', async () => {
      // Arrange
      // sendMail should return mocked success response
      sendMailSpy.mockResolvedValueOnce('mockedSuccessResponse')

      // Act
      const actualResult = await mailService.sendBounceNotification({
        emailRecipients: MOCK_RECIPIENTS,
        bounceType: BounceType.Transient,
        bouncedRecipients: MOCK_BOUNCED_EMAILS,
        formId: MOCK_FORM_ID,
        formTitle: MOCK_FORM_TITLE,
      })
      const expectedArgs = await generateExpectedArg(BounceType.Transient)
      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      expect(sendMailSpy).toHaveBeenCalledTimes(1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgs)
    })

    it('should reject with error when email is invalid', async () => {
      // Arrange
      const invalidEmail = 'notAnEmail'

      // Act
      const actualResult = await mailService.sendBounceNotification({
        emailRecipients: [invalidEmail],
        bounceType: MOCK_BOUNCE_TYPE,
        bouncedRecipients: MOCK_BOUNCED_EMAILS,
        formId: MOCK_FORM_ID,
        formTitle: MOCK_FORM_TITLE,
      })

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MailSendError('Invalid email error'),
      )
    })

    it('should autoretry when 4xx error is thrown by sendNodeMail and pass if second try passes', async () => {
      // Arrange
      // sendMail should return mocked success response
      const mock4xxReject = {
        responseCode: 454,
        message: 'oh no something went wrong',
      }
      sendMailSpy
        .mockRejectedValueOnce(mock4xxReject)
        .mockResolvedValueOnce('mockedSuccessResponse')

      // Act
      const actualResult = await mailService.sendBounceNotification({
        emailRecipients: MOCK_RECIPIENTS,
        bounceType: MOCK_BOUNCE_TYPE,
        bouncedRecipients: MOCK_BOUNCED_EMAILS,
        formId: MOCK_FORM_ID,
        formTitle: MOCK_FORM_TITLE,
      })
      const expectedArgs = await generateExpectedArg(MOCK_BOUNCE_TYPE)

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      // Check arguments passed to sendNodeMail
      // Should have been called two times since it rejected the first one and
      // resolved
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenNthCalledWith(1, expectedArgs)
      expect(sendMailSpy).toHaveBeenNthCalledWith(2, expectedArgs)
    })

    it('should autoretry MOCK_RETRY_COUNT times and return error when all retries fail with 4xx errors', async () => {
      // Arrange
      const mock4xxReject = {
        responseCode: 413,
        message: 'oh no something went wrong',
      }
      sendMailSpy.mockRejectedValue(mock4xxReject)

      // Act
      const actualResult = await mailService.sendBounceNotification({
        emailRecipients: MOCK_RECIPIENTS,
        bounceType: MOCK_BOUNCE_TYPE,
        bouncedRecipients: MOCK_BOUNCED_EMAILS,
        formId: MOCK_FORM_ID,
        formTitle: MOCK_FORM_TITLE,
      })
      const expectedArgs = await generateExpectedArg(MOCK_BOUNCE_TYPE)

      // Assert
      const actualError = actualResult._unsafeUnwrapErr()
      expect(actualError).toEqual(new MailSendError('Failed to send mail'))
      expect(actualError.meta).toEqual({ originalError: mock4xxReject })
      // Check arguments passed to sendNodeMail
      // Should have been called MOCK_RETRY_COUNT + 1 times
      expect(sendMailSpy).toHaveBeenCalledTimes(MOCK_RETRY_COUNT + 1)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgs)
    })

    it('should stop autoretrying when the returned error is not a 4xx error', async () => {
      // Arrange
      const mockError = new Error('this should be returned at the end')
      const mock4xxReject = {
        responseCode: 413,
        message: 'oh no something went wrong',
      }
      sendMailSpy
        .mockRejectedValueOnce(mock4xxReject)
        .mockRejectedValueOnce(mockError)

      // Act
      const actualResult = await mailService.sendBounceNotification({
        emailRecipients: MOCK_RECIPIENTS,
        bounceType: MOCK_BOUNCE_TYPE,
        bouncedRecipients: MOCK_BOUNCED_EMAILS,
        formId: MOCK_FORM_ID,
        formTitle: MOCK_FORM_TITLE,
      })
      const expectedArgs = await generateExpectedArg(MOCK_BOUNCE_TYPE)

      // Assert
      const actualError = actualResult._unsafeUnwrapErr()
      expect(actualError).toEqual(new MailSendError('Failed to send mail'))
      // Final error should be non-4xx error.
      expect(actualError.meta).toEqual({ originalError: mockError })
      // Check arguments passed to sendNodeMail
      // Should retry two times and stop since the second rejected value is
      // non-4xx error.
      expect(sendMailSpy).toHaveBeenCalledTimes(2)
      expect(sendMailSpy).toHaveBeenCalledWith(expectedArgs)
    })
  })
})
