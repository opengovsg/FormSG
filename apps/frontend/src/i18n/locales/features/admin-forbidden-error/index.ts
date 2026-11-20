export * from './en-sg'

export interface AdminForbiddenError {
  title: string
  header: string
  description: string
  buttons: {
    back: string
    dashboard: string
    login: string
  }
}
