import {
  ArrayResponse,
  DisplayedResponseWithoutAnswer,
  NestedResponse,
  SingleResponse,
} from '../../../../types/response'

import {
  ArrayAnswerResponse,
  ErrorResponse,
  Response,
  SingleAnswerResponse,
  TableResponse,
} from './csv-response-classes'

export const getResponseInstance = (
  fieldRecordData: DisplayedResponseWithoutAnswer,
): Response => {
  switch (fieldRecordData.fieldType) {
    case 'table':
      if (isNestedResponse(fieldRecordData)) {
        return new TableResponse(fieldRecordData)
      }
      break
    case 'checkbox':
      if (isArrayResponse(fieldRecordData)) {
        return new ArrayAnswerResponse(fieldRecordData)
      }
      break
    default:
      if (isSingleResponse(fieldRecordData)) {
        return new SingleAnswerResponse(fieldRecordData)
      }
      break
  }
  return new ErrorResponse(fieldRecordData)
}

function isNestedResponse(
  response: DisplayedResponseWithoutAnswer,
): response is NestedResponse {
  return 'answerArray' in response
}
function isArrayResponse(
  response: DisplayedResponseWithoutAnswer,
): response is ArrayResponse {
  return 'answerArray' in response
}

function isSingleResponse(
  response: DisplayedResponseWithoutAnswer,
): response is SingleResponse {
  return 'answer' in response
}
