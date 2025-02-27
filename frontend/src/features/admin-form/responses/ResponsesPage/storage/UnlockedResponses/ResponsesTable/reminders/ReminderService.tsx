import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

/**
 * Trigger a reminder for the pending step.
 * @param formId the id of the form
 * @param responseId the id of the response to send reminder for
 */
export const sendReminderForPendingMrfResponse = async ({
  formId,
  responseId,
  submissionSecretKey,
}: {
  formId: string
  responseId: string
  submissionSecretKey: string
}): Promise<void> => {
  return ApiService.post<void>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/${responseId}/remind`,
    {
      submissionSecretKey,
    },
  ).then(() => {})
}
