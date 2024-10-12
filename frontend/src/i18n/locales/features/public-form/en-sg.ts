import { PublicForm } from '.'

export const enSG: PublicForm = {
  errors: {
    notAvailable: 'This form is not available.',
    notFound: 'Form not found',
    deleted: 'This form is no longer active',
    private:
      'If you require further assistance, please contact the agency that gave you the form link.',

    submissionSecretKeyInvalid: {
      title: 'Invalid form link',
      header: 'This form link is no longer valid.',
      message:
        'A submission may have already been made using this link. If you require further assistance, please contact the agency that gave you the form link.',
    },

    myinfo:
      'Your Myinfo details could not be retrieved. Refresh your browser and log in, or try again later.',
    submitFailure:
      'An error occurred whilst processing your submission. Please refresh and try again.',
    verifiedFieldExpired_one:
      'Your verified field {{count}} has expired. Please verify the {{count}} field again.',
    verifiedFieldExpired_other:
      'Your verified fields {{count}} have expired. Please verify those {{count}} fields again.',
  },
  components: {
    PublicFormSubmitButton: {
      loadingText: 'Submitting',
      visuallyHidden: 'End of form.',
      preventSubmission: 'Submission disabled',
      proceedToPay: 'Proceed to pay',
      submitNow: 'Submit now',
    },

    FeedbackBlock: {
      feedbackTitlePayment:
        'How was your experience making payment on this form?',
      feedbackTitleGeneral: 'How was your form filling experience today?',
      ratingLabel: 'Form feedback rating',
      ratingError: 'Please select a rating',
      commentPlaceholder: 'Tell us more about your experience',
      submitButton: 'Submit feedback',
    },
  },
}
