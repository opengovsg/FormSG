import { Feedback } from '.'

export const enSG: Feedback = {
  emptyFeedback: {
    noFeedbackYet: "You don't have any feedback yet",
    tryUsing: 'Try using',
    toSendOutForms: 'to send out your forms!',
  },
  issueTable: {
    dateHeader: 'Date',
    issueHeader: 'Issue',
    contactHeader: 'Contact',
  },
  reviewTable: {
    dateHeader: 'Date',
    feedbackHeader: 'Feedback',
    ratingHeader: 'Rating',
  },
  downloadButton: {
    export: 'Export',
  },
  feedbackPage: {
    issues: 'Issues',
    reviews: 'Reviews',
    reviewInformation: {
      averageScore: 'Average Score',
      reviewsToDate:
        '{reviewCount, plural, =1 {review to date} other {reviews to date}}',
    },
    issueInformation: {
      issuesToDate:
        '{issueCount, plural, =1 {issue to date} other {issues to date}}',
      tooltip: 'Feedback displayed here relates to form submission issues',
    },
  },
  feedbackCsvGenerator: {
    date: 'Date',
    comment: 'Comment',
    rating: 'Rating',
  },
  issueCsvGenerator: {
    date: 'Date',
    issue: 'Issue',
    email: 'Email',
  },
}
