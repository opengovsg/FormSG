import { FormFeedbackMetaDto } from '~shared/types/form/'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../../common/AdminViewFormService'

export const getFormFeedback = async (
  formId: string,
): Promise<FormFeedbackMetaDto> => {
  return ApiService.get<FormFeedbackMetaDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/feedback`,
  ).then(({ data }) => data)
}
