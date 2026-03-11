import { BasicField } from 'formsg-shared/types'

import { FormFieldWithQuestionNo } from '~features/form/types'
import { isMyInfo } from '~features/myinfo/utils'

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
        title = title + ' (confirmation will be sent)'
      }
      break
    default:
      break
  }

  // Add MyInfo tag if field is a MyInfo field
  if (isMyInfo(field)) {
    title = title + ' (Myinfo)'
  }

  return questionNumber + title
}
