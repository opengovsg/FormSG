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
  AutoreplyHtmlData,
  AutoreplySummaryRenderData,
  BounceNotificationHtmlData,
  IssueReportedNotificationData,
  PaymentConfirmationData,
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

export const generatePaymentConfirmationHtml = ({
  htmlData,
}: {
  htmlData: PaymentConfirmationData
}): ResultAsync<string, MailGenerationError> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/payment-confirmation.view.html`
  logger.info({
    message: 'generatePaymentConfirmationHtml',
    meta: {
      action: 'generatePaymentConfirmationHtml',
      pathToTemplate,
    },
  })
  return safeRenderFile(pathToTemplate, htmlData)
}

export const generatePaymentOnboardingHtml = ({
  appName,
}: {
  appName: string
}): string => {
  return dedent`
  <p>Dear Form admin,</p>
  <p>Thank you for your interest in our payments feature! <a href="${paymentConfig.landingGuideLink}">Download our payments guide</a> to learn how to start collecting payments on your form today!</p>
  <p>If you have any questions regarding payments, feel free to reach out to support@form.gov.sg.</p>
  <p>Regards,
  <br/>
  ${appName}</p>
  `
}

export const generateIssueReportedNotificationHtml = ({
  htmlData,
}: {
  htmlData: IssueReportedNotificationData
}): ResultAsync<string, MailGenerationError> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/issue-reported-notification.view.html`
  logger.info({
    message: 'generateIssueReportedNotificationHtml',
    meta: {
      action: 'generateIssueReportedNotificationHtml',
      pathToTemplate,
    },
  })
  return safeRenderFile(pathToTemplate, htmlData)
}
