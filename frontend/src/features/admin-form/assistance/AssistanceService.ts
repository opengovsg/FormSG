import { ChatCompletionMessage } from 'openai/src/resources/chat/completions'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

export const generateQuestions = async (
  purpose: string,
): Promise<ChatCompletionMessage> => {
  return await ApiService.post(`${ADMIN_FORM_ENDPOINT}/assistance/questions`, {
    purpose,
  }).then(({ data }) => data)
}

export const generateFormFields = async (
  type: string,
  content: string,
): Promise<ChatCompletionMessage> => {
  return await ApiService.post(
    `${ADMIN_FORM_ENDPOINT}/assistance/form-fields`,
    {
      type,
      content,
    },
  ).then(({ data }) => data)
}
