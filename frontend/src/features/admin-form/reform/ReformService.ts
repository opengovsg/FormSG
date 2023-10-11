import { ApiService } from '~services/ApiService'

export const getQuestionsList = async (purpose: string): Promise<any> => {
  return await ApiService.post<any>(`/reform/create/questions-list`, {
    purpose,
  }).then(({ data }) => data)
}

export const getFormFields = async (
  prevMessages: { role: string; content: string }[],
  purpose: string,
  questions: string,
): Promise<any> => {
  console.log('prevMessages', prevMessages)
  console.log('purpose', purpose)
  console.log('questions', questions)
  return await ApiService.post<any>(`/reform/create/form`, {
    prevMessages,
    purpose,
    questions,
  }).then(({ data }) => data)
}
