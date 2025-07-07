import { Fields } from '.'

export const enSG: Fields = {
  builder: {
    title: 'Fields',
    createField: 'Create field',
    addFields: 'Add Fields',
    image: 'Image',
    statement: 'Paragraph',
    section: 'Heading',
    attachment: 'Attachment',
    checkbox: 'Checkbox',
    date: 'Date',
    decimal: 'Decimal',
    dropdown: 'Dropdown',
    countryRegion: 'Country/Region',
    email: 'Email',
    homeNumber: 'Home number',
    mobileNumber: 'Mobile number',
    longText: 'Long answer',
    nik: 'NIK / KK',
    number: 'Number',
    radio: 'Radio',
    rating: 'Rating',
    shortAnswer: 'Short answer',
    table: 'Table',
    yesNo: 'Yes/No',
    children: 'Children',
  },
  commonFieldComponents: {
    title: 'Field Name',
    description: 'Description',
    required: 'Required',
    noCharactersAllowed: 'Number of characters allowed',
    charactersAllowedPlaceholder: 'Number of characters',
  },
  radio: {
    options: {
      title: 'Options',
      placeholder: 'Enter one option per line',
    },
    duplicateOptionsError: 'Please remove duplicate options.',
    otherInvalidInputError: 'Please specify a value for the "others" option',
  },
  checkbox: {
    selectionLimit: {
      label: 'Selection limits',
      description:
        'Customise the number of options that users are allowed to select',
      minimum: 'Minimum',
      maximum: 'Maximum',
    },
  },
  paragraph: 'Paragraph',
  section: {
    heading: 'Section heading',
  },
  rating: {
    numOfSteps: 'Number of steps',
    shape: 'Shape',
    shapes: {
      Heart: 'Heart',
      Star: 'Star',
    },
  },
  email: {
    otpVerification: {
      title: 'OTP verification',
      description: 'Respondents must verify by entering a code sent to them.',
    },
    restrictEmailDomains: {
      title: 'Restrict email domains',
      inputLabel: 'Domains allowed',
      placeholder: '@data.gov.sg\n@agency.gov.sg',
    },
    emailConfirmation: {
      title: 'Email confirmation',
      description: 'Customise an email acknowledgement to respondents',
      subject: {
        title: 'Subject',
        placeholder: 'Default email subject',
      },
      senderName: {
        title: 'Sender name',
        placeholder: 'Default sender name is your agency name',
      },
      content: {
        title: 'Content',
        placeholder: 'Default email body',
      },
      includePdfResponse: 'Include PDF response',
      includePdfResponseWarning:
        'PDF responses are not available for payment forms.',
    },
  },
  mobileNo: {
    otpVerification: {
      title: 'OTP Verification',
      description: 'Respondents must verify by entering a code sent to them.',
      smsUsed: '{smsCount} SMSes used',
      thresholdWarning: 'If more than 10k SMSes are required,',
      contact: 'contact support',
    },
    allowInternationalNumber: 'Allow international numbers',
  },
  date: {
    dateValidation: {
      title: 'Date validation',
      NoPast: 'Disallow past dates',
      NoFuture: 'Disallow future dates',
      Custom: 'Custom date range',
      atLeastOneDateError: 'You must specify at least one date.',
      validDateError: 'Please enter a valid date',
      maxMinError: 'Max date cannot be less than min date.',
    },
    customiseAvailableDays: {
      title: 'Customise available days',
      requiredError: 'Please select available days of the week',
      noAvailableDaysError:
        "The selected days aren't available within your custom date range",
    },
  },
  imageAttachment: {
    title: 'Uploaded image',
    requiredError: 'Please upload an image',
  },
  table: {
    minimumRows: 'Minimum rows',
    maximumRows: 'Maximum rows allowed',
    allowAddMoreRows: 'Allow respondent to add more rows',
    error: {
      minRow: 'Minimum rows must be greater than 0',
      maxRow: 'Maximum rows must be greater than 0',
      maxRowGreaterThanMin: 'Maximum rows must be greater than minimum rows',
    },
    column: 'Column',
    ariaLabelDelete: 'Delete column',
    addColumn: 'Add column',
  },
  number: {
    validation: 'Number validation',
    minValue: 'Minimum value',
    maxValue: 'Maximum value',
    maxValueGreaterThanMin: 'Minimum must be less than maximum',
    fieldRestriction: {
      title: 'Field restriction',
      lengthRestriction: 'Length restriction',
      Length: 'Number of characters allowed',
      Range: 'Range of values allowed',
    },
    error: {
      validationType: 'Please select a validation type',
      numOfCharacter: 'Please enter number of characters',
      validDecimal: 'Please enter a valid decimal',
      min: 'Cannot be less than 1',
      max: 'Cannot be more than 10000',
      rangeValue: 'Please enter range values',
      minRangeValue: 'Minimum cannot be 0',
      maxRangeValue: 'Maximum cannot be 0',
    },
  },
  attachment: {
    info: 'View our [complete list]({acceptedFileTypes}) of accepted file types. Please also read our [FAQ on email reliability]({guideEmailReliability}) relating to unaccepted file types.',
    maximumSize: 'Maximum size of individual attachment',
    error: {
      exceedSize:
        "You have exceeded your form's attachment size limit of {maxTotalSizeMb} MB",
    },
  },
}
