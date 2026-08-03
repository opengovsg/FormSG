import { type HasTitle } from '..'

export * from './en-sg'

export interface MultiLanguage extends HasTitle {
  toggle: {
    label: string
    description: string
  }
  languageRow: {
    hideShowTooltip: string
    editTooltip: string
    selectDefaultAriaLabel: string
    addTranslationsAriaLabel: string
  }
  sections: {
    question: string
    description: string
    column: string
    options: string
    disableSubmission: string
  }
  errors: {
    optionsCountMismatch: string
  }
}
