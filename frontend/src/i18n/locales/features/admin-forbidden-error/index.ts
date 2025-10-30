export interface AdminForbiddenError {
  title: string
  header: string
  description: {
    unauthenticated: string
  }
  buttons: {
    back: string
    dashboard: string
    login: string
  }
}
