export interface Fields {
  yesNo: {
    yes: string
    no: string
  }
  option: {
    others: string
  }
  dropdown: {
    placeholder: string
    nothingFound: string
  }
  email: {
    validation: {
      domainDisallowed: string
    }
  }
  attachment: {
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
  verification: {
    button: {
      label: {
        verify: string
        verified: string
      }
    }
    modal: {
      email: {
        title: string
        description: string
      }
      mobile: {
        title: string
        description: string
      }
    }
  }
}

export * from './en-sg'
export * from './ms-sg'
export * from './ta-sg'
export * from './zh-sg'
