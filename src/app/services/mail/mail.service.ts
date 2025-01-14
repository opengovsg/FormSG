import { render } from '@react-email/render'
import tracer from 'dd-trace'
import { get, inRange, isEmpty } from 'lodash'
import moment from 'moment-timezone'
import { err, errAsync, fromPromise, Result, ResultAsync } from 'neverthrow'
import Mail from 'nodemailer/lib/mailer'
import promiseRetry from 'promise-retry'
import validator from 'validator'

import { FormResponseMode, PaymentChannel } from '../../../../shared/types'
import { centsToDollars } from '../../../../shared/utils/payments'
import { getPaymentInvoiceDownloadUrlPath } from '../../../../shared/utils/urls'
import { HASH_EXPIRE_AFTER_SECONDS } from '../../../../shared/utils/verification'
import {
  BounceType,
  EmailAdminDataField,
  IFormHasEmailSchema,
  IPopulatedEncryptedForm,
  IPopulatedForm,
  ISubmissionSchema,
} from '../../../types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { getAdminEmails } from '../../modules/form/form.utils'
import { BounceNotification } from '../../views/templates/BounceNotification'
import {
  EmailAddressVerificationOtp,
  EmailAddressVerificationOtpHtmlData,
} from '../../views/templates/EmailAddressVerificationOtp'
import MrfWorkflowCompletionEmail, {
  QuestionAnswer,
  WorkflowOutcome,
} from '../../views/templates/MrfWorkflowCompletionEmail'
import MrfWorkflowEmail, {
  WorkflowEmailData,
} from '../../views/templates/MrfWorkflowEmail'

import { EMAIL_HEADERS, EmailType } from './mail.constants'
import { MailGenerationError, MailSendError } from './mail.errors'
import {
  AutoreplySummaryRenderData,
  BounceNotificationHtmlData,
  IssueReportedNotificationData,
  MailOptions,
  MailServiceParams,
  PaymentConfirmationData,
  SendAutoReplyEmailsArgs,
  SendMailOptions,
  SendSingleAutoreplyMailArgs,
  SubmissionToAdminHtmlData,
} from './mail.types'
import {
  generateAutoreplyHtml,
  generateAutoreplyPdf,
  generateIssueReportedNotificationHtml,
  generateLoginOtpHtml,
  generatePaymentConfirmationHtml,
  generatePaymentOnboardingHtml,
  generateSubmissionToAdminHtml,
  isToFieldValid,
} from './mail.utils'

const logger = createLoggerWithLabel(module)

const DEFAULT_RETRY_PARAMS: MailServiceParams['retryParams'] = {
  retries: 3,
  // Exponential backoff.
  factor: 2,
  minTimeout: 5000,
}

export class MailService {
  /**
   * The application name to be shown in some sent emails' fields such as mail
   * subject or mail body.
   */
  #appName: Required<MailServiceParams>['appName']
  /**
   * The application URL to be shown in some sent emails' fields such as mail
   * subject or mail body.
   */
  #appUrl: Required<MailServiceParams>['appUrl']
  /**
   * The transporter to be used to send mail (SES in SG).
   */
  #transporter: Required<MailServiceParams>['transporter']
  /**
   * The email string to denote the "from" field of the email.
   */
  #senderMail: Required<MailServiceParams>['senderMail']
  /**
   * The full string that can be shown in the mail's "from" field created from
   * the given `appName` and `senderMail` arguments.
   *
   * E.g. `FormSG <test@example.com>`
   */
  #senderFromString: string

  /**
   * Sets the retry parameters for sendNodeMail retries.
   */
  #retryParams: MailServiceParams['retryParams']

  /**
   * The official mail account that recipients can reply to
   */
  #officialMail: string

  constructor({
    appName = config.app.title,
    appUrl = config.app.appUrl,
    transporter = config.mail.transporter,
    senderMail = config.mail.mailFrom,
    officialMail = config.mail.official,
    retryParams = DEFAULT_RETRY_PARAMS,
  }: MailServiceParams = {}) {
    // Email validation
    if (!validator.isEmail(senderMail)) {
      const invalidMailError = new Error(
        `MailService constructor: senderMail: ${senderMail} is not a valid email`,
      )
      logger.error({
        message: `senderMail: ${senderMail} is not a valid email`,
        meta: {
          action: 'constructor',
        },
      })
      throw invalidMailError
    }

    this.#appName = appName
    this.#appUrl = appUrl
    this.#senderMail = senderMail
    this.#senderFromString = `${appName} <${senderMail}>`
    this.#transporter = transporter
    this.#officialMail = officialMail
    this.#retryParams = retryParams
  }

