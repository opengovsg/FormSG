import dedent from 'dedent-js'
import ejs, { Data } from 'ejs'
import { flattenDeep } from 'lodash'
import { ResultAsync } from 'neverthrow'
import validator from 'validator'

import { BounceType } from '../../../types'
import { paymentConfig } from '../../config/features/payment.config'
import { createLoggerWithLabel } from '../../config/logger'
import { generatePdfFromHtml } from '../../utils/convert-html-to-pdf'

import { MailGenerationError, MailSendError } from './mail.errors'
import {
  AdminSmsDisabledData,
  AdminSmsWarningData,
  AutoreplyHtmlData,
  AutoreplySummaryRenderData,
  BounceNotificationHtmlData,
  CollabSmsDisabledData,
  CollabSmsWarningData,
  SubmissionToAdminHtmlData,
} from './mail.types'

const logger = createLoggerWithLabel(module)

const safeRenderFile = (
  pathToTemplate: string,
  htmlData: Data,
): ResultAsync<string, MailGenerationError> => {
  return ResultAsync.fromPromise(
    ejs.renderFile(pathToTemplate, htmlData),
    (error) => {
      logger.error({
        meta: {
          action: 'safeRenderFile',
        },
        message: 'Error occurred whilst rendering ejs data',
        error,
      })

      return new MailGenerationError(
        'Error occurred whilst rendering mail template',
      )
    },
  )
}

export const generateLoginOtpHtml = (htmlData: {
  otpPrefix: string
  otp: string
  appName: string
  appUrl: string
  ipAddress: string
}): ResultAsync<string, MailSendError> => {
  const pathToTemplate = `${__dirname}/../../views/templates/otp-email.server.view.html`

  logger.info({
    message: 'generateLoginOtpHtml',
    meta: {
      action: 'generateLoginOtpHtml',
      pathToTemplate,
      __dirname,
      cwd: process.cwd(),
    },
  })

  return safeRenderFile(pathToTemplate, htmlData)
}

export const generateVerificationOtpHtml = ({
  otp,
  otpPrefix,
  appName,
  minutesToExpiry,
}: {
  otp: string
  otpPrefix: string
  appName: string
  minutesToExpiry: number
}): string => {
  return dedent`
    <p>You are currently submitting a form on ${appName}.</p>
    <p>
      Your OTP is ${otpPrefix}-<b>${otp}</b>. It will expire in ${minutesToExpiry} minutes.
      Please use this to verify your submission.
    </p>
    <p>If your OTP does not work, please request for a new OTP.</p>
    <br />
    <p>If you did not make this request, you may ignore this email.</p>
    <br />
    <p>The ${appName} Support Team</p>
  `
}

export const generateSubmissionToAdminHtml = (
  htmlData: SubmissionToAdminHtmlData,
): ResultAsync<string, MailGenerationError> => {
  const pathToTemplate = `${__dirname}/../../views/templates/submit-form-email.server.view.html`

  logger.info({
    message: 'generateSubmissionToAdminHtml',
    meta: {
      action: 'generateSubmissionToAdminHtml',
      pathToTemplate,
      __dirname,
      cwd: process.cwd(),
    },
  })

  return safeRenderFile(pathToTemplate, htmlData)
}

export const generateBounceNotificationHtml = (
  htmlData: BounceNotificationHtmlData,
  bounceType: BounceType | undefined,
): ResultAsync<string, MailGenerationError> => {
  let pathToTemplate
  if (bounceType === BounceType.Permanent) {
    pathToTemplate = `${__dirname}/../../views/templates/bounce-notification-permanent.server.view.html`
  } else {
    pathToTemplate = `${__dirname}/../../views/templates/bounce-notification-transient.server.view.html`
  }

  logger.info({
    message: 'generateBounceNotificationHtml',
    meta: {
      action: 'generateBounceNotificationHtml',
      pathToTemplate,
      __dirname,
      cwd: process.cwd(),
    },
  })

  return safeRenderFile(pathToTemplate, htmlData)
}

export const generateAutoreplyPdf = (
  renderData: AutoreplySummaryRenderData,
): ResultAsync<Buffer, MailGenerationError> => {
  const pathToTemplate = `${__dirname}/../../views/templates/submit-form-summary-pdf.server.view.html`

  logger.info({
    message: 'generateAutoreplyPdf',
    meta: {
      action: 'generateAutoreplyPdf',
      pathToTemplate,
      __dirname,
      cwd: process.cwd(),
    },
  })

  return safeRenderFile(pathToTemplate, renderData).andThen((summaryHtml) => {
    return ResultAsync.fromPromise(
      generatePdfFromHtml(summaryHtml),
      (error) => {
        logger.error({
          meta: {
            action: 'generateAutoreplyPdf',
          },
          message: 'Error occurred whilst generating autoreply PDF',
          error,
        })

        return new MailGenerationError(
          'Error occurred whilst generating autoreply PDF',
        )
      },
    )
  })
}

