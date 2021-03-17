import { pick } from 'lodash'

import {
  EmailAdminDataField,
  EmailDataCollationToolField,
  EmailRespondentConfirmationField,
} from 'src/app/modules/submission/email-submission/email-submission.types'
import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'

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
