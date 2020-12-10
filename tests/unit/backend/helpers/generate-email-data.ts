import { pick } from 'lodash'

import {
  EmailAutoReplyField,
  EmailFormField,
  EmailJsonField,
} from 'src/app/modules/submission/email-submission/email-submission.types'
import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'

export const generateSingleAnswerJson = (
  response: ProcessedSingleAnswerResponse,
): EmailJsonField => pick(response, ['question', 'answer'])

export const generateSingleAnswerAutoreply = (
  response: ProcessedSingleAnswerResponse,
): EmailAutoReplyField => ({
  question: response.question,
  answerTemplate: response.answer.split('\n'),
})

export const generateSingleAnswerFormData = (
  response: ProcessedSingleAnswerResponse,
): EmailFormField => ({
  ...pick(response, ['question', 'answer', 'fieldType']),
  answerTemplate: response.answer.split('\n'),
})
