import { BasicField } from 'formsg-shared/types'

import { ProcessedFieldResponse } from '../submission.types'

/**
 * Extracts an array of answers to email fields
 * @param parsedResponses All form responses
 * @returns an array of all email field responses
 */
export const extractEmailAnswers = (
  parsedResponses: ProcessedFieldResponse[],
): string[] => {
  return parsedResponses.reduce<string[]>((acc, response) => {
    if (response.fieldType === BasicField.Email && response.answer) {
      acc.push(response.answer)
    }
    return acc
  }, [])
}
