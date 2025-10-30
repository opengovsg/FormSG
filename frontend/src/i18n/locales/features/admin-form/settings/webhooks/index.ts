import { type HasTitle } from '..'

export * from './en-sg'

export interface Webhooks extends HasTitle {
  input: {
    label: string
    description: string
    placeholder: string
    validationError: string
  }
  retry: {
    label: string
    description: string
  }
  unsupportedMessage: {
    title: string
    description: string
    learnMore: string
  }
}
