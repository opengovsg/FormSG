export * from './en-sg'

export interface TransferOwnership {
  header: string
  form: {
    label: string
    description: string
    button: string
  }
  confirmation: {
    transferringTo: string
    loseAccessWarning: string
    button: string
  }
}
