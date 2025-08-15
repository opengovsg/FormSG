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
  question: response.question,
  answerTemplate: response.answer.split('\n'),
})

export const generateSingleAnswerFormData = (
  response: ProcessedSingleAnswerResponse,
): EmailAdminDataField => ({
  ...pick(response, ['question', 'answer', 'fieldType']),
  answerTemplate: response.answer.split('\n'),
})
