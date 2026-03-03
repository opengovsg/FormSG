import { pick } from 'lodash'

import { ProcessedSingleAnswerResponse } from 'apps/backend/src/app/modules/submission/submission.types'
import { EmailDataField, EmailDataCollationToolField } from 'apps/backend/src/types'

export const generateSingleAnswerJson = (
  response: ProcessedSingleAnswerResponse,
): EmailDataCollationToolField => pick(response, ['question', 'answer'])

export const generateSingleAnswerFormData = (
  response: ProcessedSingleAnswerResponse,
): EmailDataField => ({
  ...pick(response, ['question', 'answer', 'fieldType']),
  answerTemplate: response.answer.split('\n'),
})
