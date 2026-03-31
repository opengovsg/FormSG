import { enSG as fields } from './fields'
import { enSG as payment } from './payment'
import { enSG as table } from './table'
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
    verifiedFieldExpired:
      'Your verified fields have expired. Please verify those fields again.',
  },
  components: {
    header: {
      estTime:
        '{estTime, plural, =1 {# min} other {# mins}} estimated time to complete',
    },
    submitButton: {
      loadingText: 'Submitting',
      visuallyHidden: 'End of form.',
      preventSubmission: 'Submission disabled',
      proceedToPay: 'Proceed to pay',
      submitNow: 'Submit now',
    },
    saveDraft: {
      toast: {
        success:
          'Draft saved. Reopen this link in this browser to resume filling it.',
        restoredAllFields: 'Your draft has been successfully restored.',
        restoredOnlyUnchangedFields:
          'Some fields were not restored as the form has been updated.',
        previewNoDraftSaved:
          'Since you are in preview mode, there is no draft saved.',
      },
      tooltip: {
        default: 'Save a draft',
        lastSaved: 'Last saved: {lastSavedDateTimeString}',
      },
      button: {
        label: 'Save a draft',
      },
    },
    table,
    fields,
    payment,
    feedbackBlock: {
      title: {
        payment: 'How was your experience making payment on this form?',
        general: 'How was your form filling experience today?',
      },
      rating: {
        label: 'Form feedback rating',
        error: 'Please select a rating',
      },
      commentPlaceholder: 'Tell us more about your experience',
      submitButton: 'Submit feedback',
    },
    instructions: {
      title: 'Instructions',
    },
    duplicatePaymentModal: {
      title: 'Proceed to pay again?',
      description: {
        existingPayment:
          'We noticed a successful payment made on this form by your email address.',
        viewPreviousPayment: 'View your previous payment ↪',
        confirm: 'Do you wish to proceed to make another payment?',
      },
      actions: {
        cancel: 'Cancel',
        submit: 'Proceed to pay',
        submitting: 'Submitting',
      },
    },
    formAuth: {
      loginButton: 'Log in with {{authType}}',
      authType: {
        singpass: 'Singpass',
        singpassCorporate: 'Singpass (Corporate)',
        singpassApp: 'Singpass app',
      },
    },
  },
}
