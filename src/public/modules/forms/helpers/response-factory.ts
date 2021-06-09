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
  if (isNestedResponse(fieldRecordData)) {
    return new TableResponse(fieldRecordData)
  } else if (isArrayResponse(fieldRecordData)) {
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
    Array.isArray(response.answerArray[0]) &&
    typeof response.answerArray[0][0] === 'string'
  )
}

const isArrayResponse = (
  response: DisplayedResponseWithoutAnswer,
): response is ArrayResponse => {
  return (
    hasProp(response, 'answerArray') &&
    Array.isArray(response.answerArray) &&
    typeof response.answerArray[0] === 'string'
  )
}

const isSingleResponse = (
  response: DisplayedResponseWithoutAnswer,
): response is SingleResponse => {
  return hasProp(response, 'answer') && typeof response.answer === 'string'
}
