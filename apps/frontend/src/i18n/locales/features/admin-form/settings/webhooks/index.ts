import { type HasTitle } from '..'

export * from './en-sg'

export interface Webhooks extends HasTitle {
  integrationsTitle: string
  emailJson: { label: string; description: string }
  compatibility: {
    title: string
    description: string
    options: { default: string; legacy: string; latest: string }
    emailFormat: string
    emailPrefixes: string
    jsonPrefixes: string
  }
  legacy: { label: string; description: string; saved: string }
  legacyStorageNotice: string
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
