const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const convertHtmlToPdf = async (html) => {
  chromium.setGraphicsMode = false;
  const chromiumArgs = [...chromium.args, '--no-sandbox', '--disable-gpu']

  const browser = await puppeteer.launch({
    args: puppeteer.defaultArgs({ args: chromiumArgs, headless: true }),
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, {
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
  await browser.close();
  return pdfBuffer;
}

exports.handler = async (event) => {
  const html = event.html;
  const pdfBuffer = await convertHtmlToPdf(html);
  const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

  return {
    statusCode: 200,
    body: pdfBase64,
    isBase64Encoded: true
  };
};