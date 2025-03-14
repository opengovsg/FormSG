import { ResponsesFeedbackPage } from '.'

export const enSG: ResponsesFeedbackPage = {
  issuesButtonLabel: 'Issues',
  reviewsButtonLabel: 'Reviews',
  emptyFeedback: {
    title: "You don't have any feedback yet",
    subtitle: 'Try using {link} to send out your forms!',
  },
  issue: {
    issuesToDate: ' issue(s) to date',
    tableColumns: {
      issueHeader: 'Issue',
      contactHeader: 'Contact',
    },
  },
  review: {
    averageScore: 'Average Score',
    reviewsToDate: ' review(s) to date',
    tableColumns: {
      feedbackHeader: 'Issue',
      ratingHeader: 'Contact',
    },
  },
}
