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
    case BasicField.Email:
      // Inform admins if email confirmation will be sent
      if (field.autoReplyOptions.hasAutoReply) {
        title = title + " (confirmation will be sent)"
      }
      break
    default:
      break
  }
  return questionNumber + title
}
