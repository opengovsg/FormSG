import tracer from 'dd-trace'
import puppeteer from 'puppeteer-core'

import config from '../config/config'

/**
 * Utility function to generate a PDF from HTML.
 * Used to send autoreply emails, and to generate payment receipts
 * @param summaryHtml HTML to generate PDF from
 * @returns PDF buffer
 */
export const generatePdfFromHtml = async (
  summaryHtml: string,
): Promise<Buffer> => {
  return tracer.trace('generatePdfFromHtml', async () => {
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
  })
}
