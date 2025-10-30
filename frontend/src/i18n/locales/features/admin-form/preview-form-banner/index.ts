export interface PreviewFormBanner {
  templatePreview: string
  formPreview: string
  backToDashboardAriaLabel: string
  backToFormSG: string
  useTemplateAriaLabel: string
  useTemplate: string
  templateActionsAriaLabel: string
  paymentWarning: {
    production: {
      prefix: string
      linkText: string
    }
    nonProduction: string
  }
  previewWarning: {
    withoutPayment: string
  }
}

export * from './en-sg'
