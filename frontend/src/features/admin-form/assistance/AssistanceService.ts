import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

export const makeTextPrompt = ({
  formId,
  prompt,
}: {
  formId: string
  prompt: string
}) => {
  return ApiService.post<undefined>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/assistance/text-prompt`,
    { prompt },
  ).then(({ data }) => data)
}
