import { type HasTitle } from '..'

export * from './en-sg'

export interface EmailNotifications extends HasTitle {
  header: {
    closeFormFirst: string
    noEmailsForPaymentForms: string
  }
  section: {
    mrf: {
      selectRecipient: string
      respondents: {
        step1: {
          label: string
          placeholder: string
        }
        stepN: {
          label: {
            overall: string
            each: string
          }
          placeholder: string
        }
        others: {
          label: string
          description: string
          tooltipText: string
        }
      }
    }
    regular: {
      label: string
      description: string
    }
  }
}
