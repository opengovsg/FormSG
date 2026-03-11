import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

export const makeTextPrompt = ({
  formId,
  prompt,
}: {
  formId: string
  prompt: string
}) => {
  return ApiService.post<{ message: string; createdFieldIds?: string[] }>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/assistance/text-prompt`,
    { prompt },
  ).then(({ data }) => data)
}

export const makeVisionPrompt = ({
  formId,
  imageDataUrls,
}: {
  formId: string
  imageDataUrls: string[]
}) => {
  return ApiService.post<{ message: string; createdFieldIds?: string[] }>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/assistance/vision-prompt`,
    { imageDataUrls },
  ).then(({ data }) => data)
}
