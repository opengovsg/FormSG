import { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { BasicField } from 'formsg-shared/types'
import { handleAddressResponseDisplay } from 'formsg-shared/utils/address'

import { SIGNATURE_ADDED_TEXT } from '~features/admin-form/responses/constants'

/**
 * A signature's stored answer is a payload, `draw;...`, with nothing in it to
 * read, so the cell says one is there instead and stays empty when it is not.
 * An attachment's answer is its filename, which reads for itself.
 */
const DESCRIBED_ANSWER_TEXT: Partial<Record<BasicField, string>> = {
  [BasicField.Signature]: SIGNATURE_ADDED_TEXT,
}

export const isDescribedFieldType = (fieldType?: BasicField): boolean =>
  !!fieldType && fieldType in DESCRIBED_ANSWER_TEXT

/**
 * An unanswered field still arrives with a response, carrying an empty string
 * rather than nothing, so the entries decide this and not the array's length.
 */
const hasAnswer = (response: FormField): boolean => {
  if (response.answerArray) {
    return response.answerArray.flat().some((entry) => !!entry?.trim())
  }
  return !!response.answer?.trim()
}

export const formatResponseForCell = (response?: FormField): string => {
  if (!response) return ''

  const describedText =
    DESCRIBED_ANSWER_TEXT[response.fieldType as unknown as BasicField]
  if (describedText) {
    return hasAnswer(response) ? describedText : ''
  }

  if (response.fieldType === BasicField.Address && response.answerArray) {
    return handleAddressResponseDisplay(response.answerArray as string[]).join(
      ', ',
    )
  }

  if (response.answerArray) {
    return response.answerArray
      .map((entry) => (Array.isArray(entry) ? entry.join(', ') : entry))
      .join('; ')
  }

  return response.answer ?? ''
}
