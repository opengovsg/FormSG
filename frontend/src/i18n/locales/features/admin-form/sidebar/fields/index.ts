export * from './en-sg'

export interface Fields {
  builder: {
    title: string
    createField: string
    addFields: string
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
    others: string
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
  yesNo: {
    yes: string
    no: string
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
      includePdfResponse: string
      includePdfResponseWarning: string
    }
  }
  mobileNo: {
    otpVerification: {
      title: string
      description: string
    }
    allowInternationalNumber: string
    smsCounts: string
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
    fileUploaderLink: string
    dragAndDrop: string
    dragActive: string
    maxFileSize: string
    ariaLabelRemove: string
    error: {
      fileEmpty: string
      fileTooLarge: string
      fileInvalidType: string
      tooManyFiles: string
      zipFileInvalidType: string
      zipParsing: string
    }
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
}
