import { FormFieldDto } from '~shared/types/field'

import { BASICFIELD_TO_DRAWER_META } from '../../constants'

export const getBuilderQuestionNumbers = (
  fields: FormFieldDto[],
): (string | undefined)[] => {
  let questionCounter = 0
  return fields.map((field) => {
    if (BASICFIELD_TO_DRAWER_META[field.fieldType].isSubmitted) {
      return `${++questionCounter}.`
    }
    return undefined
  })
}
