import { APIGatewayProxyResult } from 'aws-lambda'
import { MalformedEventError, PdfLoadingError, PdfGenerationError, PuppeteerChromiumError } from './errors'
import { convertHtmlToPdf } from './pdfGen'

interface PdfGenerationEvent { 
  /*
   * HTML content to be converted to PDF 
   */
  html: string; 
}

const validatePdfGenerationEvent = (event: unknown): PdfGenerationEvent => {
  const isValidEvent = typeof event === 'object' && event !== null && 'html' in event && typeof event.html === 'string';
  if (!isValidEvent) {
    console.error({
      action: 'validatePdfGenerationEvent',
      message: 'Malformed event: Expected to contain valid html property',
    })
    throw new MalformedEventError();
  }
  return event as PdfGenerationEvent;
}

exports.handler = async (event: unknown): Promise<APIGatewayProxyResult> => {
  let html: string;

  try { 
    html = validatePdfGenerationEvent(event).html;
  } catch (error) { 
    if (error instanceof MalformedEventError) { 
      return { 
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
      }
    }
    return { 
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected server error' }),
    }
  }

  try { 
    const pdfBuffer = await convertHtmlToPdf(html);
    const pdfBase64 = pdfBuffer.toString('base64');
    return {
      statusCode: 200,
      body: pdfBase64,
      isBase64Encoded: true
    };
  } catch (error) {
    if (error instanceof PdfLoadingError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
      };
    }
    if (error instanceof PdfGenerationError) { 
      return { 
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      }
    }
    if (error instanceof PuppeteerChromiumError) { 
      return { 
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      }
    }
    console.error({
      action: 'handler',
      message: 'Unexpected server error occurred',
      error: error,
    })
    return { 
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected server error' }),
    }
  }
};
