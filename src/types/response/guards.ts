import {
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
} from 'src/app/modules/submission/submission.types'

import { types as basicTypes } from '../../shared/resources/basic'

const answerArrayFieldTypes = basicTypes
  .filter((field) => field.answerArray)
  .map((f) => f.name)

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
    isProcessedFieldResponse(response) &&
    !answerArrayFieldTypes.includes(response.fieldType)
  )
}