  /**
   * Private function to wrap the sending of email using SES / Direct transport with retries.
   * @param mail Mail data to send with
   * @param loggerMeta optional object to pass into logger
   * @returns true on successful mail sending
   * @throws error if mail still fails to send after retries
   */
  #sendMailWithRetries = (
    mail: MailOptions,
    loggerMeta?: Record<string, unknown>,
  ): Promise<true> => {
    const logMeta = {
      action: '#sendMailWithRetries',
      mailFrom: mail.from,
      mailSubject: mail.subject,
      ...loggerMeta,
    }

    return promiseRetry<true>(async (retry, attemptNum) => {
      logger.info({
        message: `Attempt ${attemptNum} to send mail`,
        meta: logMeta,
      })

      try {
        const info = await tracer.trace('nodemailer/sendMail', () =>
          this.#transporter.sendMail(mail),
        )

        logger.info({
          message: `Mail successfully sent on attempt ${attemptNum}`,
          meta: { ...logMeta, info },
        })

        return true
      } catch (error) {
        // Pass errors to the callback
        logger.error({
          message: `Send mail failure on attempt ${attemptNum}`,
          meta: logMeta,
          error,
        })

        const respCode: number | undefined = get(error, 'responseCode')
        // Retry only on 4xx errors.
        if (!!respCode && inRange(respCode, 400, 500)) {
          return retry(error)
        }

        // Not 4xx error, rethrow error.
        throw error
      }
    }, this.#retryParams)
  }

  /**
   * Private function to send email using SES / Direct transport.
   * @param mail Mail data to send with
   * @param sendOptions Extra options to better identify mail, such as form or mail id.
   * @returns ok(true) on successful mail sending
   * @returns err(MailSendError) if any errors occurs whilst sending mail
   */
  #sendNodeMail = (
    mail: MailOptions,
    sendOptions?: SendMailOptions,
  ): ResultAsync<true, MailSendError> => {
    const logMeta = {
      action: '#sendNodeMail',
      mailId: sendOptions?.mailId,
      formId: sendOptions?.formId,
      mailFrom: mail.from,
      mailSubject: mail.subject,
    }

    // Guard against missing mail info.
    if (!mail || isEmpty(mail.to)) {
      logger.error({
        message: 'Undefined mail',
        meta: logMeta,
      })

      return errAsync(new MailSendError('Mail undefined error'))
    }

    // Guard against invalid emails.
    if (!isToFieldValid(mail.to)) {
      logger.error({
        message: `${mail.to} is not a valid email`,
        meta: logMeta,
      })
      return errAsync(new MailSendError('Invalid email error'))
    }

    return ResultAsync.fromPromise(
      this.#sendMailWithRetries(
        {
          ...mail,
          headers: config.mail.sesConfigSet
            ? {
                'X-SES-CONFIGURATION-SET': config.mail.sesConfigSet,
                ...mail.headers,
              }
            : mail.headers,
        },
        {
          mailId: sendOptions?.mailId,
          formId: sendOptions?.formId,
        },
      ),
      (error) => {
        logger.error({
          message: 'Error returned from sendMail retries',
          meta: logMeta,
          error,
        })

        return new MailSendError('Failed to send mail', {
          originalError: error,
        })
      },
    )
  }

  /**
   * Private function to send a single autoreply mail to recipients.
   * @param arg the autoreply mail arguments
   * @param arg.autoReplyMailData the main mail data to populate mail params
   * @param arg.attachments the attachments to add to the mail
   * @param arg.form the form mongoose object to populate the email subject or to retrieve the sender from
   * @param arg.submission the submission mongoose object to retrieve id from for metadata
   * @param arg.index the index metadata of this mail for logging purposes
   */
  #sendSingleAutoreplyMail = ({
    autoReplyMailData,
    attachments,
    formSummaryRenderData,
    form,
    submission,
    index,
    isPaymentEnabled,
  }: SendSingleAutoreplyMailArgs): ResultAsync<
    true,
    MailSendError | MailGenerationError
  > => {
    const emailSubject =
      autoReplyMailData.subject || `Thank you for submitting ${form.title}`
    // Sender's name appearing after "("" symbol gets truncated. Escaping it
    // solves the problem.
    const emailSender = (
      autoReplyMailData.sender || form.admin.agency.fullName
    ).replace('(', '\\(')

    const defaultBody = `Dear Sir or Madam,\n\nThank you for submitting this form.\n\nRegards,\n${form.admin.agency.fullName}`
    const autoReplyBody = (autoReplyMailData.body || defaultBody).split('\n')

    const templateData = {
      submissionId: submission.id,
      autoReplyBody,
      // Only destructure formSummaryRenderData if form summary is included
      // and there aren't any active payment fields (defaults to false)
      ...(autoReplyMailData.includeFormSummary &&
        !(isPaymentEnabled ?? false) &&
        formSummaryRenderData),
    }

    return generateAutoreplyHtml(templateData).andThen((mailHtml) => {
      const mail: MailOptions = {
        to: autoReplyMailData.email,
        // Quotes necessary to allow for special characters in emailSender, e.g. comma.
        // See https://github.com/nodemailer/nodemailer/issues/377
        from: `"${emailSender}" <${this.#senderMail}>`,
        subject: emailSubject,
        // Only send attachments if the admin has the box checked for email
        // fields.
        attachments: autoReplyMailData.includeFormSummary ? attachments : [],
        html: mailHtml,
        headers: {
          [EMAIL_HEADERS.formId]: String(form._id),
          [EMAIL_HEADERS.submissionId]: String(submission.id),
          [EMAIL_HEADERS.emailType]: EmailType.EmailConfirmation,
        },
      }

      return this.#sendNodeMail(mail, {
        mailId: `${submission.id}-${index}`,
        formId: form._id,
      })
    })
  }

  /**
   * Sends a verification otp to a valid email
   * @param recipient the recipient email address
   * @param otp the otp to send
   * @param otpPrefix the otpPrefix to identify
   * @throws error if mail fails, to be handled by the caller
   */
  sendVerificationOtp = (
    recipient: string,
    otp: string,
    otpPrefix: string,
  ): ResultAsync<true, MailSendError> => {
    const minutesToExpiry = Math.floor(HASH_EXPIRE_AFTER_SECONDS / 60)

    const htmlData: EmailAddressVerificationOtpHtmlData = {
      appName: this.#appName,
      minutesToExpiry,
      otp,
      otpPrefix,
    }
    const generatedHtml = fromPromise(
      render(EmailAddressVerificationOtp(htmlData)),
      (e) => {
        logger.error({
          message: 'Failed to render EmailAddressVerificationOtp',
          meta: {
            action: 'sendVerificationOtp',
            error: e,
          },
        })

        return new MailGenerationError(
          'Error generating email address otp verification email',
        )
      },
    )

    return generatedHtml.andThen((mailHtml) => {
      const mail: MailOptions = {
        to: recipient,
        from: this.#senderFromString,
        subject: `Your OTP for submitting a form on ${this.#appName}`,
        html: mailHtml,
        headers: {
          [EMAIL_HEADERS.emailType]: EmailType.VerificationOtp,
        },
      }
      return this.#sendNodeMail(mail, { mailId: 'verify' }).mapErr((error) => {
        logger.error({
          message: 'Error sending email address otp verification email',
          meta: {
            action: 'sendVerificationOtp',
            htmlData,
          },
          error,
        })
        return error
      })
    })
  }

  /**
   * Sends a login otp email to a valid email
   * @param recipient the recipient email address
   * @param otp the OTP to send
   * @returns ok(never) if sending of mail succeeds
   * @returns err(MailSendError) if sending of mail fails, to be handled by the caller
   */
  sendLoginOtp = ({
    recipient,
    otp,
    otpPrefix,
    ipAddress,
  }: {
    recipient: string
    otp: string
    otpPrefix: string
    ipAddress: string
  }): ResultAsync<true, MailSendError> => {
    return generateLoginOtpHtml({
      appName: this.#appName,
      appUrl: this.#appUrl,
      ipAddress: ipAddress,
      otp,
      otpPrefix,
    }).andThen((loginHtml) => {
      const mail: MailOptions = {
        to: recipient,
        from: this.#senderFromString,
        subject: `One-Time Password (OTP) for ${this.#appName}`,
        html: loginHtml,
        headers: {
          [EMAIL_HEADERS.emailType]: EmailType.LoginOtp,
        },
      }

      return this.#sendNodeMail(mail, { mailId: 'OTP' }).mapErr((error) => {
        // Add additional logging.
        logger.error({
          message: 'Error sending login OTP to email',
          meta: {
            action: 'sendLoginOtp',
            recipient,
          },
          error,
        })
        return error
      })
    })
  }

  /**
   * Sends a notification for critical bounce
   * @param args the parameter object
   * @param args.emailRecipients emails to send to
   * @param args.bouncedRecipients the emails which caused the critical bounce
   * @param args.bounceType bounce type given by SNS
   * @param args.formTitle title of form
   * @param args.formId ID of form
   * @throws error if mail fails, to be handled by the caller
   */
  sendBounceNotification = ({
    emailRecipients,
    bouncedRecipients,
    bounceType,
    formTitle,
    formId,
  }: {
    emailRecipients: string[]
    bouncedRecipients: string[]
    bounceType: BounceType | undefined
    formTitle: string
    formId: string
  }): ResultAsync<true, MailGenerationError | MailSendError> => {
    const htmlData: BounceNotificationHtmlData = {
      formTitle,
      formLink: `${this.#appUrl}/${formId}`,
      bouncedRecipients: bouncedRecipients.join(', '),
      appName: this.#appName,
    }

    const generatedHtml = fromPromise(
      render(BounceNotification(htmlData)),
      (e) => {
        logger.error({
          message: 'Failed to render BounceNotification',
          meta: {
            action: 'sendBounceNotification',
            error: e,
          },
        })

        return new MailGenerationError(
          'Error generating bounce notification email',
        )
      },
    )

    return generatedHtml.andThen((mailHtml) => {
      const mail: MailOptions = {
        to: emailRecipients,
        from: this.#senderFromString,
        subject: '[Urgent] FormSG Response Delivery Failure / Bounce',
        html: mailHtml,
        headers: {
          [EMAIL_HEADERS.emailType]: EmailType.AdminBounce,
          [EMAIL_HEADERS.formId]: formId,
        },
      }

      return this.#sendNodeMail(mail, { mailId: 'bounce' }).mapErr((error) => {
        // Add additional logging.
        logger.error({
          message: 'Error sending bounce notification email',
          meta: {
            action: 'sendBounceNotification',
            bounceType,
            formTitle,
            formId,
          },
          error,
        })
        return error
      })
    })
  }

  /**
   * Sends a submission response email to the admin of the given form.
   * @param args the parameter object
   * @param args.replyToEmails emails to set replyTo, if any
   * @param args.form the form document to retrieve some email data from
   * @param args.submission the submission document to retrieve some email data from
   * @param args.attachments attachments to append to the email, if any
   * @param args.dataCollationData the data to use in the data collation tool to be appended to the end of the email
   * @param args.formData the form data to display to in the body in table form
   */
  sendSubmissionToAdmin = ({
    replyToEmails,
    form,
    submission,
    attachments,
    dataCollationData,
    formData,
  }: {
    replyToEmails?: string[]
    form: Pick<IFormHasEmailSchema, '_id' | 'title' | 'emails'>
    submission: Pick<ISubmissionSchema, 'id' | 'created'>
    attachments?: Mail.Attachment[]
    formData: EmailAdminDataField[]
    dataCollationData?: {
      question: string
      answer: string | number
    }[]
  }): ResultAsync<true, MailGenerationError | MailSendError> => {
    const refNo = String(submission.id)
    const formTitle = form.title
    const submissionTime = moment(submission.created)
      .tz('Asia/Singapore')
      .format('ddd, DD MMM YYYY hh:mm:ss A')

    // Add in additional metadata to dataCollationData.
    // Unshift is not used as it mutates the array.
    const htmlData: SubmissionToAdminHtmlData = {
      appName: this.#appName,
      formTitle,
      refNo,
      submissionTime,
      formData,
    }

    if (dataCollationData) {
      const fullDataCollationData = [
        {
          question: 'Response ID',
          answer: refNo,
        },
        {
          question: 'Timestamp',
          answer: submissionTime,
        },
        ...dataCollationData,
      ]
      htmlData.dataCollationData = fullDataCollationData
    }

    const adminEmails: string[] = getAdminEmails(form)

    return generateSubmissionToAdminHtml(htmlData).andThen((mailHtml) => {
      const mail: MailOptions = {
        to: adminEmails,
        from: this.#senderFromString,
        subject: `formsg-auto: ${formTitle} (#${refNo})`,
        html: mailHtml,
        attachments,
        headers: {
          [EMAIL_HEADERS.formId]: String(form._id),
          [EMAIL_HEADERS.submissionId]: refNo,
          [EMAIL_HEADERS.emailType]: EmailType.AdminResponse,
        },
        // replyTo options only allow string format.
        replyTo: replyToEmails?.join(', '),
      }

      return this.#sendNodeMail(mail, {
        mailId: refNo,
        formId: String(form._id),
      }).mapErr((error) => {
        // Add additional logging.
        logger.error({
          message: 'Error sending submission to admin email',
          meta: {
            action: 'sendSubmissionToAdmin',
          },
          error,
        })
        return error
      })
    })
  }

  /**
   * Sends an autoreply emails to the filler of the given form.
   * @param args the arguments object
   * @param args.form the form document to retrieve some email data from
   * @param args.submission the submission document to retrieve some email data from
   * @param args.attachments attachments to append to the email, if any
   * @param args.responsesData the array of response data to use in rendering
   * the mail body or summary pdf
   * @param args.autoReplyMailDatas array of objects that contains autoreply mail data to override with defaults
   * @param args.autoReplyMailDatas[].email contains the recipient of the mail
   * @param args.autoReplyMailDatas[].subject if available, sends the mail out with this subject instead of the default subject
   * @param args.autoReplyMailDatas[].sender if available, shows the given string as the sender instead of the default sender
   * @param args.autoReplyMailDatas[].includeFormSummary if true, adds the given attachments into the sent mail
   */
  sendAutoReplyEmails = async ({
    form,
    submission,
    responsesData,
    autoReplyMailDatas,
    attachments = [],
  }: SendAutoReplyEmailsArgs): Promise<
    PromiseSettledResult<Result<true, MailSendError | MailGenerationError>>[]
  > => {
    // Data to render both the submission details mail HTML body and PDF.

    const renderData: AutoreplySummaryRenderData = {
      refNo: submission.id,
      formTitle: form.title,
      submissionTime: moment(submission.created)
        .tz('Asia/Singapore')
        .format('ddd, DD MMM YYYY hh:mm:ss A'),
      formData: responsesData,
      formUrl: `${this.#appUrl}/${form._id}`,
    }

    // Create a copy of attachments for attaching of autoreply pdf if needed.
    const attachmentsWithAutoreplyPdf = [...attachments]
    const isEncryptForm = form?.responseMode === FormResponseMode.Encrypt
    const encryptFormDef = form as IPopulatedEncryptedForm
    const isPaymentEnabled =
      isEncryptForm &&
      encryptFormDef.payments_channel.channel !== PaymentChannel.Unconnected &&
      encryptFormDef.payments_field.enabled === true

    // Generate autoreply pdf and append into attachments if any of the mail has
    // to include a form summary.
    if (
      autoReplyMailDatas.some((data) => data.includeFormSummary) &&
      !isPaymentEnabled
    ) {
      const pdfBufferResult = await generateAutoreplyPdf(renderData)
      if (pdfBufferResult.isErr()) {
        return Promise.allSettled([err(pdfBufferResult.error)])
      }
      attachmentsWithAutoreplyPdf.push({
        filename: 'response.pdf',
        content: pdfBufferResult.value,
      })
    }

    // Prepare mail sending for each autoreply mail.
    return Promise.allSettled(
      autoReplyMailDatas.map((mailData, index) => {
        return this.#sendSingleAutoreplyMail({
          form,
          submission,
          attachments: mailData.includeFormSummary
            ? attachmentsWithAutoreplyPdf
            : attachments,
          autoReplyMailData: mailData,
          formSummaryRenderData: renderData,
          index,
          isPaymentEnabled,
        })
      }),
    )
  }

  /**
   * Sends a payment confirmation to a valid email
   * @param email the recipient email address
   * @param formTitle the form title of the payment form
   * @param submissionId the response ID
   * @param formId the payment form ID
   * @param paymentId the payment ID
   * @returns err(MailSendError) when there was an error in sending the mail
   */
  sendPaymentConfirmationEmail = ({
    email,
    formTitle,
    submissionId,
    formId,
    paymentId,
    paymentAmount,
  }: {
    email: string
    formTitle: string
    submissionId: string
    formId: string
    paymentId: string
    paymentAmount: number
  }): ResultAsync<true, MailSendError> => {
    const htmlData: PaymentConfirmationData = {
      formTitle: formTitle,
      submissionId: submissionId,
      appName: this.#appName,
      invoiceUrl: `${this.#appUrl}/api/v3/${getPaymentInvoiceDownloadUrlPath(
        formId,
        paymentId,
      )}`,
      amountPaid: centsToDollars(paymentAmount),
    }
    return generatePaymentConfirmationHtml({ htmlData }).andThen((html) => {
      const mail: MailOptions = {
        to: email,
        from: this.#senderFromString,
        subject: `Your payment on ${this.#appName} was successful`,
        html: html,
        headers: {
          [EMAIL_HEADERS.emailType]: EmailType.PaymentConfirmation,
        },
      }
      return this.#sendNodeMail(mail, { mailId: 'paymentConfirmation' })
    })
  }

  /**
   * Sends a payment onboarding email to a valid email
   * @param email the recipient email address
   * @returns err(MailSendError) when there was an error in sending the mail
   */
  sendPaymentOnboardingEmail = ({
    email,
  }: {
    email: string
  }): ResultAsync<true, MailSendError> => {
    const mail: MailOptions = {
      to: email,
      from: this.#senderFromString,
      subject: `Getting started with FormSG Payments`,
      html: generatePaymentOnboardingHtml({ appName: this.#appName }),
      headers: {
        [EMAIL_HEADERS.emailType]: EmailType.PaymentOnboarding,
      },
    }
    return this.#sendNodeMail(mail, { mailId: 'paymentOnboarding' })
  }

  /**
   * Sends a notification email to the admin of the given form for issue
   * reported by the public users.
   * @param form form object in which the issue is being reported
   */
  sendFormIssueReportedNotificationToAdmin = ({
    form,
  }: {
    form: IPopulatedForm
  }): ResultAsync<true, MailGenerationError | MailSendError> => {
    const htmlData: IssueReportedNotificationData = {
      appName: this.#appName,
      formTitle: form.title,
      formResultUrl: `${this.#appUrl}/admin/form/${form._id}/results/feedback`,
    }
    return generateIssueReportedNotificationHtml({ htmlData }).andThen(
      (html) => {
        const mail: MailOptions = {
          to: form.admin.email,
          cc: form.permissionList.map(({ email }) => email),
          from: this.#senderFromString,
          subject: `Respondents are facing issues on ${form.title}`,
          html: html,
          headers: {
            [EMAIL_HEADERS.emailType]: EmailType.IssueReportedNotification,
          },
        }
        return this.#sendNodeMail(mail, {
          formId: form._id.toString(),
          mailId: 'issueReportedNotification',
        })
      },
    )
  }

  // Utility method to send a mail during local dev (to maildev)
  // The sender and receipent are both form's internal mailing address
  sendLocalDevMail = (
    subject: string,
    mailHtml: string,
  ): ResultAsync<true, MailGenerationError | MailSendError> => {
    const mailOptions: MailOptions = {
      to: this.#officialMail,
      from: this.#senderFromString,
      html: mailHtml,
      subject: subject,
      replyTo: this.#officialMail,
      bcc: this.#senderMail,
    }
    return this.#sendNodeMail(mailOptions, {
      mailId: 'sendWarningMailForAdmin',
    })
  }

  /**
   * For MRF forms - sends a workflow notification to the valid email addresses
   * @param emails the recipient email addresses
   * @param formTitle the form title of the MRF form
   * @param responseUrl the response url which includes the secret key
   * @returns err(MailSendError) when there was an error in sending the mail
   */
  sendMRFWorkflowStepEmail = ({
    emails,
    formTitle,
    responseId,
    responseUrl,
  }: {
    emails: string[]
    formTitle: string
    responseId: string
    responseUrl: string
  }): ResultAsync<true, MailSendError> => {
    const htmlData: WorkflowEmailData = {
      formTitle,
      responseId: responseId.toString(),
      responseUrl,
    }

    const generatedHtml = fromPromise(
      render(MrfWorkflowEmail(htmlData)),
      (e) => {
        logger.error({
          message: 'Failed to render MrfWorkflowEmail',
          meta: {
            action: 'sendMRFWorkflowStepEmail',
            error: e,
          },
        })

        return new MailGenerationError('Error generating mrf workflow email')
      },
    )

    return generatedHtml.andThen((mailHtml) => {
      const mail: MailOptions = {
        to: emails,
        from: this.#senderFromString,
        subject: `Action required - ${formTitle} (${responseId})`,
        html: mailHtml,
        headers: {
          [EMAIL_HEADERS.emailType]: EmailType.WorkflowNotification,
        },
      }

      return this.#sendNodeMail(mail, { mailId: 'workflowNotification' })
    })
  }

  sendMrfWorkflowCompletionEmail = ({
    emails,
    formId,
    formTitle,
    responseId,
    formQuestionAnswers,
  }: {
    emails: string[]
    formId: string
    formTitle: string
    responseId: string
    formQuestionAnswers: QuestionAnswer[]
  }) => {
    const htmlData = {
      formTitle,
      responseId: responseId.toString(),
      formQuestionAnswers,
    }

    const generatedHtml = fromPromise(
      render(MrfWorkflowCompletionEmail(htmlData)),
      (e) => {
        logger.error({
          message: 'Failed to render MrfWorkflowCompletionEmail',
          meta: {
            action: 'sendMrfWorkflowCompletionEmail',
            error: e,
          },
        })

        return new MailGenerationError(
          'Error generating mrf workflow completion email',
        )
      },
    )

    return generatedHtml.andThen((mailHtml) => {
      const mail: MailOptions = {
        to: emails,
        from: this.#senderFromString,
        subject: `Completed - ${formTitle} (${responseId})`,
        html: mailHtml,
        headers: {
          [EMAIL_HEADERS.emailType]: EmailType.WorkflowNotification,
        },
      }

      return this.#sendNodeMail(mail, {
        formId,
        mailId: 'workflowNotification',
      })
    })
  }

  sendMrfApprovalEmail = ({
    emails,
    formId,
    formTitle,
    responseId,
    isRejected,
    formQuestionAnswers,
  }: {
    emails: string[]
    formId: string
    formTitle: string
    responseId: string
    isRejected: boolean
    formQuestionAnswers: QuestionAnswer[]
  }) => {
    const outcome = isRejected
      ? WorkflowOutcome.NOT_APPROVED
      : WorkflowOutcome.APPROVED
    const htmlData = {
      formTitle,
      responseId: responseId.toString(),
      outcome,
      formQuestionAnswers,
    }

    const generatedHtml = fromPromise(
      render(MrfWorkflowCompletionEmail(htmlData)),
      (e) => {
        logger.error({
          message: 'Failed to render MrfWorkflowCompletionEmail',
          meta: {
            action: 'sendMrfApprovalEmail',
            error: e,
          },
        })

        return new MailGenerationError(
          'Error generating mrf workflow completion email',
        )
      },
    )

    return generatedHtml.andThen((mailHtml) => {
      const mail: MailOptions = {
        to: emails,
        from: this.#senderFromString,
        subject: `${outcome} - ${formTitle} (${responseId})`,
        html: mailHtml,
        headers: {
          [EMAIL_HEADERS.emailType]: EmailType.WorkflowNotification,
        },
      }

      return this.#sendNodeMail(mail, {
        formId,
        mailId: 'workflowNotification',
      })
    })
  }
}

export default new MailService()
