import { pick } from 'lodash'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import {
  EmailAdminDataField,
  EmailDataCollationToolField,
  EmailRespondentConfirmationField,
} from 'src/types'

export const generateSingleAnswerJson = (
  response: ProcessedSingleAnswerResponse,
): EmailDataCollationToolField => pick(response, ['question', 'answer'])

export const generateSingleAnswerAutoreply = (
  response: ProcessedSingleAnswerResponse,
): EmailRespondentConfirmationField => ({
  _id: response._id,
  question: response.question,
  answerTemplate: response.answer.split('\n'),
  fieldType: response.fieldType,
})

export const generateSingleAnswerFormData = (
  response: ProcessedSingleAnswerResponse,
): EmailAdminDataField => ({
  ...pick(response, ['_id', 'question', 'answer', 'fieldType']),
  answerTemplate: response.answer.split('\n'),
})
