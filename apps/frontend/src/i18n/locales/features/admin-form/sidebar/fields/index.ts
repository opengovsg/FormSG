export * from './en-sg'

export interface Fields {
  builder: {
    title: string
    createField: string
    addFields: string
    searchPlaceholder: string
    tabs: {
      basic: string
      myInfo: string
      payments: string
    }
    image: string
    statement: string
    section: string
    attachment: string
    checkbox: string
    date: string
    decimal: string
    dropdown: string
    countryRegion: string
    email: string
    homeNumber: string
    mobileNumber: string
    longText: string
    nik: string
    number: string
    radio: string
    rating: string
    shortAnswer: string
    table: string
    yesNo: string
    children: string
  }
  commonFieldComponents: {
    title: string
    description: string
    required: string
    noCharactersAllowed: string
    charactersAllowedPlaceholder: string
  }
  radio: {
    options: {
      title: string
      placeholder: string
    }
    duplicateOptionsError: string
    otherInvalidInputError: string
  }
  checkbox: {
    selectionLimit: {
      label: string
      description: string
      minimum: string
      maximum: string
    }
  }
  paragraph: string
  section: {
    heading: string
  }
  rating: {
    numOfSteps: string
    shape: string
    shapes: {
      Heart: string
      Star: string
    }
  }
  email: {
    otpVerification: {
      title: string
      description: string
    }
    restrictEmailDomains: {
      title: string
      inputLabel: string
      placeholder: string
    }
    emailConfirmation: {
      title: string
      description: string
      subject: {
        title: string
        placeholder: string
      }
      senderName: {
        title: string
        placeholder: string
      }
      content: {
        title: string
        placeholder: string
      }
      includeResponse: string
      includePdfResponseWarning: string
      includeResponseDescription: string
    }
  }
  mobileNo: {
    otpVerification: {
      title: string
      description: string
      smsUsed: string
      thresholdWarning: string
      contact: string
    }
    allowInternationalNumber: string
  }
  date: {
    dateValidation: {
      title: string
      NoPast: string
      NoFuture: string
      Custom: string
      atLeastOneDateError: string
      validDateError: string
      maxMinError: string
    }
    customiseAvailableDays: {
      title: string
      requiredError: string
      noAvailableDaysError: string
    }
  }
  imageAttachment: {
    title: string
    requiredError: string
  }
  table: {
    minimumRows: string
    maximumRows: string
    allowAddMoreRows: string
    error: {
      minRow: string
      maxRow: string
      maxRowGreaterThanMin: string
    }
    column: string
    ariaLabelDelete: string
    addColumn: string
  }
  number: {
    validation: string
    minValue: string
    maxValue: string
    maxValueGreaterThanMin: string
    fieldRestriction: {
      title: string
      lengthRestriction: string
      Length: string
      Range: string
    }
    error: {
      validationType: string
      numOfCharacter: string
      validDecimal: string
      min: string
      max: string
      rangeValue: string
      minRangeValue: string
      maxRangeValue: string
    }
  }
  attachment: {
    info: string
    maximumSize: string
    error: {
      exceedSize: string
    }
  }
  fieldListOption: {
    useForApprovals: string
  }
  myInfoPanel: {
    sections: {
      personal: string
      contact: string
      particulars: string
      familyMarriage: string
      familyChildren: string
    }
    singpassDisabledBefore: string
    singpassDisabledSettings: string
    singpassDisabledAfter: string
    myInfoFieldsLimit: string
    learnMore: string
  }
  fixedPaymentAmountField: {
    label: string
    description: string
    invoiceWarning: string
  }
  paymentsInputPanel: {
    paymentType: {
      label: string
      placeholder: string
      options: {
        products: {
          label: string
          description: string
        }
        variable: {
          label: string
          description: string
        }
        fixed: {
          label: string
          description: string
        }
      }
    }
    multiProduct: {
      label: string
    }
    productServiceName: {
      label: string
      description: string
      required: string
    }
    description: {
      label: string
    }
    saveField: string
    disabled: {
      storageModeOnly: string
      stripeNotConnectedBefore: string
      stripeNotConnectedSettings: string
      stripeNotConnectedAfter: string
    }
  }
  productItem: {
    table: {
      amount: string
      quantityLimit: string
      quantityRange: string
    }
    edit: string
    delete: string
  }
  productModal: {
    header: {
      edit: string
      add: string
    }
    name: {
      label: string
      description: string
      required: string
    }
    description: {
      label: string
    }
    amount: {
      label: string
      includingGst: string
    }
    quantityLimit: {
      label: string
      description: string
    }
    minQuantity: {
      label: string
      required: string
    }
    maxQuantity: {
      label: string
      required: string
    }
    validation: {
      greaterThanZero: string
      smallerThanMax: string
      greaterThanMin: string
      amountRange: string
      minAmount: string
      maxAmount: string
      qtyLimitExceedsMax: string
      maxQuantityForAmount: string
    }
    cancel: string
    save: string
    saving: string
  }
  productServiceBox: {
    label: string
    emptyState: string
    add: string
  }
  variablePaymentAmountField: {
    label: string
    description: string
    minAmount: {
      label: string
      error: string
    }
    maxAmount: {
      label: string
      error: string
    }
  }
}
