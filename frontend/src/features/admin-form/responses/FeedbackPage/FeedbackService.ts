import { FormFeedbackDto } from '~shared/types/form/'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../../common/AdminViewFormService'

export const getFormFeedback = async ({
  formId,
}: {
  formId: string
}): Promise<FormFeedbackDto> => {
  return ApiService.get<FormFeedbackDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/feedback`,
  ).then(({ data }) => data)
}
