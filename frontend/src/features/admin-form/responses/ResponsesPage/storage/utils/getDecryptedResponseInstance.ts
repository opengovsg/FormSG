import { BasicField } from '~shared/types/field'
import { hasProp } from '~shared/utils/has-prop'

import {
  ArrayAnswerResponse,
  ArrayResponse,
  DisplayedResponseWithoutAnswer,
  NestedResponse,
  Response,
  SingleAnswerResponse,
  SingleResponse,
  TableResponse,
} from './csv-response-classes'
/**
 * Converts a field record into a custom response instance
 * @param fieldRecordData Field record
 * @returns Response instance
 * @throws Error when data does not fit any known response type
 */
export const getDecryptedResponseInstance = (
  fieldRecordData: DisplayedResponseWithoutAnswer,
): Response => {
  if (
    isNestedResponse(fieldRecordData) &&
    fieldRecordData.fieldType === BasicField.Table
  ) {
    return new TableResponse(fieldRecordData)
  } else if (
    isArrayResponse(fieldRecordData) &&
    fieldRecordData.fieldType === BasicField.Checkbox
  ) {
    return new ArrayAnswerResponse(fieldRecordData)
  } else if (isSingleResponse(fieldRecordData)) {
    return new SingleAnswerResponse(fieldRecordData)
  } else {
    throw new Error('Response did not match any known type')
  }
}

const isNestedResponse = (
  response: DisplayedResponseWithoutAnswer,
): response is NestedResponse => {
  return (
    hasAnswerArray(response) &&
    response.answerArray.every(
      (arr) =>
        Array.isArray(arr) &&
        arr.every((value: unknown) => typeof value === 'string'),
    )
  )
}

const isArrayResponse = (
  response: DisplayedResponseWithoutAnswer,
): response is ArrayResponse => {
  return (
    hasAnswerArray(response) &&
    response.answerArray.every((value) => typeof value === 'string')
  )
}

const isSingleResponse = (
  response: DisplayedResponseWithoutAnswer,
): response is SingleResponse => {
  return hasProp(response, 'answer') && typeof response.answer === 'string'
}

type AnswerArrayObject = {
  answerArray: Array<unknown>
}

const hasAnswerArray = (response: unknown): response is AnswerArrayObject => {
  return hasProp(response, 'answerArray') && Array.isArray(response.answerArray)
}
