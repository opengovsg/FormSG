import { PdfLoadingError, PdfGenerationError, PuppeteerChromiumError } from '../errors'
import { convertHtmlToPdf } from '../pdfGen'

jest.mock('../pdfGen')

// Import the handler function using require to access the CommonJS export
const { handler } = require('../index')

describe('Lambda Handler', () => {
  const mockPdfBuffer = Buffer.from('mock pdf content')
  const validEvent = { html: '<html><body>Test</body></html>' }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(convertHtmlToPdf as jest.Mock).mockResolvedValue(mockPdfBuffer)
  })

  describe('validatePdfGenerationEvent', () => {
    it('should validate correct event format', async () => {
      const response = await handler(validEvent)
      expect(response.statusCode).toBe(200)
      expect(response.isBase64Encoded).toBe(true)
      expect(response.body).toBe(mockPdfBuffer.toString('base64'))
    })

    it('should return 400 when event is null', async () => {
      const response = await handler(null)
      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({
        error: 'Malformed event: Expected to contain valid html property'
      })
    })

    it('should return 400 when html property is missing', async () => {
      const response = await handler({url: 'https://www.example.com'})
      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({
        error: 'Malformed event: Expected to contain valid html property'
      })
    })

    it('should return 400 when html is not a string', async () => {
      const response = await handler({ html: 123 })
      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({
        error: 'Malformed event: Expected to contain valid html property'
      })
    })
  })

  describe('PDF Generation', () => {
    it('should return 400 when PDF loading fails', async () => {
      (convertHtmlToPdf as jest.Mock).mockRejectedValueOnce(new PdfLoadingError('Failed to load PDF'))
      const response = await handler(validEvent)
      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body)).toEqual({
        error: 'Failed to load PDF'
      })
    })

    it('should return 500 when PDF generation fails', async () => {
      (convertHtmlToPdf as jest.Mock).mockRejectedValueOnce(new PdfGenerationError('Failed to generate PDF'))
      const response = await handler(validEvent)
      expect(response.statusCode).toBe(500)
      expect(JSON.parse(response.body)).toEqual({
        error: 'Failed to generate PDF'
      })
    })

    it('should return 500 when Puppeteer fails', async () => {
      (convertHtmlToPdf as jest.Mock).mockRejectedValueOnce(new PuppeteerChromiumError('Browser launch failed'))
      const response = await handler(validEvent)
      expect(response.statusCode).toBe(500)
      expect(JSON.parse(response.body)).toEqual({
        error: 'Browser launch failed'
      })
    })

    it('should return 500 on unexpected errors', async () => {
      (convertHtmlToPdf as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'))
      const response = await handler(validEvent)
      expect(response.statusCode).toBe(500)
      expect(JSON.parse(response.body)).toEqual({
        error: 'Unexpected server error'
      })
    })
  })
})
