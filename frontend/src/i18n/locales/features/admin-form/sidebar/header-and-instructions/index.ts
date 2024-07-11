export * from './en-sg'

export interface HeaderAndInstructions {
  title: string
  cta: string
  logo: {
    default: string
    none: string
    custom: string
  }
  themeColour: {
    title: string
  }
  instruction: string
  minutes: string
}
