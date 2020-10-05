import {
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
} from 'src/app/modules/submission/submission.types'

const isProcessedFieldResponse = (
  response: any,
): response is ProcessedFieldResponse => {
  return (
    'fieldType' in response &&
    typeof response.fieldType === 'string' &&
    'isVisible' in response &&
    typeof response.isVisible === 'boolean'
  )
}

export const isProcessedSingleAnswerResponse = (
  response: any,
): response is ProcessedSingleAnswerResponse => {
  return (
    'answer' in response &&
    typeof response.answer === 'string' &&
    isProcessedFieldResponse(response)
  )
}
