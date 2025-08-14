import tracer from 'dd-trace'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import { aws as AwsConfig } from '../config/config'
import { createLoggerWithLabel } from '../config/logger'

const logger = createLoggerWithLabel(module)

export const generatePdfFromHtmlLambda = (
  summaryHtml: string,
): ResultAsync<Uint8Array, Error> => {
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
        message: 'Error invoking pdf generator lambda',
        meta: logMeta,
        error,
      })
      return new Error('Error invoking pdf generator lambda')
    },
  ).andThen((result) => {
    if (!result.Payload) {
      return err(new Error('No payload from pdf generator lambda'))
    }

    const safeJSONParse = Result.fromThrowable(JSON.parse, (error) => {
      logger.error({
        message: 'Error parsing payload from pdf generator lambda',
        meta: logMeta,
        error,
      })
      return new Error('Error parsing payload from pdf generator lambda')
    })

    const parsedPayload = safeJSONParse(Buffer.from(result.Payload).toString())

    if (parsedPayload.isErr()) {
      return err(parsedPayload.error)
    }

    if (!('body' in parsedPayload.value)) {
      return err(new Error('No body in payload from pdf generator lambda'))
    }

    if (parsedPayload.value.statusCode !== 200) {
      return err(new Error('Non-200 status code from pdf generator lambda'))
    }

    const base64Pdf = parsedPayload.value.body

    // Convert base64 encoded PDF string from lambda response back into a Buffer
    return ok(Buffer.from(base64Pdf, 'base64'))
  })
}

/**
 * Utility function to generate a PDF from HTML.
 * Used to send autoreply emails, and to generate payment receipts
 * @param summaryHtml HTML to generate PDF from
 * @returns PDF Uint8Array
 */
export const generatePdfFromHtml = async (
  summaryHtml: string,
): Promise<Uint8Array> => {
  return tracer.trace('generatePdfFromHtml', async () => {
    logger.info({
      message: 'Generating pdf from html',
      meta: {
        action: 'generatePdfFromHtml',
        summaryHtml,
      },
    })

    const res = await generatePdfFromHtmlLambda(summaryHtml).map((pdf) => {
      logger.info({
        message: 'Generated pdf from html',
        meta: {
          action: 'generatePdfFromHtml',
        },
      })
      return pdf
    })

    if (res.isErr()) {
      throw res.error
    }

    return res.value

    //   const browser = await puppeteer.launch({
    //     args: [
    //       '--no-sandbox',
    //       '--disable-gpu', // See https://github.com/puppeteer/puppeteer/issues/11640#issuecomment-2361858540
    //     ],
    //     headless: true,
    //     executablePath: config.chromiumBin,
    //   })
    //   const page = await browser.newPage()
    //   await page.setContent(summaryHtml, {
    //     waitUntil: 'networkidle0',
    //   })
    //   const pdfBuffer = await page.pdf({
    //     format: 'A4',
    //     printBackground: true,
    //     margin: {
    //       top: '20px',
    //       bottom: '40px',
    //     },
    //   })
    //   await browser.close()
    //   return pdfBuffer
    // })
  })
}
