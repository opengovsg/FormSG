import { pick } from 'lodash'

import { ProcessedSingleAnswerResponse } from 'src/app/modules/submission/submission.types'
import {
  EmailDataField,
  EmailDataCollationToolField,
} from 'src/types'

export const generateSingleAnswerJson = (
  response: ProcessedSingleAnswerResponse,
): EmailDataCollationToolField => pick(response, ['question', 'answer'])

export const generateSingleAnswerFormData = (
  response: ProcessedSingleAnswerResponse,
): EmailDataField => ({
  ...pick(response, ['question', 'answer', 'fieldType']),
  answerTemplate: response.answer.split('\n'),
})
