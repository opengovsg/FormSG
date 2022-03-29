import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

export const deleteFormLogic = async (
  formId: string,
  logicId: string,
): Promise<true> => {
  return ApiService.delete(
    `${ADMIN_FORM_ENDPOINT}/${formId}/logic/${logicId}`,
  ).then(() => true)
}
