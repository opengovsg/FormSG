import { hasProp } from '../../../../shared/util/has-prop'
import {
  ArrayResponse,
  DisplayedResponseWithoutAnswer,
  NestedResponse,
  SingleResponse,
} from '../../../../types/response'

import {
  ArrayAnswerResponse,
  Response,
  SingleAnswerResponse,
  TableResponse,
} from './csv-response-classes'

export const getResponseInstance = (
  fieldRecordData: DisplayedResponseWithoutAnswer,
): Response => {
  if (
    isNestedResponse(fieldRecordData) &&
    fieldRecordData.fieldType === 'table'
  ) {
    return new TableResponse(fieldRecordData)
  } else if (
    isArrayResponse(fieldRecordData) &&
    fieldRecordData.fieldType === 'checkbox'
  ) {
    return new ArrayAnswerResponse(fieldRecordData)
  } else if (isSingleResponse(fieldRecordData)) {
    return new SingleAnswerResponse(fieldRecordData)
  } else {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new Error('Response did not match any known type') // should be caught in submissions client factory
  }
}

const isNestedResponse = (
  response: DisplayedResponseWithoutAnswer,
): response is NestedResponse => {
  return (
    hasProp(response, 'answerArray') &&
    Array.isArray(response.answerArray) &&
    response.answerArray.every((value) => Array.isArray(value)) && // or has at least one element that is an array
    response.answerArray.every((arr) =>
      arr.every((value: unknown) => typeof value === 'string'),
    )
  )
}

const isArrayResponse = (
  response: DisplayedResponseWithoutAnswer,
): response is ArrayResponse => {
  return (
    hasProp(response, 'answerArray') &&
    Array.isArray(response.answerArray) &&
    response.answerArray.every((value) => typeof value === 'string')
  )
}

const isSingleResponse = (
  response: DisplayedResponseWithoutAnswer,
): response is SingleResponse => {
  return hasProp(response, 'answer') && typeof response.answer === 'string'
}
