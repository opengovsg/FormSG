import { aws as AwsConfig } from 'src/app/config/config'
import {
  PdfGenerationLambdaFailureError,
  PdfGenerationLambdaInvocationError,
  PdfGenerationLambdaJsonParseError,
} from 'src/app/modules/core/core.errors'
import { _generatePdfFromHtmlLambdaForTest } from 'src/app/utils/convert-html-to-pdf'

jest.mock('puppeteer-core')
jest.mock('../../config/config')
jest.mock('../../modules/datadog/datadog.utils', () => ({
  startStopwatch: jest.fn(() => ({
    stop: jest.fn(() => 0),
  })),
  submitPdfGenerationLatencyMetric: jest.fn(),
  setErrorCode: jest.fn(),
  submitErrorCountMetric: jest.fn(),
}))

describe('convert-html-to-pdf', () => {
  const MOCK_HTML = '<html><body>Test</body></html>'
  const MOCK_PDF_BUFFER = Buffer.from('pdf content')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generatePdfFromHtmlLambda', () => {
    beforeEach(() => {
      AwsConfig.pdfGeneratorLambda.invoke = jest.fn()
    })

    it('should successfully generate PDF using lambda', async () => {
      // Arrange
      const mockLambdaResponse = {
        Payload: JSON.stringify({
          statusCode: 200,
          body: MOCK_PDF_BUFFER.toString('base64'),
        }),
      }
      ;(AwsConfig.pdfGeneratorLambda.invoke as jest.Mock).mockResolvedValueOnce(
        mockLambdaResponse,
      )

      // Act
      const result = await _generatePdfFromHtmlLambdaForTest(MOCK_HTML).map(
        (buffer) => buffer,
      )

      // Assert
      expect(AwsConfig.pdfGeneratorLambda.invoke).toHaveBeenCalledWith({
        FunctionName: AwsConfig.pdfGeneratorLambdaFunctionName,
        Payload: JSON.stringify({ html: MOCK_HTML }),
      })
      expect(result._unsafeUnwrap()).toEqual(MOCK_PDF_BUFFER)
    })

    it('should return error when lambda invocation fails', async () => {
      // Arrange
      const mockError = new Error('Lambda invocation failed')
      ;(AwsConfig.pdfGeneratorLambda.invoke as jest.Mock).mockRejectedValueOnce(
        mockError,
      )

      // Act
      const result = await _generatePdfFromHtmlLambdaForTest(MOCK_HTML)

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PdfGenerationLambdaInvocationError,
      )
    })

    it('should return error when lambda function name is not configured', async () => {
      // Arrange
      AwsConfig.pdfGeneratorLambdaFunctionName = ''

      // Act
      const result = await _generatePdfFromHtmlLambdaForTest(MOCK_HTML)

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PdfGenerationLambdaInvocationError,
      )
    })

    it('should return error when lambda response has no payload', async () => {
      // Arrange
      const mockLambdaResponse = { Payload: null }
      ;(AwsConfig.pdfGeneratorLambda.invoke as jest.Mock).mockResolvedValueOnce(
        mockLambdaResponse,
      )

      // Act
      const result = await _generatePdfFromHtmlLambdaForTest(MOCK_HTML)

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PdfGenerationLambdaJsonParseError,
      )
    })

    it('should return error when lambda response is not successful', async () => {
      // Arrange
      const mockLambdaResponse = {
        Payload: JSON.stringify({ statusCode: 500 }),
      }
      ;(AwsConfig.pdfGeneratorLambda.invoke as jest.Mock).mockResolvedValueOnce(
        mockLambdaResponse,
      )

      // Act
      const result = await _generatePdfFromHtmlLambdaForTest(MOCK_HTML)

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PdfGenerationLambdaFailureError,
      )
    })
  })
})
