import { isEmpty } from 'lodash'
import moment from 'moment-timezone'
import Mail from 'nodemailer/lib/mailer'
import validator from 'validator'
import { Logger } from 'winston'

import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { HASH_EXPIRE_AFTER_SECONDS } from '../../shared/util/verification'
import {
  AutoReplyOptions,
  IEmailFormSchema,
  IFormSchema,
  IPopulatedForm,
  ISubmissionSchema,
} from '../../types'
import { EMAIL_HEADERS, EMAIL_TYPES } from '../constants/mail'
import {
  generateAutoreplyHtml,
  generateAutoreplyPdf,
  generateLoginOtpHtml,
  generateSubmissionToAdminHtml,
  generateVerificationOtpHtml,
  isToFieldValid,
} from '../utils/mail'

const mailLogger = createLoggerWithLabel('mail')

type SendMailOptions = {
  mailId?: string
  formId?: string
}

type SendSingleAutoreplyMailArgs = {
  form: Pick<IPopulatedForm, 'admin' | '_id' | 'title'>
  submission: Pick<ISubmissionSchema, 'id' | 'created'>
  autoReplyMailData: AutoReplyMailData
  attachments: Mail.Attachment[]
  formSummaryRenderData: AutoreplySummaryRenderData
  index: number
}

export type SendAutoReplyEmailsArgs = {
  form: Pick<IPopulatedForm, 'admin' | '_id' | 'title'>
  submission: Pick<ISubmissionSchema, 'id' | 'created'>
  attachments?: Mail.Attachment[]
  responsesData: { question: string; answerTemplate: string[] }[]
  autoReplyMailDatas: AutoReplyMailData[]
}

type MailServiceParams = {
  appName?: string
  appUrl?: string
  transporter?: Mail
  senderMail?: string
  logger?: Logger
}

type AutoReplyMailData = {
  email: string
  subject?: AutoReplyOptions['autoReplySubject']
  sender?: AutoReplyOptions['autoReplySender']
  body?: AutoReplyOptions['autoReplyMessage']
  includeFormSummary?: AutoReplyOptions['includeFormSummary']
}

export type AutoreplySummaryRenderData = {
  refNo: ISubmissionSchema['_id']
  formTitle: IFormSchema['title']
  submissionTime: string
  // TODO (#42): Add proper types once the type is determined.
  formData: any
  formUrl: string
}

type MailOptions = Omit<Mail.Options, 'to'> & {
  to: string | string[]
}

export class MailService {
  /**
   * The application name to be shown in some sent emails' fields such as mail
   * subject or mail body.
   */
  #appName: string
  /**
   * The application URL to be shown in some sent emails' fields such as mail
   * subject or mail body.
   */
  #appUrl: string
  /**
   * The transporter to be used to send mail.
   */
  #transporter: Mail
  /**
   * The email string to denote the "from" field of the email.
   */
  #senderMail: string
  /**
   * The full string that can be shown in the mail's "from" field created from
   * the given `appName` and `senderMail` arguments.
   *
   * E.g. `FormSG <test@example.com>`
   */
  #senderFromString: string
  /**
   * Logger to log any errors encounted while sending mail.
   */
  #logger: Logger

  constructor({
    appName = config.app.title,
    appUrl = config.app.appUrl,
    transporter = config.mail.transporter,
    senderMail = config.mail.mailFrom,
    logger = mailLogger,
  }: MailServiceParams = {}) {
    this.#logger = logger

    // Email validation
    if (!validator.isEmail(senderMail)) {
      const invalidMailError = new Error(
        `MailService constructor: senderMail: ${senderMail} is not a valid email`,
      )
      this.#logger.error(invalidMailError)
      throw invalidMailError
    }

    this.#appName = appName
    this.#appUrl = appUrl
    this.#senderMail = senderMail
    this.#senderFromString = `${appName} <${senderMail}>`
    this.#transporter = transporter
  }

  /**
   * Private function to send email using SES / Direct transport.
   * @param mail Mail data to send with
   * @param sendOptions Extra options to better identify mail, such as form or mail id.
   */
  #sendNodeMail = async (mail: MailOptions, sendOptions?: SendMailOptions) => {
    const emailLogString = `mailId: ${sendOptions?.mailId}\t Email from:${mail?.from}\t subject:${mail?.subject}\t formId: ${sendOptions?.formId}`

    // Guard against missing mail info.
    if (!mail || isEmpty(mail.to)) {
      this.#logger.error(`mailError: undefined mail. ${emailLogString}`)
      return Promise.reject(new Error('Mail undefined error'))
    }

