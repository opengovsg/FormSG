import { BasicField } from '~shared/types'

import { FormFieldWithQuestionNo } from '~features/form/types'

export const getLogicFieldLabel = (field: FormFieldWithQuestionNo) => {
  const questionNumber = field.questionNumber ? `${field.questionNumber}. ` : ''
  let title = field.title
  switch (field.fieldType) {
    case BasicField.Statement:
      // Replaces all continuous whitespace with a single space for display on a single line.
      title = field.description.replace(/\s+/, ' ')
      break
    case BasicField.Image:
      title = field.name
      break
    default:
      break
  }
  return questionNumber + title
}
