import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

/**
 * Cancel a pending MRF submission.
 * @param formId the id of the form
 * @param submissionId the id of the submission to cancel
 */
export const cancelPendingMrfResponse = async ({
  formId,
  submissionId,
}: {
  formId: string
  submissionId: string
}): Promise<void> => {
  return ApiService.post<void>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/${submissionId}/cancel`,
  ).then(() => {})
}
