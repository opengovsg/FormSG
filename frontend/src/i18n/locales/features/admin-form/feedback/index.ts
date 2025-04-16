export * from './en-sg'

export interface Feedback {
  emptyFeedback: {
    noFeedbackYet: string
    tryUsing: string
    toSendOutForms: string
  }
  issueTable: {
    dateHeader: string
    issueHeader: string
    contactHeader: string
  }
  reviewTable: {
    dateHeader: string
    feedbackHeader: string
    ratingHeader: string
  }
  downloadButton: {
    export: string
  }
  feedbackPage: {
    issues: string
    reviews: string
    reviewInformation: {
      averageScore: string
      reviewsToDate: string
    }
    issueInformation: {
      issuesToDate: string
      tooltip: string
    }
  }
  feedbackCsvGenerator: {
    date: string
    comment: string
    rating: string
  }
  issueCsvGenerator: {
    date: string
    issue: string
    email: string
  }
}
