import { err, errAsync, ok, ResultAsync } from 'neverthrow'

import { aws as AwsConfig } from '../config/config'
import { createLoggerWithLabel } from '../config/logger'
import {
  PdfGenerationLambdaFailureError,
  PdfGenerationLambdaInvocationError,
  PdfGenerationLambdaJsonParseError,
} from '../modules/core/core.errors'

const logger = createLoggerWithLabel(module)

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

  if (!AwsConfig.pdfGeneratorLambdaFunctionName) {
    return errAsync(
      new PdfGenerationLambdaInvocationError(
        'Pdf generator lambda function name is not configured',
      ),
    )
  }

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
): Promise<Buffer> => {
  const logMeta = {
    action: 'generatePdfFromHtml',
  }

  logger.info({
    message: 'Generating pdf from html started',
    meta: logMeta,
  })

  const lambdaResultAsync = generatePdfFromHtmlLambda(summaryHtml)

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
    message: 'Successfully generated pdf from html using lambda',
    meta: { ...logMeta },
  })

  return lambdaResult.value
}

export const _generatePdfFromHtmlLambdaForTest = generatePdfFromHtmlLambda
