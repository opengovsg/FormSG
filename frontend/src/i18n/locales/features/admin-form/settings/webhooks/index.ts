import { type HasTitle } from '..'

export * from './en-sg'

export interface Webhooks extends HasTitle {
  input: {
    label: string
    description: string
  }
  retry: {
    label: string
    description: string
  }
}
