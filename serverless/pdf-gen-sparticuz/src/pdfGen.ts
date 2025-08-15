import { PdfLoadingError, PdfGenerationError, PuppeteerChromiumError } from "./errors";
import chromium from "@sparticuz/chromium";
import puppeteer, { Browser, Page } from "puppeteer-core";

/**
 * Loads HTML content into a Puppeteer page
 * @param page - Puppeteer page instance
 * @param html - HTML content to load
 * @throws {PdfLoadingError} When HTML content cannot be loaded into the page
 */
const loadHtmlIntoPage = async (page: Page, html: string): Promise<void> => {
  try { 
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })
  } catch (error) { 
    const pdfLoadingError = new PdfLoadingError(undefined, error as Error);
    console.error({
      action: 'loadHtmlIntoPage',
      message: 'Error loading HTML into chromium page',
      error: pdfLoadingError,
    })
    throw pdfLoadingError;
  }
}

/**
 * Generates PDF from a Puppeteer page
 * @param page - Puppeteer page instance with loaded HTML content
 * @returns Promise<Buffer> - PDF buffer
 * @throws {PdfGenerationError} When PDF generation fails
 */
const generatePdf = async (page: Page): Promise<Buffer> => {
  try { 
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { 
      top: '20px',
      bottom: '40px',
    },
  })
  return Buffer.from(pdfBuffer);
  } catch (error) { 
    const pdfGenerationError = new PdfGenerationError(undefined, error as Error);
    console.error({
      action: 'generatePdf',
      message: 'Error generating PDF from Chromium loaded page',
      error: pdfGenerationError,
    })
    throw pdfGenerationError;
  }  
}

/**
 * Converts HTML content to PDF using Puppeteer and Chromium
 * @param html - HTML content to convert to PDF
 * @returns Promise<Buffer> - PDF buffer
 * @throws {PdfLoadingError} When HTML content cannot be loaded into the page
 * @throws {PdfGenerationError} When PDF generation fails
 * @throws {PuppeteerChromiumError} When Puppeteer Chromium browser initialization or operation fails
 */
export const convertHtmlToPdf = async (html: string): Promise<Buffer> => {
  let browser: Browser | undefined;
  try { 
    console.info({
      action: 'convertHtmlToPdf',
      message: 'HTML to PDF conversion started',
    })
    chromium.setGraphicsMode = false;
    const chromiumArgs = [...chromium.args, '--no-sandbox', '--disable-gpu']

    browser = await puppeteer.launch({
      args: puppeteer.defaultArgs({ args: chromiumArgs, headless: true }),
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await loadHtmlIntoPage(page, html);
    const pdfBuffer = await generatePdf(page);    
    console.info({
      action: 'convertHtmlToPdf',
      message: 'HTML to PDF conversion completed',
    })
    return pdfBuffer;
  } catch (error) { 
    if (error instanceof PdfLoadingError) { 
      throw error;
    }
    if (error instanceof PdfGenerationError) { 
      throw error;
    }
    const puppeteerChromiumError = new PuppeteerChromiumError(undefined, error as Error);
    console.error({
      action: 'convertHtmlToPdf',
      message: 'Error with Puppeteer or Chromium operation occurred',
      error: puppeteerChromiumError,
    })
    throw puppeteerChromiumError;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}