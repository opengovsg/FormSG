import { type HasTitle } from '..'

export * from './en-sg'

export interface EmailNotifications extends HasTitle {
  header: {
    closeFormFirst: string
    noEmailsForPaymentForms: string
  }
  section: {
    mrf: {
      selectRecipientWorkflow: string
      selectRecipientNoWorkflow: string
      respondents: {
        step1: {
          label: string
          placeholder: string
        }
        stepN: {
          label: {
            overall: string
            overallRedesign: string
            each: string
          }
          placeholder: string
        }
        others: {
          label: string
          description: string
          descriptionRedesign: string
          tooltipText: string
        }
      }
    }
    regular: {
      label: string
      info: string
      infoRedesign: string
      description: string
      descriptionRedesign: string
      statusTrackerInfo: string
      statusTrackerInfoRedesign: string
      statusTrackerDescription: string
      statusTrackerDescriptionRedesign: string
    }
  }
}
