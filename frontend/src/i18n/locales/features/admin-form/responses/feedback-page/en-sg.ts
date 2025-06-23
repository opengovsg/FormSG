import { ResponsesFeedbackPage } from '.'

export const enSG: ResponsesFeedbackPage = {
  issuesButtonLabel: 'Issues',
  reviewsButtonLabel: 'Reviews',
  emptyFeedback: {
    title: "You don't have any feedback yet",
    subtitle: 'Try using {link} to send out your forms!',
  },
  issue: {
    tooltip: 'Feedback displayed here relates to form submission issues',
    issuesToDate: '{count, plural, =1 {issue} other {issues}} to date',
    tableColumns: {
      issueHeader: 'Issue',
      contactHeader: 'Contact',
    },
  },
  review: {
    averageScore: 'Average Score',
    reviewsToDate: '{count, plural, =1 {review} other {reviews}} to date',
    tableColumns: {
      feedbackHeader: 'Issue',
      ratingHeader: 'Contact',
    },
  },
}
