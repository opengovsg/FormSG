export * from './en-sg'

export interface ResponsesFeedbackPage {
  issuesButtonLabel: string
  reviewsButtonLabel: string
  emptyFeedback: {
    title: string
    subtitle: string
  }
  issue: {
    issuesToDate: string
    tableColumns: {
      issueHeader: string
      contactHeader: string
    }
  }
  review: {
    averageScore: string
    reviewsToDate: string
    tableColumns: {
      feedbackHeader: string
      ratingHeader: string
    }
  }
}
