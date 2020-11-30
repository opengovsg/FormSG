import {
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
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

export const isProcessedCheckboxResponse = (
  response: any,
): response is ProcessedCheckboxResponse => {
  return (
    'answerArray' in response &&
    Array.isArray(response.answerArray) &&
    isProcessedFieldResponse(response)
  )
}

export const isProcessedTableResponse = (
  response: any,
): response is ProcessedTableResponse => {
  return (
    'answerArray' in response &&
    Array.isArray(response.answerArray) &&
    Array.isArray(response.answerArray[0]) &&
    isProcessedFieldResponse(response)
  )
}

export const isProcessedAttachmentResponse = (
  response: any,
): response is ProcessedAttachmentResponse => {
  return (
    'filename' in response &&
    typeof response.filename === 'string' &&
    isProcessedFieldResponse(response)
  )
}
