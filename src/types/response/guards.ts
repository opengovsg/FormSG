import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'

export const isProcessedSingleAnswerResponse = (
  response: any,
): response is ProcessedSingleAnswerResponse => {
  return response && typeof response.answer === 'string'
}
