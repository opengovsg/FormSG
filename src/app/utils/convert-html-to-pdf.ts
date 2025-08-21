import { err, ok, ResultAsync } from 'neverthrow'
import puppeteer from 'puppeteer-core'

import config, { aws as AwsConfig } from '../config/config'
import { createLoggerWithLabel } from '../config/logger'
import {
  PdfGenerationLambdaFailureError,
  PdfGenerationLambdaInvocationError,
  PdfGenerationLambdaJsonParseError,
} from '../modules/core/core.errors'
import {
  startStopwatch,
  submitPdfGenerationLatencyMetric,
} from '../modules/datadog/datadog.utils'

const logger = createLoggerWithLabel(module)

// TODO [PDF-LAMBDA-GENERATION]: Remove this local invocation function and associated chromium deps in
// dev and prod Dockerfiles once pdf generation rollout is complete.
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

  logger.info({
    message: 'Successfully generated pdf from html using local',
    meta: {
      action: 'generatePdfFromHtmlLocally',
    },
  })
  return Buffer.from(pdfBuffer)
}

const generatePdfFromHtmlLambda = (
  summaryHtml: string,
): ResultAsync<
  Buffer,
  | PdfGenerationLambdaInvocationError
  | PdfGenerationLambdaJsonParseError
  | PdfGenerationLambdaFailureError
> => {
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
      return new PdfGenerationLambdaInvocationError()
    },
  )
    .andThen((data) => {
      if (!data.Payload) {
        return err(
          new PdfGenerationLambdaJsonParseError(
            'No payload received from pdf generator lambda',
          ),
        )
      }

      let response
      try {
        response = JSON.parse(Buffer.from(data.Payload).toString())
      } catch (error) {
        return err(
          new PdfGenerationLambdaJsonParseError(undefined, {
            error: error as Error,
          }),
        )
      }

      if (response.statusCode !== 200) {
        return err(new PdfGenerationLambdaFailureError())
      }

      const pdfBuffer = Buffer.from(response.body, 'base64')

      logger.info({
        message:
          'Successfully retrieved pdf response from pdf generator lambda',
        meta: logMeta,
      })

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
  isUseLambdaOutput: boolean,
): Promise<Buffer> => {
  const logMeta = {
    action: 'generatePdfFromHtml',
    isUseLambdaOutput,
  }

  logger.info({
    message: 'Generating pdf from html started',
    meta: logMeta,
  })

  const localStopwatch = startStopwatch()
  const localResult = generatePdfFromHtmlLocally(summaryHtml).then((result) => {
    const latencyMs = localStopwatch.stop()
    logger.info({
      message: 'Successfully generated pdf from html using local',
      meta: { ...logMeta, latencyMs },
    })
    submitPdfGenerationLatencyMetric({
      latencyMs,
      isLocal: true,
    })
    return result
  })

  const lambdaStopwatch = startStopwatch()
  const lambdaResultAsync = generatePdfFromHtmlLambda(summaryHtml).map(
    (result) => {
      const latencyMs = lambdaStopwatch.stop()
      logger.info({
        message: 'Successfully generated pdf from html using lambda',
        meta: { ...logMeta, latencyMs },
      })
      submitPdfGenerationLatencyMetric({
        latencyMs,
        isLocal: false,
      })
      return result
    },
  )

  if (isUseLambdaOutput) {
    const lambdaResult = await lambdaResultAsync
    if (lambdaResult.isErr()) {
      logger.error({
        message: 'Error generating pdf from html using lambda',
        meta: logMeta,
        error: lambdaResult.error,
      })
      throw lambdaResult.error
    }

    logger.info({
      message:
        'Successfully generated pdf from html - using result from lambda pdf generation',
      meta: logMeta,
    })
    return lambdaResult.value
  }

  logger.info({
    message:
      'Successfully generated pdf from html - using result from local pdf generation',
    meta: logMeta,
  })
  return await localResult
}

export const _generatePdfFromHtmlLocallyForTest = generatePdfFromHtmlLocally
export const _generatePdfFromHtmlLambdaForTest = generatePdfFromHtmlLambda
