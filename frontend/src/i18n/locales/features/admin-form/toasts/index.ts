export * from './en-sg'

interface Toast {
  success: string
  error: string
}

export interface Toasts {
  field: {
    delete: Toast
    create: Toast
    update: Toast
    duplicate: Toast & { successButNoLogic: string }
  }
}
