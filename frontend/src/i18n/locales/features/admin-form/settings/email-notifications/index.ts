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
        workflowCompletionLabel: string
        customiseEmailLabel: string
        customiseEmailDescription: string
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
      admin: {
        workflowCompletionLabel: string
        workflowCompletionInfo: string
      }
    }
    regular: {
      label: string
      info: string
      description: string
      respondentCopyLabel: string
      customiseEmailLabel: string
    }
    modal: {
      headerMrf: string
      infoMrf: string
      headerEncrypt: string
      infoEncrypt: string
      subjectTitle: string
      subjectError: string
      senderNameTitle: string
      senderNameError: string
      emailBodyTitle: string
      emailBodyPlaceholder: string
    }
  }
}
