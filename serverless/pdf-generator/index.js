const puppeteer = require('puppeteer-core')
const { execSync } = require('child_process')

const chromePath = '/usr/bin/google-chrome-stable'

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
 * Check if Chrome executable exists and can run
 */
const checkChrome = () => {
  try {
    console.log('Checking Chrome executable...')

    // Check if file exists
    const stats = execSync(`ls -la "${chromePath}"`, { encoding: 'utf8' })
    console.log('Chrome executable found:', stats)

    // Check Chrome version
    const version = execSync(`"${chromePath}" --version`, { encoding: 'utf8' })
    console.log('Chrome version:', version)

    return true
  } catch (error) {
    console.error('Chrome check failed:', error.message)
    return false
  }
}

/**
 * Utility function to generate a PDF from HTML.
 * Used to send autoreply emails, and to generate payment receipts
 * @param summaryHtml HTML to generate PDF from
 * @returns PDF Uint8Array
 */
const generatePdfFromHtml = async (summaryHtml) => {
  let browser = null
  try {
    // First check if Chrome is working
    if (!checkChrome()) {
      throw new Error('Chrome executable check failed')
    }

    console.log('Launching Chrome...')
    browser = await puppeteer
      .launch({
        dumpio: true,
        product: 'chrome',
        headless: true,
        executablePath: chromePath,
        args: [
          '--headless',
          '--in-process-gpu',
          '--no-sandbox',
          '--disable-gpu',
        ],
        timeout: 60000, // 60 second timeout
      })
      .catch((error) => {
        console.error('Chrome launch failed:', error)
        throw error
      })

    console.log('Chrome launched successfully')
    const page = await browser.newPage()
    console.log('Page created')

    await page.setContent(summaryHtml, {
      waitUntil: 'networkidle0',
    })
    console.log('Content set')

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '40px',
      },
    })
    console.log('PDF generated')

    return pdfBuffer
  } catch (error) {
    console.error('Error in generatePdfFromHtml:', error)
    throw error
  } finally {
    if (browser) {
      try {
        await browser.close()
        console.log('Browser closed')
      } catch (closeError) {
        console.error('Error closing browser:', closeError)
      }
    }
  }
}

// Add proper error handling for the main execution
generatePdfFromHtml().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
