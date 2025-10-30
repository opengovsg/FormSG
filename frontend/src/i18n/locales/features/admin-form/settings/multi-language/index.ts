export * from './en-sg'

export interface MultiLanguage {
  title: string
  toggle: {
    label: string
    description: string
  }
  languageRow: {
    hideShowTooltip: string
    editTooltip: string
  }
  instructions: string
  logic: string
  myinfoTooltip: string
  backToQuestions: string
  saveTranslation: string
  retrievalError: string
  formLogic: {
    disableSubmission: string
  }
  table: {
    column: string
  }
}
