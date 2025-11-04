import puppeteer from 'puppeteer-core'

import { aws as AwsConfig } from 'src/app/config/config'
import {
  PdfGenerationLambdaFailureError,
  PdfGenerationLambdaInvocationError,
  PdfGenerationLambdaJsonParseError,
} from 'src/app/modules/core/core.errors'
import {
  _generatePdfFromHtmlLambdaForTest,
  _generatePdfFromHtmlLocallyForTest,
  generatePdfFromHtml,
} from 'src/app/utils/convert-html-to-pdf'

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

  describe('generatePdfFromHtmlLocally', () => {
    const mockPage = {
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(MOCK_PDF_BUFFER),
    }

    const mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    }

    beforeEach(() => {
      ;(puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser)
    })

    // TODO: [PDF-LAMBDA-GENERATION]: Remove tests for local pdf generation once lambda is rolled out
    it('should generate PDF locally using puppeteer', async () => {
      // Act
      const result = await _generatePdfFromHtmlLocallyForTest(MOCK_HTML)

      // Assert
      expect(puppeteer.launch).toHaveBeenCalled()
      expect(mockPage.setContent).toHaveBeenCalledWith(MOCK_HTML, {
        waitUntil: 'networkidle0',
      })
      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '40px',
        },
      })
      expect(mockBrowser.close).toHaveBeenCalled()
      expect(result).toEqual(MOCK_PDF_BUFFER)
    })
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

  // TODO: [PDF-LAMBDA-GENERATION]: Remove tests for shadowing and using the correct output based on isUseLambdaOutput once lambda is rolled out
  describe('generatePdfFromHtml', () => {
    beforeEach(() => {
      AwsConfig.pdfGeneratorLambda.invoke = jest.fn()
    })

    it('should use lambda output when isUseLambdaOutput is true and not use local output and AwsConfig.pdfGeneratorLambdaFunctionName is defined', async () => {
      // Arrange
      const mockLambdaBuffer = Buffer.from('lambda pdf content')
      const mockLocalBuffer = Buffer.from('local pdf content')

      const DUMMY_PDF_GENERATOR_FUNCTION_NAME =
        'dummy-pdf-generator-function-name'
      AwsConfig.pdfGeneratorLambdaFunctionName =
        DUMMY_PDF_GENERATOR_FUNCTION_NAME

      // Mock lambda response
      const mockLambdaResponse = {
        Payload: JSON.stringify({
          statusCode: 200,
          body: mockLambdaBuffer.toString('base64'),
        }),
      }
      ;(AwsConfig.pdfGeneratorLambda.invoke as jest.Mock).mockResolvedValueOnce(
        mockLambdaResponse,
      )

      // Mock local response
      const mockPage = {
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockLocalBuffer),
      }
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn(),
      }
      ;(puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser)

      // Act
      const result = await generatePdfFromHtml(MOCK_HTML, true)

      // Assert
      expect(result).toEqual(mockLambdaBuffer)
      expect(result).not.toEqual(mockLocalBuffer)

      // Verify the lambda invocation parameters
      expect(AwsConfig.pdfGeneratorLambda.invoke).toHaveBeenCalledWith({
        FunctionName: DUMMY_PDF_GENERATOR_FUNCTION_NAME,
        Payload: JSON.stringify({ html: MOCK_HTML }),
      })
    })

    it('should generate PDFs using both methods in parallel regardless of isUseLambdaOutput setting if AwsConfig.pdfGeneratorLambdaFunctionName is defined', async () => {
      // Arrange
      const mockLambdaBuffer = Buffer.from('lambda pdf content')
      const mockLocalBuffer = Buffer.from('local pdf content')

      // Mock lambda response
      const mockLambdaResponse = {
        Payload: JSON.stringify({
          statusCode: 200,
          body: mockLambdaBuffer.toString('base64'),
        }),
      }

      // Mock AWS config to ensure lambda function name is defined
      const DUMMY_PDF_GENERATOR_FUNCTION_NAME =
        'dummy-pdf-generator-function-name'
      AwsConfig.pdfGeneratorLambdaFunctionName =
        DUMMY_PDF_GENERATOR_FUNCTION_NAME
      ;(AwsConfig.pdfGeneratorLambda.invoke as jest.Mock)
        .mockResolvedValueOnce(mockLambdaResponse)
        .mockResolvedValueOnce(mockLambdaResponse)

      // Mock local response
      const mockPage = {
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(mockLocalBuffer),
      }
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn(),
      }
      ;(puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser)

      // Act
      await Promise.all([
        generatePdfFromHtml(MOCK_HTML, true),
        generatePdfFromHtml(MOCK_HTML, false),
      ])

      // Assert
      // Both lambda and local generation should be called for each invocation
      expect(AwsConfig.pdfGeneratorLambda.invoke).toHaveBeenCalledTimes(2)
      expect(puppeteer.launch).toHaveBeenCalledTimes(0)
      expect(mockPage.pdf).toHaveBeenCalledTimes(0)

      // Verify the lambda invocation parameters
      expect(AwsConfig.pdfGeneratorLambda.invoke).toHaveBeenCalledWith({
        FunctionName: DUMMY_PDF_GENERATOR_FUNCTION_NAME,
        Payload: JSON.stringify({ html: MOCK_HTML }),
      })
    })
  })
})
