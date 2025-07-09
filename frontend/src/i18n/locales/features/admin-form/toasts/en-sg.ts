import { Toasts } from '.'

export const enSG: Toasts = {
  field: {
    delete: {
      success: 'The {field} was deleted.',
      error:
        'Something went wrong when deleting your field. Please refresh and try again.',
    },
    create: {
      success: 'The {field} was created.',
      error:
        'Something went wrong when creating your field. Please refresh and try again.',
    },
    update: {
      success: 'The {field} was updated.',
      error:
        'Something went wrong when editing your field. Please refresh and try again.',
    },
    duplicate: {
      success: 'The {field} was duplicated.',
      successButNoLogic:
        'The {field} was duplicated. Associated logic was not duplicated.',
      error:
        'Something went wrong when creating your field. Please refresh and try again.',
    },
  },
  emailModeMigration: {
    success:
      'Form successfully converted to storage mode. You can now activate your form.',
    error:
      'Something went wrong when converting the form to storage mode. Please refresh and try again.',
  },
  respondentCopy: {
    successBefore: 'Respondents will',
    disabled: 'not ',
    successAfter: 'be able to receive a copy of their submission',
  },
  form: {
    retrieval: {
      error: 'There was an error retrieving your form. Please try again later.',
    },
  },
  statusTracker: {
    successBefore: 'Respondents will',
    disabled: 'not ',
    successAfter:
      'be able to receive a status tracking link of their submission',
  },
}
