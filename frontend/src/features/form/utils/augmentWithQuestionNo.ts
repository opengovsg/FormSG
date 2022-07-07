import { FormFieldDto } from '~shared/types/field'

import { NON_RESPONSE_FIELD_SET } from '../constants'
import { FormFieldWithQuestionNo } from '../types'

type AugmentedFieldAccumulator = {
  fields: FormFieldWithQuestionNo[]
  questionNumber: number
}

export const augmentWithQuestionNo = (
  formFields: FormFieldDto[],
): FormFieldWithQuestionNo[] => {
  const { fields } = formFields.reduce<AugmentedFieldAccumulator>(
    (acc, field) => {
      if (NON_RESPONSE_FIELD_SET.has(field.fieldType)) acc.fields.push(field)
      else acc.fields.push({ ...field, questionNumber: acc.questionNumber++ })
      return acc
    },
    { fields: [], questionNumber: 1 },
  )
  return fields
}
