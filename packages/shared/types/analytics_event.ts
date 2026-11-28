import { BasicField } from './field'

export enum AnalyticsEventType {
  ResultsDownload = 'results.download',
  ResultsDownloadFinished = 'results.download.finished',
  ResultsSavedViewCreated = 'results.saved_view.created',
  ResultsSavedViewUpdated = 'results.saved_view.updated',
  ResultsSavedViewApplied = 'results.saved_view.applied',
  ResultsVersionToggled = 'results.version_toggled',
  ResultsFilterApplied = 'results.filter.applied',
  ResultsSortApplied = 'results.sort.applied',
  ResultsColumnToggled = 'results.column.toggled',
}

export type ResultsDashboardVersion = 'v1' | 'v2'

export type ResultsDownloadFormat = 'csv' | 'attachments' | 'pdf'

export type ResultsDownloadScope = 'bulk' | 'single'

export type ResultsDownloadVersion = 'v1' | 'v2'

export type ResultsDownloadOutcome =
  | 'success'
  | 'partial'
  | 'failed'
  | 'cancelled'

export type ResultsDownloadColumnFilter = {
  columnId: string
  type: 'text' | 'values'
}

export type ResultsDownloadContent = {
  dashboardVersion: ResultsDashboardVersion
  formats: ResultsDownloadFormat[]
  scope: ResultsDownloadScope
  savedViewId?: string
  isSavedViewModified?: boolean
  responsesCount?: number
  dateRange?: { startDate: string; endDate: string }
  columnFilters?: ResultsDownloadColumnFilter[]
  downloadVersion?: ResultsDownloadVersion
  folderNameFieldType?: BasicField
}

export type ResultsDownloadFinishedContent = {
  downloadVersion: ResultsDownloadVersion
  formats: ResultsDownloadFormat[]
  outcome: ResultsDownloadOutcome
  durationMs: number
  expectedCount?: number
  successCount?: number
  errorCount?: number
  failedDownloadCount?: number
  zipBytes?: number
}

export type ResultsSavedViewContent = {
  savedViewId: string
}

export type ResultsVersionToggledContent = {
  from: ResultsDashboardVersion
  to: ResultsDashboardVersion
}

export type ResultsFilterAppliedContent =
  | { filter: 'date_range' }
  | { filter: 'column'; columnId: string }

export type ResultsSortAppliedContent = {
  direction: 'asc' | 'desc'
  columnId: string
}

export type ResultsColumnToggledContent = {
  visible: boolean
  columnId: string
}

export type AnalyticsEventInput =
  | {
      type: AnalyticsEventType.ResultsDownload
      content: ResultsDownloadContent
    }
  | {
      type: AnalyticsEventType.ResultsDownloadFinished
      content: ResultsDownloadFinishedContent
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
  | {
      type: AnalyticsEventType.ResultsFilterApplied
      content: ResultsFilterAppliedContent
    }
  | {
      type: AnalyticsEventType.ResultsSortApplied
      content: ResultsSortAppliedContent
    }
  | {
      type: AnalyticsEventType.ResultsColumnToggled
      content: ResultsColumnToggledContent
    }
