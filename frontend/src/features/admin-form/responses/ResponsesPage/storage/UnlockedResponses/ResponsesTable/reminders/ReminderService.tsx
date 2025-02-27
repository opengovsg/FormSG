import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

/**
 * Trigger a reminder for the pending step.
 * @param formId the id of the form
 * @param submissionId the id of the submission to send reminder for
 */
export const sendReminderForPendingMrfResponse = async ({
  formId,
  submissionId,
  submissionSecretKey,
}: {
  formId: string
  submissionId: string
  submissionSecretKey: string
}): Promise<void> => {
  return ApiService.post<void>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/${submissionId}/remind`,
    {
      submissionSecretKey,
    },
  ).then(() => {})
}
