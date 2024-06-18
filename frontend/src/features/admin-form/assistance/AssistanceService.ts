import { ChatResponseMessage } from '@azure/openai/types/openai'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

export const generateQuestions = async (
  type: string,
  content: string,
): Promise<ChatResponseMessage> => {
  return await ApiService.post(`${ADMIN_FORM_ENDPOINT}/assistance/questions`, {
    type,
    content,
  }).then(({ data }) => data)
}

export const generateFormFields = async (
  content: string,
): Promise<ChatResponseMessage> => {
  return await ApiService.post(
    `${ADMIN_FORM_ENDPOINT}/assistance/form-fields`,
    {
      content,
    },
  ).then(({ data }) => data)
}
