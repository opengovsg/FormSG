export enum AnalyticsEventType {
  ResultsDownload = 'results.download',
  ResultsSavedViewCreated = 'results.saved_view.created',
  ResultsSavedViewUpdated = 'results.saved_view.updated',
  ResultsSavedViewApplied = 'results.saved_view.applied',
  ResultsVersionToggled = 'results.version_toggled',
}

export type ResultsDashboardVersion = 'v1' | 'v2'

export type ResultsDownloadFormat = 'csv' | 'attachments' | 'pdf'

export type ResultsDownloadScope = 'bulk' | 'single'

export type ResultsDownloadContent = {
  dashboardVersion: ResultsDashboardVersion
  formats: ResultsDownloadFormat[]
  scope: ResultsDownloadScope
  savedViewId?: string
  isSavedViewModified?: boolean
  responsesCount?: number
}

export type ResultsSavedViewContent = {
  savedViewId: string
}

export type ResultsVersionToggledContent = {
  from: ResultsDashboardVersion
  to: ResultsDashboardVersion
}

export type AnalyticsEventInput =
  | {
      type: AnalyticsEventType.ResultsDownload
      content: ResultsDownloadContent
    }
  | {
      type:
        | AnalyticsEventType.ResultsSavedViewCreated
        | AnalyticsEventType.ResultsSavedViewUpdated
        | AnalyticsEventType.ResultsSavedViewApplied
      content: ResultsSavedViewContent
    }
  | {
      type: AnalyticsEventType.ResultsVersionToggled
      content: ResultsVersionToggledContent
    }
