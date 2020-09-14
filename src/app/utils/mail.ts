import dedent from 'dedent-js'
import ejs from 'ejs'
import { flattenDeep } from 'lodash'
import { ResultAsync } from 'neverthrow'
import puppeteer from 'puppeteer-core'
import validator from 'validator'

import {
  AutoreplyHtmlData,
  AutoreplySummaryRenderData,
  SubmissionToAdminHtmlData,
} from 'src/types'

import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { MailSendError } from '../modules/mail/mail.errors'

const logger = createLoggerWithLabel(module)

export const generateLoginOtpHtml = (htmlData: {
  otp: string
  appName: string
  appUrl: string
  ipAddress: string
}): ResultAsync<string, MailSendError> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/otp-email.server.view.html`
  return ResultAsync.fromPromise(
    ejs.renderFile(pathToTemplate, htmlData),
    (error) => {
      logger.error({
        message: 'Error occurred whilst rendering login otp ejs',
        meta: {
          action: 'generateLoginOtpHtml',
        },
        error,
      })

      return new MailSendError()
    },
  )
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

export const generateSubmissionToAdminHtml = async (
  htmlData: SubmissionToAdminHtmlData,
): Promise<string> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/submit-form-email.server.view.html`
  return ejs.renderFile(pathToTemplate, htmlData)
}

export const generateAutoreplyPdf = async (
  renderData: AutoreplySummaryRenderData,
): Promise<Buffer> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/submit-form-summary-pdf.server.view.html`

  const summaryHtml = await ejs.renderFile(pathToTemplate, renderData)
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

export const generateAutoreplyHtml = async (
  htmlData: AutoreplyHtmlData,
): Promise<string> => {
  const pathToTemplate = `${process.cwd()}/src/app/views/templates/submit-form-autoreply.server.view.html`
  return ejs.renderFile(pathToTemplate, htmlData)
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
        // Split by both commas and semicolons, as some legacy emails are
        // delimited by semicolons.
        .split(/,|;/)
        .map((addr) => addr.trim()),
    ),
  )

  // Every address must be an email to be valid.
  return mails.every((addr) => validator.isEmail(addr))
}
