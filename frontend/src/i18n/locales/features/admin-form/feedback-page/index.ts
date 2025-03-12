export * from './en-sg'

export interface FeedbackPage {
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
