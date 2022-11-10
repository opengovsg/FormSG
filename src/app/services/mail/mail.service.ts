import { tracer } from 'dd-trace'
import { get, inRange, isEmpty } from 'lodash'
import moment from 'moment-timezone'
import { err, errAsync, okAsync, Result, ResultAsync } from 'neverthrow'
import Mail from 'nodemailer/lib/mailer'
import promiseRetry from 'promise-retry'
import validator from 'validator'

import {
  HASH_EXPIRE_AFTER_SECONDS,
  stringifiedSmsWarningTiers,
} from '../../../../shared/utils/verification'
import {
  BounceType,
  EmailAdminDataField,
  IEmailFormSchema,
  IFormDocument,
  IPopulatedForm,
  IPopulatedUser,
  ISubmissionSchema,
} from '../../../types'
import config from '../../config/config'
import { smsConfig } from '../../config/features/sms.config'
import { createLoggerWithLabel } from '../../config/logger'
import * as FormService from '../../modules/form/form.service'
import { extractFormLinkView } from '../../modules/form/form.utils'
import { formatAsPercentage } from '../../utils/formatters'

import { EMAIL_HEADERS, EmailType } from './mail.constants'
import { MailGenerationError, MailSendError } from './mail.errors'
import {
  AdminSmsDisabledData,
  AdminSmsWarningData,
  AutoreplySummaryRenderData,
  BounceNotificationHtmlData,
  CollabSmsDisabledData,
  CollabSmsWarningData,
  MailOptions,
  MailServiceParams,
  SendAutoReplyEmailsArgs,
  SendMailOptions,
  SendSingleAutoreplyMailArgs,
} from './mail.types'
import {
  generateAutoreplyHtml,
  generateAutoreplyPdf,
  generateBounceNotificationHtml,
  generateLoginOtpHtml,
  generateSmsVerificationDisabledHtmlForAdmin,
  generateSmsVerificationDisabledHtmlForCollab,
  generateSmsVerificationWarningHtmlForAdmin,
  generateSmsVerificationWarningHtmlForCollab,
  generateSubmissionToAdminHtml,
  generateVerificationOtpHtml,
  isToFieldValid,
} from './mail.utils'

const logger = createLoggerWithLabel(module)

const DEFAULT_RETRY_PARAMS: MailServiceParams['retryParams'] = {
  retries: 3,
  // Exponential backoff.
  factor: 2,
  minTimeout: 5000,
}

