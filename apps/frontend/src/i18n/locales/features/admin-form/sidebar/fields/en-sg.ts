import { Fields } from '.'

export const enSG: Fields = {
  builder: {
    title: 'Fields',
    createField: 'Create field',
    addFields: 'Add Fields',
    searchPlaceholder: 'Search fields',
    tabs: {
      basic: 'Basic',
      myInfo: 'MyInfo',
      payments: 'Payments',
    },
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
        placeholder: 'Thank you for submitting {formTitle}',
      },
      senderName: {
        title: 'Sender name',
        placeholder: 'Default sender name is your agency name',
      },
      content: {
        title: 'Content',
        placeholder:
          'To whom it may concern,\n\nThank you for submitting this form.\n\nRegards,\n{agencyName}',
      },
      includeResponse: 'Include a copy of their responses',
      includePdfResponseWarning:
        'PDF responses are not available for payment forms.',
      includeResponseDescription:
        'Responses are included in the email and as a PDF attachment',
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
  fieldListOption: {
    useForApprovals: 'Use for approvals',
  },
  myInfoPanel: {
    sections: {
      personal: 'Personal',
      contact: 'Contact',
      particulars: 'Particulars',
      familyMarriage: 'Family (Marriage)',
      familyChildren: 'Family (Children)',
    },
    singpassDisabledBefore: 'Enable Singpass in the',
    singpassDisabledSettings: 'Settings',
    singpassDisabledAfter: 'tab to access these fields.',
    myInfoFieldsLimit:
      'Only 30 Myinfo fields are allowed ({numMyInfoFields}/30).',
    learnMore: 'Learn more',
  },
  fixedPaymentAmountField: {
    label: 'Payment amount',
    description: 'Including GST',
    invoiceWarning:
      'You would need to issue your own invoice for amounts above S$1000. [Learn more about this]({url})',
  },
  paymentsInputPanel: {
    paymentType: {
      label: 'Payment type',
      placeholder: 'Select Payment Type',
      options: {
        products: {
          label: 'Product or service',
          description:
            'Respondents pay based on products or services they select. e.g. Courses, tickets with tiered prices',
        },
        variable: {
          label: 'Respondents choose what to pay',
          description:
            'Respondents enter the amount to pay. e.g. Donations, fines',
        },
        fixed: {
          label: 'Fixed amount',
          description:
            'Every respondent pays the same amount, as set by the admin. e.g. Flat-rate tickets',
        },
      },
    },
    multiProduct: {
      label: 'Allow selection of multiple types of products/services',
    },
    productServiceName: {
      label: 'Product/service name',
      description: 'This will be reflected on the proof of payment',
      required: 'This field is required',
    },
    description: {
      label: 'Description',
    },
    saveField: 'Save field',
    disabled: {
      storageModeOnly: 'Payments are only available in storage mode.',
      stripeNotConnectedBefore: 'Connect your Stripe account in',
      stripeNotConnectedSettings: 'Settings',
      stripeNotConnectedAfter: 'to add payment field.',
    },
  },
  productItem: {
    table: {
      amount: 'Amount',
      quantityLimit: 'Quantity limit',
      quantityRange: 'between {min} to {max}',
    },
  },
  productModal: {
    header: {
      edit: 'Edit product/service',
      add: 'Add product/service',
    },
    name: {
      label: 'Product/service name',
      description: 'This will appear on proof of payment',
      required: 'This field is required',
    },
    description: {
      label: 'Description',
    },
    amount: {
      label: 'Amount',
      includingGst: 'Including GST',
    },
    quantityLimit: {
      label: 'Quantity limit',
      description:
        'Set the minimum and maximum quantities respondents can select',
    },
    minQuantity: {
      label: 'Minimum quantity',
      required: 'The minimum quantity is 1',
    },
    maxQuantity: {
      label: 'Maximum quantity',
      required: 'Enter a maximum quantity',
    },
    validation: {
      greaterThanZero: 'Enter a value greater than 0',
      smallerThanMax: 'Enter a value smaller than the maximum quantity',
      greaterThanMin: 'Enter a value greater than the minimum quantity',
      amountRange: 'Enter an amount between {min} and {max}',
      minAmount: 'The minimum amount is {min}',
      maxAmount: 'The maximum amount is {max}',
      qtyLimitExceedsMax:
        'Quantity limit could not be set because amount is above {max}',
      maxQuantityForAmount: 'The maximum quantity for this amount is {maxQty}',
    },
    cancel: 'Cancel',
    save: 'Save product',
    saving: 'Saving',
  },
  productServiceBox: {
    label: 'Product/service',
    emptyState: "You haven't added any product/service",
    add: 'Add',
  },
  variablePaymentAmountField: {
    label: 'Payment amount limit',
    description: 'Set the minimum and maximum amounts respondents can pay',
    minAmount: {
      label: 'Minimum amount',
      error: 'The minimum amount is {amount}',
    },
    maxAmount: {
      label: 'Maximum amount',
      error: 'The maximum amount is {amount}',
    },
  },
}
