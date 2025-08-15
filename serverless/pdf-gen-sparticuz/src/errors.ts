export class MalformedEventError extends Error { 
  constructor(message = 'Malformed event: Expected to contain valid html property', error?: Error) {
    super(message);
    this.name = 'MalformedEventError';
    this.stack = error?.stack;
  }
}

export class PdfLoadingError extends Error { 
  constructor(message = 'Error loading PDF: Failed to load PDF into Chromium', error?: Error) {
    super(message);
    this.name = 'PdfLoadingError';
    this.stack = error?.stack;
  }
}

export class PdfGenerationError extends Error { 
  constructor(message = 'Error generating PDF: Failed to convert HTML to PDF', error?: Error) {
    super(message);
    this.name = 'PdfGenerationError';
    this.stack = error?.stack;
  }
}

export class PuppeteerChromiumError extends Error { 
  constructor(message = 'Error with Puppeteer Chromium operation occurred', error?: Error) {
    super(message);
    this.name = 'PuppeteerChromiumError';
    this.stack = error?.stack;
  }
} 