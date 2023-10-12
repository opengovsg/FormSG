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
  formName: string,
): Promise<any> => {
  return await ApiService.post<any>(`/reform/create/form`, {
    prevMessages,
    purpose,
    questions,
    formName,
  }).then(({ data }) => data)
}

export const getQuestionsListFromPdf = async (
  parsedPdfContent: string,
): Promise<any> => {
  return await ApiService.post<any>(`/reform/migrate`, {
    parsedPdfContent,
  }).then(({ data }) => data)
}
