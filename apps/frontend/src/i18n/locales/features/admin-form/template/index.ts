export * from './en-sg'

export interface Template {
  previewLabel: string
  useTemplate: string
  useTemplateAriaLabel: string
  backToFormsg: string
  useTemplateTour: {
    tooltip: {
      badge: string
      done: string
    }
    steps: Array<{
      title: string
      content: string
    }>
  }
  useTemplateWall: {
    title: string
    body: string
    continuePreview: string
    useTemplate: string
  }
}
