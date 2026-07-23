import {
  CheckboxAnswerV4,
  RadioAnswerV4,
  VerifiableAnswerV4,
} from '@opengovsg/formsg-sdk'
import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { BasicField } from 'formsg-shared/types'
import { isEqual } from 'lodash'

import {
  ParsedClearAttachmentAnswerV4,
  ParsedClearFormFieldResponseV3,
  ParsedClearFormFieldResponseV4,
} from '../../../types/api/submission'

import {
  isGenericStringAnswerResponseV3,
  isGenericStringAnswerResponseV4,
} from './field-validation.guards'

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

export const checkIsResponseChangedV4 = ({
  response,
  prevResponse,
}: {
  response: ParsedClearFormFieldResponseV4
  prevResponse?: ParsedClearFormFieldResponseV4
}): boolean => {
  if (!prevResponse) return true
  if (response.fieldType !== prevResponse.fieldType) return true

  if (isGenericStringAnswerResponseV4(response)) {
    const a = (response.answer as { value: string }).value
    const p = (prevResponse.answer as { value: string }).value
    return a !== p
  }

  switch (response.fieldType) {
    case BasicField.YesNo: {
      const a = response.answer as { value: string }
      const p = prevResponse.answer as { value: string }
      return a.value !== p.value
    }
    case BasicField.Email:
    case BasicField.Mobile: {
      const a = response.answer as VerifiableAnswerV4
      const p = prevResponse.answer as VerifiableAnswerV4
      return a.value !== p.value || a.signature !== p.signature
    }
    case BasicField.Radio: {
      const a = response.answer as RadioAnswerV4
      const p = prevResponse.answer as RadioAnswerV4
      return a.value !== p.value || a.isOthersInput !== p.isOthersInput
    }
    case BasicField.Checkbox: {
      const a = response.answer as CheckboxAnswerV4
      const p = prevResponse.answer as CheckboxAnswerV4
      const setsDiffer = !isEqual(new Set(a.value), new Set(p.value))
      const othersDiffer = (a.othersInput ?? '') !== (p.othersInput ?? '')
      return setsDiffer || othersDiffer
    }
    case BasicField.Table:
      return (
        JSON.stringify(response.answer) !== JSON.stringify(prevResponse.answer)
      )
    case BasicField.Attachment: {
      const a = response.answer as ParsedClearAttachmentAnswerV4
      const p = prevResponse.answer as ParsedClearAttachmentAnswerV4
      return (
        a.filename !== p.filename ||
        a.value !== p.value ||
        a.content !== p.content
      )
    }
    default:
      return true
  }
}
