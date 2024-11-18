import { isEqual } from 'lodash'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from '../../../../shared/constants'
import { BasicField } from '../../../../shared/types'
import { ParsedClearFormFieldResponseV3 } from '../../../types/api/submission'

import { isGenericStringAnswerResponseV3 } from './field-validation.guards'

export const checkIsResponseChangedV3 = ({
  response,
  prevResponse,
}: {
  response: ParsedClearFormFieldResponseV3
  prevResponse?: ParsedClearFormFieldResponseV3
}): boolean => {
  if (!prevResponse) {
    return true
  }
  if (response.fieldType !== prevResponse.fieldType) {
    return true
  }

  if (isGenericStringAnswerResponseV3(response)) {
    return response.answer.toString() !== prevResponse.answer.toString()
  }

  switch (response.fieldType) {
    case BasicField.YesNo:
      return response.answer !== prevResponse.answer
    case BasicField.Email:
    case BasicField.Mobile:
      return !(
        response.fieldType === prevResponse.fieldType &&
        prevResponse.answer.value === response.answer.value &&
        prevResponse.answer.signature === response.answer.signature
      )
    case BasicField.Radio: {
      if (prevResponse.fieldType !== response.fieldType) {
        return true
      }
      const prevResponseValue =
        'value' in prevResponse.answer
          ? prevResponse.answer.value
          : 'othersInput' in prevResponse.answer
            ? prevResponse.answer.othersInput
            : null
      const responseValue =
        'value' in response.answer
          ? response.answer.value
          : 'othersInput' in response.answer
            ? response.answer.othersInput
            : null
      return prevResponseValue !== responseValue
    }
    case BasicField.Checkbox: {
      if (prevResponse.fieldType !== response.fieldType) {
        return true
      }
      const isOthersInputSelected = response.answer.value.includes(
        CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
      )
      const isOthersInputSelectedPrev = prevResponse.answer.value.includes(
        CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
      )
      return (
        !isEqual(
          new Set(response.answer.value),
          new Set(prevResponse.answer.value),
        ) ||
        isOthersInputSelected !== isOthersInputSelectedPrev ||
        // if the othersInput is selected in both response and prevResponse, then return true if the othersInput values are different
        (isOthersInputSelected &&
          isOthersInputSelectedPrev &&
          response.answer.othersInput !== prevResponse.answer.othersInput)
      )
    }
    case BasicField.Table:
      return (
        JSON.stringify(response.answer) !== JSON.stringify(prevResponse.answer)
      )
    case BasicField.Attachment:
      if (prevResponse.fieldType !== response.fieldType) {
        return true
      }
      return (
        response.answer.filename !== prevResponse.answer.filename ||
        response.answer.answer !== prevResponse.answer.answer ||
        response.answer.content !== prevResponse.answer.content
      )
    default:
      return true
  }
}
