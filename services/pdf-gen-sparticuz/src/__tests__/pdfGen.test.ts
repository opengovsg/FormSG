import { Browser, Page } from 'puppeteer-core'
import { PdfLoadingError, PdfGenerationError, PuppeteerChromiumError } from '../errors'
import { convertHtmlToPdf } from '../pdfGen'
import puppeteer from 'puppeteer-core'

jest.mock('puppeteer-core')
jest.mock('@sparticuz/chromium', () => ({
  executablePath: jest.fn().mockResolvedValue('/path/to/chrome'),
  args: ['--arg1', '--arg2'],
  setGraphicsMode: false
}))

describe('convertHtmlToPdf', () => {
  let mockBrowser: jest.Mocked<Browser>
  let mockPage: jest.Mocked<Page>
  const mockPdfBuffer = Buffer.from('mock pdf content')
  
  beforeEach(() => {
    mockPage = {
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(mockPdfBuffer),
    } as unknown as jest.Mocked<Page>

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Browser>

    ;(puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser)
    ;(puppeteer.defaultArgs as jest.Mock).mockReturnValue(['--default-arg'])
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully convert HTML to PDF', async () => {
    const html = '<html><body>Test</body></html>'
    const result = await convertHtmlToPdf(html)

    expect(result).toEqual(mockPdfBuffer)
    expect(mockPage.setContent).toHaveBeenCalledWith(html, { waitUntil: 'networkidle0' })
    expect(mockPage.pdf).toHaveBeenCalledWith({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '40px',
      }
    })
    expect(mockBrowser.close).toHaveBeenCalled()
  })

  it('should throw PdfLoadingError when page.setContent fails', async () => {
    const error = new Error('Failed to load')
    mockPage.setContent.mockRejectedValueOnce(error)

    await expect(convertHtmlToPdf('<html></html>')).rejects.toThrow(PdfLoadingError)
    expect(mockBrowser.close).toHaveBeenCalled()
  })

  it('should throw PdfGenerationError when page.pdf fails', async () => {
    const error = new Error('Failed to generate PDF')
    mockPage.pdf.mockRejectedValueOnce(error)

    await expect(convertHtmlToPdf('<html></html>')).rejects.toThrow(PdfGenerationError)
    expect(mockBrowser.close).toHaveBeenCalled()
  })

  it('should throw PuppeteerChromiumError when browser launch fails', async () => {
    const error = new Error('Browser launch failed')
    ;(puppeteer.launch as jest.Mock).mockRejectedValueOnce(error)

    await expect(convertHtmlToPdf('<html></html>')).rejects.toThrow(PuppeteerChromiumError)
  })
})
