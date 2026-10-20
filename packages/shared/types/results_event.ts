export enum ResultsEventType {
  Download = 'results.download',
  SavedViewCreated = 'results.saved_view.created',
  SavedViewUpdated = 'results.saved_view.updated',
  SavedViewApplied = 'results.saved_view.applied',
  VersionToggled = 'results.version_toggled',
}

export type ResultsDashboardVersion = 'v1' | 'v2'

export type ResultsDownloadFormat = 'csv' | 'attachments' | 'pdf'

export type ResultsDownloadScope = 'bulk' | 'single'

export type ResultsEventInput =
  | {
      type: ResultsEventType.Download
      dashboardVersion: ResultsDashboardVersion
      formats: ResultsDownloadFormat[]
      scope: ResultsDownloadScope
      savedViewId?: string
      isSavedViewModified?: boolean
      responsesCount?: number
    }
  | {
      type: ResultsEventType.SavedViewCreated
      savedViewId: string
    }
  | {
      type: ResultsEventType.SavedViewUpdated
      savedViewId: string
    }
  | {
      type: ResultsEventType.SavedViewApplied
      savedViewId: string
    }
  | {
      type: ResultsEventType.VersionToggled
      from: ResultsDashboardVersion
      to: ResultsDashboardVersion
    }
