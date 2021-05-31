import dedent from 'dedent-js'
import ejs, { Data } from 'ejs'
import { combine, err, Result, ResultAsync } from 'neverthrow'
import puppeteer from 'puppeteer-core'

import { BounceType, Email } from '../../../types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'

import {
  InvalidMailAddressError,
  MailGenerationError,
  MailSendError,
} from './mail.errors'
import {
  AutoreplyHtmlData,
  AutoreplySummaryRenderData,
  BounceNotificationHtmlData,
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
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/otp-email.server.view.html`
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
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/submit-form-email.server.view.html`
  return safeRenderFile(pathToTemplate, htmlData)
}

export const generateBounceNotificationHtml = (
  htmlData: BounceNotificationHtmlData,
  bounceType: BounceType | undefined,
): ResultAsync<string, MailGenerationError> => {
  let pathToTemplate
  if (bounceType === BounceType.Permanent) {
    pathToTemplate = `${process.cwd()}/src/app/views/templates/bounce-notification-permanent.server.view.html`
  } else {
    pathToTemplate = `${process.cwd()}/src/app/views/templates/bounce-notification-transient.server.view.html`
  }

  return safeRenderFile(pathToTemplate, htmlData)
}

export const generateAutoreplyPdf = (
  renderData: AutoreplySummaryRenderData,
): ResultAsync<Buffer, MailGenerationError> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/submit-form-summary-pdf.server.view.html`

  return safeRenderFile(pathToTemplate, renderData).andThen((summaryHtml) => {
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
  })
}

export const generateAutoreplyHtml = (
  htmlData: AutoreplyHtmlData,
): ResultAsync<string, MailGenerationError> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/submit-form-autoreply.server.view.html`
  return safeRenderFile(pathToTemplate, htmlData)
}

export const isEmailValid = (addresses: Email | Email[]): boolean => {
  return Email.assert(addresses) || addresses.length > 0
}

export const areEmailsValid = (
  addresses: string[],
): Result<Email[], InvalidMailAddressError> => {
  const possibleEmailResults = addresses.map(Email.parse)
  if (possibleEmailResults.some((emailResult) => emailResult.isErr())) {
    return err(new InvalidMailAddressError())
  }

  // NOTE: This is provably safe because the check above returns an error if there are some strings
  // which cannot be parsed as an email.
  return combine(possibleEmailResults)
}