    // Guard against invalid emails.
    if (!isToFieldValid(mail.to)) {
      this.#logger.error(
        `mailError: ${mail.to} is not a valid email. ${emailLogString}`,
      )
      return Promise.reject(new Error('Invalid email error'))
    }

    this.#logger.info(emailLogString)
    this.#logger.profile(emailLogString)

    try {
      const response = await this.#transporter.sendMail(mail)
      this.#logger.info(`mailSuccess:\t${emailLogString}`)
      return response
    } catch (err) {
      // Pass errors to the callback
      this.#logger.error(
        `mailError ${err.responseCode}:\t${emailLogString}`,
        err,
      )
      return Promise.reject(err)
    }
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
  #sendSingleAutoreplyMail = async ({
    autoReplyMailData,
    attachments,
    formSummaryRenderData,
    form,
    submission,
    index,
  }: SendSingleAutoreplyMailArgs) => {
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
      autoReplyBody,
      // Only destructure formSummaryRenderData if form summary is included.
      ...(autoReplyMailData.includeFormSummary && formSummaryRenderData),
    }

    const mailHtml = await generateAutoreplyHtml(templateData)

    const mail: MailOptions = {
      to: autoReplyMailData.email,
      from: `${emailSender} <${this.#senderMail}>`,
      subject: emailSubject,
      // Only send attachments if the admin has the box checked for email
      // fields.
      attachments: autoReplyMailData.includeFormSummary ? attachments : [],
      html: mailHtml,
      headers: {
        [EMAIL_HEADERS.formId]: String(form._id),
        [EMAIL_HEADERS.submissionId]: submission.id,
        [EMAIL_HEADERS.emailType]: EMAIL_TYPES.emailConfirmation,
      },
    }

    return this.#sendNodeMail(mail, {
      mailId: `${submission.id}-${index}`,
      formId: form._id,
    })
  }

  /**
   * Sends a verification otp to a valid email
   * @param recipient the recipient email address
   * @param otp the otp to send
   * @throws error if mail fails, to be handled by the caller
   */
  sendVerificationOtp = async (recipient: string, otp: string) => {
    // TODO(#42): Remove param guards once whole backend is TypeScript.
    if (!otp) {
      throw new Error('OTP is missing.')
    }

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
        [EMAIL_HEADERS.emailType]: EMAIL_TYPES.verificationOtp,
      },
    }
    // Error gets caught in getNewOtp
    return this.#sendNodeMail(mail, { mailId: 'verify' })
  }

  /**
   * Sends a login otp email to a valid email
   * @param recipient the recipient email address
   * @param otp the OTP to send
   * @throws error if mail fails, to be handled by the caller
   */
  sendLoginOtp = async ({
    recipient,
    otp,
    ipAddress,
  }: {
    recipient: string
    otp: string
    ipAddress: string
  }) => {
    const mail: MailOptions = {
      to: recipient,
      from: this.#senderFromString,
      subject: `One-Time Password (OTP) for ${this.#appName}`,
      html: await generateLoginOtpHtml({
        appName: this.#appName,
        appUrl: this.#appUrl,
        ipAddress: ipAddress,
        otp,
      }),
      headers: {
        [EMAIL_HEADERS.emailType]: EMAIL_TYPES.loginOtp,
      },
    }

    return this.#sendNodeMail(mail, { mailId: 'OTP' })
  }

  /**
   * Sends a submission response email to the admin of the given form.
   * @param args the parameter object
   * @param args.replyToEmails emails to set replyTo, if any
   * @param args.form the form document to retrieve some email data from
   * @param args.submission the submission document to retrieve some email data from
   * @param args.attachments attachments to append to the email, if any
   * @param args.jsonData the data to use in the data collation tool to be appended to the end of the email
   * @param args.formData the form data to display to in the body in table form
   */
  sendSubmissionToAdmin = async ({
    replyToEmails,
    form,
    submission,
    attachments,
    jsonData,
    formData,
  }: {
    replyToEmails?: string[]
    form: Pick<IEmailFormSchema, '_id' | 'title' | 'emails'>
    submission: Pick<ISubmissionSchema, 'id' | 'created'>
    attachments?: Mail.Attachment[]
    formData: any[]
    jsonData: {
      question: string
      answer: string | number
    }[]
  }) => {
    const refNo = submission.id
    const formTitle = form.title
    const submissionTime = moment(submission.created)
      .tz('Asia/Singapore')
      .format('ddd, DD MMM YYYY hh:mm:ss A')

    // Add in additional metadata to jsonData.
    // Unshift is not used as it mutates the array.
    const fullJsonData = [
      {
        question: 'Reference Number',
        answer: refNo,
      },
      {
        question: 'Timestamp',
        answer: submissionTime,
      },
      ...jsonData,
    ]

    const htmlData = {
      appName: this.#appName,
      formTitle,
      refNo,
      submissionTime,
      jsonData: fullJsonData,
      formData,
    }

    const mailHtml = await generateSubmissionToAdminHtml(htmlData)

    const mail: MailOptions = {
      to: form.emails,
      from: this.#senderFromString,
      subject: `formsg-auto: ${formTitle} (Ref: ${refNo})`,
      html: mailHtml,
      attachments,
      headers: {
        [EMAIL_HEADERS.formId]: String(form._id),
        [EMAIL_HEADERS.submissionId]: refNo,
        [EMAIL_HEADERS.emailType]: EMAIL_TYPES.adminResponse,
      },
      // replyTo options only allow string format.
      replyTo: replyToEmails?.join(', '),
    }

    return this.#sendNodeMail(mail, {
      mailId: refNo,
      formId: String(form._id),
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
  }: SendAutoReplyEmailsArgs) => {
    // Data to render both the submission details mail HTML body PDF.
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
      const pdfBuffer = await generateAutoreplyPdf(renderData)
      attachmentsWithAutoreplyPdf.push({
        filename: 'response.pdf',
        content: pdfBuffer,
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
}

export default new MailService()
