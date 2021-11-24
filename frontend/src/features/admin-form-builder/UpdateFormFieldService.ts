import { FormFieldDto } from '~shared/types/field'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

export const updateSingleFormField = async ({
  formId,
  updateFieldBody,
}: {
  formId: string
  updateFieldBody: FormFieldDto
}): Promise<FormFieldDto> => {
  return ApiService.put<FormFieldDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/fields/${updateFieldBody._id}`,
    updateFieldBody,
  ).then(({ data }) => data)
}
