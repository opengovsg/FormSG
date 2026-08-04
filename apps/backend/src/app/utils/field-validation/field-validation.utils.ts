import {
  CheckboxAnswerV4,
  RadioAnswerV4,
  VerifiableAnswerV4,
} from '@opengovsg/formsg-sdk'
import { BasicField } from 'formsg-shared/types'
import { isEqual } from 'lodash'

import {
  ParsedClearAttachmentAnswerV4,
  ParsedClearFormFieldResponseV4,
} from '../../../types/api/submission'

import { isGenericStringAnswerResponseV4 } from './field-validation.guards'

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
      // Optional-chain: malformed bodies can send a null answer or omit
      // `value` entirely; treat as an empty selection rather than throwing.
      const a = response.answer as CheckboxAnswerV4 | null
      const p = prevResponse.answer as CheckboxAnswerV4 | null
      const setsDiffer = !isEqual(
        new Set(a?.value ?? []),
        new Set(p?.value ?? []),
      )
      const othersDiffer = (a?.othersInput ?? '') !== (p?.othersInput ?? '')
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
