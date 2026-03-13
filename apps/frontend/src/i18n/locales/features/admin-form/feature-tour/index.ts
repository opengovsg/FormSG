export * from './en-sg'

export interface FeatureTour {
  tooltip: {
    badge: string
    next: string
    done: string
  }
  steps: Array<{
    title: string
    content: string
  }>
}
