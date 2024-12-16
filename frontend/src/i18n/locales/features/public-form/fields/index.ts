export interface Fields {
  yesNo: {
    yes: string
    no: string
  }
  email: {
    validation: {
      domainDisallowed: string
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
