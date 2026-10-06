import { type HasTitle } from '..'

export * from './en-sg'

export interface Webhooks extends HasTitle {
  legacy: { label: string; description: string; saved: string }
  legacyWorkflowUnsupported: string
  workflowUnsupported: string
  remove: string
  input: {
    label: string
    description: string
  }
  retry: {
    label: string
    description: string
  }
  error: {
    title: string
    body: string
    button: {
      label: string
      loadingText: string
    }
  }
  plumberConnected: {
    title: string
    body: string
  }
}
