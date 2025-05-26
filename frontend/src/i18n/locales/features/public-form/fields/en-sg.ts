import { Fields } from '.'

export const enSG: Fields = {
  yesNo: {
    yes: 'Yes',
    no: 'No',
  },
  option: {
    others: 'Others',
  },
  dropdown: {
    placeholder: 'Select an option',
    nothingFound: 'No matching results',
  },
  attachment: {
    fileUploaderLink: 'Choose file',
    dragAndDrop: ' or drag and drop here',
    dragActive: 'Drop the file here',
    maxFileSize: 'Maximum file size: {readableMaxSize}',
    fileConstraintsText: 'Files should not be more than 10 pages long.',
    ariaLabelRemove: 'Click to remove file',
    ariaLabelReplace: 'Click to replace file',
    error: {
      fileEmpty:
        'You have uploaded an empty file, please upload a valid attachment',
      fileTooLarge:
        'You have exceeded the file size limit, please upload a file below {readableMaxSize}',
      fileInvalidType:
        "Your file's extension ending in *{fileExt} is not allowed",
      tooManyFiles: 'You can only upload a single file in this input',
      zipFileInvalidType:
        'The following file extensions in your zip file are not valid: {stringOfInvalidExtensions}',
      zipParsing: 'An error has occurred whilst parsing your zip file',
    },
  },
  email: {
    validation: {
      domainDisallowed:
        'The entered email does not belong to an allowed email domain',
    },
  },
  verification: {
    button: {
      label: {
        verify: 'Verify',
        verified: 'Verified',
      },
    },
    modal: {
      email: {
        title: 'Verify your email',
        description:
          'An email with a 6-digit verification code was sent to you. It will be valid for 30 minutes.',
      },
      mobile: {
        title: 'Verify your mobile number',
        description:
          'An SMS with a 6-digit verification code was sent to you. It will be valid for 30 minutes.',
      },
    },
  },
  respondentEmail: {
    title: 'Send the following emails a copy of my responses upon submission',
    info: 'Separate multiple email addresses with a comma',
    respondentCopy: 'Send the following emails a copy of my responses',
    statusTracker:
      'Send the following emails a status tracking link upon submission',
    respondentCopyAndStatusTracker:
      'Send the following emails a copy of my responses and a status tracking link upon submission',
  },
}
