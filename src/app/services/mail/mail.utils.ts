import tracer from 'dd-trace'
import dedent from 'dedent-js'
import ejs, { Data } from 'ejs'
import { flattenDeep } from 'lodash'
import { ResultAsync } from 'neverthrow'
import puppeteer from 'puppeteer-core'
import validator from 'validator'

import { BounceType } from '../../../types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'

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

const generateAutoreplyPdfPromise = async (
  summaryHtml: string,
): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    headless: true,
    executablePath: config.chromiumBin,
  })
  const page = await browser.newPage()
  await page.setContent(summaryHtml, {
    waitUntil: 'networkidle0',
  })
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      bottom: '40px',
    },
  })
  await browser.close()
  return pdfBuffer
}

export const generateLoginOtpHtml = (htmlData: {
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
  appName,
  minutesToExpiry,
}: {
  otp: string
  appName: string
  minutesToExpiry: number
}): string => {
  return dedent`
    <p>You are currently submitting a form on ${appName}.</p>
    <p>
      Your OTP is <b>${otp}</b>. It will expire in ${minutesToExpiry} minutes.
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

  // TODO: Remove tracer once issue is resolved.
  return tracer.trace('generateAutoreplyPdf', () =>
    safeRenderFile(pathToTemplate, renderData).andThen((summaryHtml) => {
      return ResultAsync.fromPromise(
        generateAutoreplyPdfPromise(summaryHtml),
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
    }),
  )
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
