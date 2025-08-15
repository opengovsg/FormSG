import tracer from 'dd-trace'
import { err, ok, ResultAsync } from 'neverthrow'
import puppeteer from 'puppeteer-core'
import config, { aws as AwsConfig, isDevOrTest } from '../config/config'
import { createLoggerWithLabel } from '../config/logger'

const logger = createLoggerWithLabel(module)

const generatePdfFromHtmlLocally = async (
  summaryHtml: string,
): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-gpu', // See https://github.com/puppeteer/puppeteer/issues/11640#issuecomment-2361858540
    ],
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
  return Buffer.from(pdfBuffer)
}

const generatePdfFromHtmlLambda = (
  summaryHtml: string,
): ResultAsync<Buffer, Error> => {
  const logMeta = {
    action: 'generatePdfFromHtmlLambda',
  }

  logger.info({
    message: 'Invoking pdf generator lambda',
    meta: logMeta,
  })

  return ResultAsync.fromPromise(
    AwsConfig.pdfGeneratorLambda.invoke({
      FunctionName: AwsConfig.pdfGeneratorLambdaFunctionName,
      Payload: JSON.stringify({ html: summaryHtml }),
    }),
    (error) => {
      logger.error({
        message: 'Error when invoking pdf generator lambda',
        meta: logMeta,
        error,
      })
      return new Error('Error when invoking pdf generator lambda')
    },
  )
    .andThen((data) => {
      if (!data.Payload) {
        return err(new Error('No payload from pdf generator lambda'))
      }

      const response = JSON.parse(Buffer.from(data.Payload).toString())
      if (response.statusCode !== 200) {
        return err(new Error('Non-200 status code from pdf generator lambda'))
      }

      const pdfBuffer = Buffer.from(response.body, 'base64')
      return ok(pdfBuffer)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error generating pdf from html using lambda',
        meta: logMeta,
        error,
      })
      return error
    })
}

/**
 * Utility function to generate a PDF from HTML.
 * Used to send autoreply emails, and to generate payment receipts
 * @param summaryHtml HTML to generate PDF from
 * @returns PDF Buffer
 */
export const generatePdfFromHtml = async (
  summaryHtml: string,
): Promise<Buffer> => {
  return tracer.trace('generatePdfFromHtml', async () => {
    if (isDevOrTest) {
      return generatePdfFromHtmlLocally(summaryHtml)
    }
    const result = await generatePdfFromHtmlLambda(summaryHtml)
    if (result.isErr()) {
      throw result.error
    }
    return result.value
  })
}