// Delete references to US SES when SES migration is over (opengovsg/formsg-private#130)
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
   * The transporter to be used to send mail (SES in US).
   */
  #transporter_us: Required<MailServiceParams>['transporter_us']
  /**
   * The transporter to be used to send mail (SES in SG).
   */
  #transporter_sg: Required<MailServiceParams>['transporter_sg']
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
    transporter_us = config.mail_us.transporter,
    transporter_sg = config.mail_sg.transporter,
    senderMail = config.mail_us.mailFrom,
    officialMail = config.mail_us.official,
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
    this.#transporter_us = transporter_us
    this.#transporter_sg = transporter_sg
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
        let sendMailFromSG = false
        const rand = Math.random() * 100
        sendMailFromSG = rand <= config.nodemailer_client_threshold_sg
        const info = await tracer.trace('nodemailer/sendMail', () =>
          sendMailFromSG
            ? this.#transporter_sg.sendMail(mail)
            : this.#transporter_us.sendMail(mail),
        )

        const logNodemailerMeta = {
          action: 'Nodemailer evaluation done',
          sendMailFromSG: sendMailFromSG,
          randAssignment: rand,
          sendFromSGThreshold: config.nodemailer_client_threshold_sg,
        }
        logger.info({
          message: `Mail successfully sent on attempt ${attemptNum}`,
          meta: { ...logMeta, info, ...logNodemailerMeta },
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
      this.#sendMailWithRetries(mail, {
        mailId: sendOptions?.mailId,
        formId: sendOptions?.formId,
      }),
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
      // Only destructure formSummaryRenderData if form summary is included.
      ...(autoReplyMailData.includeFormSummary && formSummaryRenderData),
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
   * @throws error if mail fails, to be handled by the caller
   */
  sendVerificationOtp = (
    recipient: string,
    otp: string,
  ): ResultAsync<true, MailSendError> => {
    const minutesToExpiry = Math.floor(HASH_EXPIRE_AFTER_SECONDS / 60)

    const mail: MailOptions = {
      to: recipient,
      from: this.#senderFromString,
      subject: `Your OTP for submitting a form on ${this.#appName}`,
      html: generateVerificationOtpHtml({
        appName: this.#appName,
        minutesToExpiry,
        otp,
      }),
      headers: {
        [EMAIL_HEADERS.emailType]: EmailType.VerificationOtp,
      },
    }
    // Error gets caught in getNewOtp
    return this.#sendNodeMail(mail, { mailId: 'verify' })
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
    ipAddress,
  }: {
    recipient: string
    otp: string
    ipAddress: string
  }): ResultAsync<true, MailSendError> => {
    return generateLoginOtpHtml({
      appName: this.#appName,
      appUrl: this.#appUrl,
      ipAddress: ipAddress,
      otp,
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

    return generateBounceNotificationHtml(htmlData, bounceType).andThen(
      (mailHtml) => {
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

        return this.#sendNodeMail(mail, { mailId: 'bounce' }).mapErr(
          (error) => {
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
          },
        )
      },
    )
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
    form: Pick<IEmailFormSchema, '_id' | 'title' | 'emails'>
    submission: Pick<ISubmissionSchema, 'id' | 'created'>
    attachments?: Mail.Attachment[]
    formData: EmailAdminDataField[]
    dataCollationData: {
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

    const htmlData = {
      appName: this.#appName,
      formTitle,
      refNo,
      submissionTime,
      dataCollationData: fullDataCollationData,
      formData,
    }

    return generateSubmissionToAdminHtml(htmlData).andThen((mailHtml) => {
      const mail: MailOptions = {
        to: form.emails,
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

    // Generate autoreply pdf and append into attachments if any of the mail has
    // to include a form summary.
    if (autoReplyMailDatas.some((data) => data.includeFormSummary)) {
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
        })
      }),
    )
  }

  /**
   * Sends a email to the admin and collaborators of the form when the verified sms feature will be disabled.
   * This happens only when the admin has hit a certain limit of sms verifications on his account.
   *
   * Note that the email sent to the admin and collaborators will differ.
   * This is because the admin will see all of their forms that are affected but collaborators
   * only see forms which they are a part of.
   *
   * @param form The form whose admin and collaborators will be issued the email
   * @returns ok(true) when mail sending is successful
   * @returns err(MailGenerationError) when there was an error in generating the html data for the mail
   * @returns err(MailSendError) when there was an error in sending the mail
   */
  sendSmsVerificationDisabledEmail = (
    form: Pick<IPopulatedForm, 'admin' | '_id'>,
  ): ResultAsync<true, MailGenerationError | MailSendError> => {
    // Step 1: Retrieve all public forms of admin that have sms verification enabled
    return FormService.retrievePublicFormsWithSmsVerification(form.admin._id)
      .andThen((forms) => {
        // Step 2: Send the mail containing all the active forms to the admin
        return this.sendDisabledMailForAdmin(forms, form.admin).map(() => forms)
      })
      .andThen((forms) => {
        // Step 3: Send to each individual form
        return ResultAsync.combine(
          forms.map((f) =>
            // If there are no collaborators, do not send out the email.
            // Admin would already have received a summary email from Step 2.
            f.permissionList.length
              ? this.sendDisabledMailForCollab(f, form.admin)
              : okAsync(true),
          ),
        )
      })
      .map(() => true)
  }

  // Helper method to send an email to all the collaborators of a given form that would be affected by
  // Sms verifications being disabled for the form.
  // Note that this method also emails the admin to notify them that the collaborators have been informed.
  sendDisabledMailForCollab = (
    form: IFormDocument,
    admin: IPopulatedUser,
  ): ResultAsync<true, MailGenerationError | MailSendError> => {
    const formLink = extractFormLinkView(form, this.#appUrl)
    const htmlData: CollabSmsDisabledData = {
      form: formLink,
      smsVerificationLimit:
        // Formatted using localeString so that the displayed number has commas
        smsConfig.smsVerificationLimit.toLocaleString('en-US'),
      smsWarningTiers: stringifiedSmsWarningTiers,
    }
    const collaborators = form.permissionList.map(({ email }) => email)
    const logMeta = {
      form: formLink,
      admin,
      collaborators,
      action: 'sendDisabledMailForCollab',
    }

    return generateSmsVerificationDisabledHtmlForCollab(htmlData).andThen(
      (mailHtml) => {
        const mailOptions: MailOptions = {
          to: admin.email,
          cc: collaborators,
          from: this.#senderFromString,
          html: mailHtml,
          subject: 'Free Mobile Number Verification Disabled',
          replyTo: this.#officialMail,
          bcc: this.#senderMail,
        }

        logger.info({
          message: 'Attempting to email collaborators about form disabling',
          meta: logMeta,
        })

        return this.#sendNodeMail(mailOptions, {
          formId: form._id,
          mailId: 'sendDisabledMailForCollab',
        })
      },
    )
  }

  // Helper method to send an email to a form admin which contains a summary of
  // which forms would be impacted by sms verifications being removed.
  sendDisabledMailForAdmin = (
    forms: IPopulatedForm[],
    admin: IPopulatedUser,
  ): ResultAsync<true, MailGenerationError | MailSendError> => {
    const formLinks = forms.map((f) => extractFormLinkView(f, this.#appUrl))
    const logMeta = {
      forms: formLinks,
      admin,
      action: 'sendDisabledMailForAdmin',
    }

    const htmlData: AdminSmsDisabledData = {
      forms: formLinks,
      smsVerificationLimit:
        // Formatted using localeString so that the displayed number has commas
        smsConfig.smsVerificationLimit.toLocaleString('en-US'),
      smsWarningTiers: stringifiedSmsWarningTiers,
    }

    return (
      // Step 1: Generate HTML data for admin
      generateSmsVerificationDisabledHtmlForAdmin(htmlData).andThen(
        (mailHtml) => {
          const mailOptions: MailOptions = {
            to: admin.email,
            from: this.#senderFromString,
            html: mailHtml,
            subject: 'Free Mobile Number Verification Disabled',
            replyTo: this.#officialMail,
            bcc: this.#senderMail,
          }

          logger.info({
            message: 'Attempting to email admin about form disabling',
            meta: logMeta,
          })

          // Step 2: Send mail out to admin ONLY
          return this.#sendNodeMail(mailOptions, {
            mailId: 'sendDisabledMailForAdmin',
          })
        },
      )
    )
  }

  /**
   * Sends a warning email to the admin of the form when their current verified sms counts hits a limit
   * @param form The form whose admin will be issued a warning
   * @param smsVerifications The current total sms verifications for the form
   * @returns ok(true) when mail sending is successful
   * @returns err(MailGenerationError) when there was an error in generating the html data for the mail
   * @returns err(MailSendError) when there was an error in sending the mail
   */
  sendSmsVerificationWarningEmail = (
    form: Pick<IPopulatedForm, 'admin' | '_id'>,
    smsVerifications: number,
  ): ResultAsync<true, MailGenerationError | MailSendError> => {
    // Step 1: Retrieve all public forms of admin that have sms verification enabled
    return FormService.retrievePublicFormsWithSmsVerification(form.admin._id)
      .andThen((forms) => {
        // Step 2: Send the mail containing all the active forms to the admin
        return this.sendWarningMailForAdmin(
          forms,
          form.admin,
          smsVerifications,
        ).map(() => forms)
      })
      .andThen((forms) => {
        // Step 3: Send to each individual form
        return ResultAsync.combine(
          forms.map((f) =>
            // If there are no collaborators, do not send out the email.
            // Admin would already have received a summary email from Step 2.
            f.permissionList.length
              ? this.sendWarningMailForCollab(f, form.admin, smsVerifications)
              : okAsync(true),
          ),
        ).map(() => true as const)
      })
  }

  // Utility method to send a warning mail to the collaborators of a form.
  // Note that this also sends the mail out to the admin of the form as well.
  sendWarningMailForCollab = (
    form: IFormDocument,
    admin: IPopulatedUser,
    smsVerifications: number,
  ): ResultAsync<true, MailGenerationError | MailSendError> => {
    const formLink = extractFormLinkView(form, this.#appUrl)
    const percentageUsed = formatAsPercentage(
      smsVerifications / smsConfig.smsVerificationLimit,
    )
    const htmlData: CollabSmsWarningData = {
      form: formLink,
      percentageUsed,
      smsVerificationLimit:
        smsConfig.smsVerificationLimit.toLocaleString('en-US'),
    }
    const collaborators = form.permissionList.map(({ email }) => email)
    const logMeta = {
      form: formLink,
      admin,
      collaborators,
      smsVerifications,
      action: 'sendWarningMailForCollab',
    }

    // Step 1: Generate HTML data for collab
    return generateSmsVerificationWarningHtmlForCollab(htmlData).andThen(
      (mailHtml) => {
        const mailOptions: MailOptions = {
          to: admin.email,
          cc: collaborators,
          from: this.#senderFromString,
          html: mailHtml,
          subject: 'Mobile Number Verification - Free Tier Limit Alert',
          replyTo: this.#officialMail,
          bcc: this.#senderMail,
        }

        logger.info({
          message: 'Attempting to warn collaborators about sms limits',
          meta: logMeta,
        })

        // Step 2: Send mail out to admin and collab
        return this.#sendNodeMail(mailOptions, {
          formId: form._id,
          mailId: 'sendWarningMailForCollab',
        })
      },
    )
  }

  // Utility method to send a warning mail to the admin of a form.
  // This is triggered when the admin's sms verification counts hits a limit.
  // This informs the admin of all forms that use sms verification
  sendWarningMailForAdmin = (
    forms: IPopulatedForm[],
    admin: IPopulatedUser,
    smsVerifications: number,
  ): ResultAsync<true, MailGenerationError | MailSendError> => {
    const formLinks = forms.map((f) => extractFormLinkView(f, this.#appUrl))
    const htmlData: AdminSmsWarningData = {
      forms: formLinks,
      numAvailable: (
        smsConfig.smsVerificationLimit - smsVerifications
      ).toLocaleString('en-US'),
      smsVerificationLimit:
        smsConfig.smsVerificationLimit.toLocaleString('en-US'),
    }
    const logMeta = {
      forms: formLinks,
      admin,
      smsVerifications,
      action: 'sendWarningMailForAdmin',
    }

    return (
      // Step 1: Generate HTML data for admin
      generateSmsVerificationWarningHtmlForAdmin(htmlData).andThen(
        (mailHtml) => {
          const mailOptions: MailOptions = {
            to: admin.email,
            from: this.#senderFromString,
            html: mailHtml,
            subject: 'Mobile Number Verification - Free Tier Limit Alert',
            replyTo: this.#officialMail,
            bcc: this.#senderMail,
          }

          logger.info({
            message: 'Attempting to warn admin about sms limits',
            meta: logMeta,
          })

          // Step 2: Send mail out to admin ONLY
          return this.#sendNodeMail(mailOptions, {
            mailId: 'sendWarningMailForAdmin',
          })
        },
      )
    )
  }
}

export default new MailService()