export const generateAutoreplyHtml = (
  htmlData: AutoreplyHtmlData,
): ResultAsync<string, MailGenerationError> => {
  const pathToTemplate = `${__dirname}/../../views/templates/submit-form-autoreply.server.view.html`
  logger.info({
    message: 'generateAutoreplyHtml',
    meta: {
      action: 'generateAutoreplyHtml',
      pathToTemplate,
      __dirname,
      cwd: process.cwd(),
    },
  })
  return safeRenderFile(pathToTemplate, htmlData)
}

export const isToFieldValid = (addresses: string | string[]): boolean => {
  // Retrieve all emails from each address.
  // As addresses can be strings or a string array, cast given addresses param
  // into an array regardless and flatten deep.
  // The individual strings may still be an comma separated string, and thus
  // further splitting is necessary.
  // The final result is once again flattened.
  const mails = flattenDeep(
    flattenDeep([addresses]).map((addrString) =>
      String(addrString)
        .split(',')
        .map((addr) => addr.trim()),
    ),
  )

  // Every address must be an email to be valid.
  return mails.every((addr) => validator.isEmail(addr))
}

export const generateSmsVerificationDisabledHtmlForAdmin = (
  htmlData: AdminSmsDisabledData,
): ResultAsync<string, MailGenerationError> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/sms-verification-disabled-admin.server.view.html`
  logger.info({
    message: 'generateSmsVerificationDisabledHtmlForAdmin',
    meta: {
      action: 'generateSmsVerificationDisabledHtmlForAdmin',
      pathToTemplate,
      __dirname,
      cwd: process.cwd(),
    },
  })
  return safeRenderFile(pathToTemplate, htmlData)
}

export const generateSmsVerificationDisabledHtmlForCollab = (
  htmlData: CollabSmsDisabledData,
): ResultAsync<string, MailGenerationError> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/sms-verification-disabled-collab.server.view.html`
  logger.info({
    message: 'generateSmsVerificationDisabledHtmlForCollab',
    meta: {
      action: 'generateSmsVerificationDisabledHtmlForCollab',
      pathToTemplate,
      __dirname,
      cwd: process.cwd(),
    },
  })
  return safeRenderFile(pathToTemplate, htmlData)
}

export const generateSmsVerificationWarningHtmlForAdmin = (
  htmlData: AdminSmsWarningData,
): ResultAsync<string, MailGenerationError> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/sms-verification-warning-admin.view.html`
  logger.info({
    message: 'generateSmsVerificationWarningHtmlForAdmin',
    meta: {
      action: 'generateSmsVerificationWarningHtmlForAdmin',
      pathToTemplate,
      __dirname,
      cwd: process.cwd(),
    },
  })
  return safeRenderFile(pathToTemplate, htmlData)
}

export const generateSmsVerificationWarningHtmlForCollab = (
  htmlData: CollabSmsWarningData,
): ResultAsync<string, MailGenerationError> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/sms-verification-warning-collab.view.html`
  logger.info({
    message: 'generateSmsVerificationWarningHtmlForCollab',
    meta: {
      action: 'generateSmsVerificationWarningHtmlForCollab',
      pathToTemplate,
      __dirname,
      cwd: process.cwd(),
    },
  })
  return safeRenderFile(pathToTemplate, htmlData)
}

export const generatePaymentConfirmationHtml = ({
  formTitle,
  submissionId,
  appName,
  invoiceUrl,
}: {
  formTitle: string
  submissionId: string
  appName: string
  invoiceUrl: string
}): string => {
  return dedent`
    <p>Hello there,</p>
    <p>
      Your payment on ${appName} form: ${formTitle} has been received successfully.
      Your response ID is ${submissionId} and your payment invoice can be found 
      <a href="${invoiceUrl}">here</a>.
    </p>
    <p>Regards,
    <br />
    ${appName} team</p>   
  `
}

export const generatePaymentOnboardingHtml = (): string => {
  return dedent`
  <p>Dear Sir or Madam,</p>
  <p>Thank you for your interest in our payments feature! <a href="${paymentConfig.landingGuideLink}">Download the file</a> to learn how to get started with payments today!</p>
  <p>If you have any questions regarding payments, feel free to reach out to support@form.gov.sg.</p>
  <p>Regards,
  <br/>
  FormSG</p>
  `
}
