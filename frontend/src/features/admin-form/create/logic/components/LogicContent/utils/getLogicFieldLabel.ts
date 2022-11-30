import { BasicField } from '~shared/types'

import { FormFieldWithQuestionNo } from '~features/form/types'

export const getLogicFieldLabel = (field: FormFieldWithQuestionNo) => {
  const questionNumber = field.questionNumber ? `${field.questionNumber}. ` : ''
  let title = field.title
  switch (field.fieldType) {
    case BasicField.Statement:
      title = field.description
      break
    case BasicField.Image:
      title = field.name
      break
    default:
      break
  }
  return questionNumber + title
}
