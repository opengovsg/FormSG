const puppeteer = require('puppeteer-core')

exports.handler = async () => {
  const dummyHtml = '<h1>Hello World</h1>'
  const pdfBuffer = await generatePdfFromHtml(dummyHtml)

  const response = {
    statusCode: 200,
    body: pdfBuffer,
  }
  return response
}

/**
 * Utility function to generate a PDF from HTML.
 * Used to send autoreply emails, and to generate payment receipts
 * @param summaryHtml HTML to generate PDF from
 * @returns PDF Uint8Array
 */
const generatePdfFromHtml = async (summaryHtml) => {
  const browser = await puppeteer.launch({
    product: 'chrome',
    executablePath: '/var/task/chrome/linux-141.0.7354.0/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
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

generatePdfFromHtml()
