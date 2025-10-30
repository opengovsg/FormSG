export * from './en-sg'

export interface MagicFormBuilder {
  acceptDeny: {
    message: string
    keepButton: string
    deleteButton: string
  }
  button: {
    createFields: string
  }
  smallButton: {
    tooltip: string
  }
  promptModal: {
    header: string
    tabs: {
      text: string
      pdf: string
    }
    textTab: {
      inspirationLabel: string
      promptLabel: string
      promptPlaceholder: string
      validation: {
        required: string
        maxLength: string
      }
    }
    pdfTab: {
      uploadLabel: string
      uploadError: string
      fileConstraints: string
      conversionError: {
        unknown: string
        timeout: string
        fileSizeTooLarge: string
        invalidInputPdf: string
        pdfEncrypted: string
        pdfHasNoText: string
      }
    }
    actions: {
      create: string
      cancel: string
    }
  }
}
