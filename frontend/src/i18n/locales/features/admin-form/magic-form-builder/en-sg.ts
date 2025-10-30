import { MagicFormBuilder } from '.'

export const enSG: MagicFormBuilder = {
  acceptDeny: {
    message: 'The created fields have been saved.\nKeep them?',
    keepButton: 'Yes, keep them',
    deleteButton: 'No, delete them',
  },
  button: {
    createFields: 'Create fields with AI',
  },
  smallButton: {
    tooltip: 'Create fields with AI',
  },
  promptModal: {
    header: 'Create fields with AI',
    tabs: {
      text: 'Text',
      pdf: 'Pdf',
    },
    textTab: {
      inspirationLabel: 'Need inspiration? Try one of these:',
      promptLabel: 'I want to create a form that collects...',
      promptPlaceholder:
        'Describe your form, including fields and sections to create',
      validation: {
        required: 'Please enter a prompt',
        maxLength: 'Please enter at most 500 characters',
      },
    },
    pdfTab: {
      uploadLabel: 'Create a form based on this pdf',
      uploadError: 'Please upload a pdf file',
      fileConstraints: 'Files should not be more than {maxPages} pages long.',
      conversionError: {
        unknown:
          'We encountered an unknown error while converting your PDF. Please try again with a different PDF.',
        timeout:
          'We encountered a timeout while converting your PDF. Please try again with a smaller PDF.',
        fileSizeTooLarge:
          'Your PDF is too large. Please try again with a smaller PDF.',
        invalidInputPdf:
          'We encountered an error while reading your PDF. Please ensure your PDF is valid and try again.',
        pdfEncrypted:
          'Your PDF is encrypted. Please remove the encryption and try again.',
        pdfHasNoText:
          'Your PDF does not contain any text. Please try again with a PDF that contains text.',
      },
    },
    actions: {
      create: 'Create fields',
      cancel: 'Cancel',
    },
  },
}
