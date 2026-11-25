import { ATTACHMENT_QUESTION_PREFIX } from 'formsg-shared/constants'
import { BasicField } from 'formsg-shared/types'

export const getAttachmentQuestionLabel = ({
  question,
  fieldType,
  keepV4ResponseFormat,
}: {
  question: string
  fieldType: string
  keepV4ResponseFormat: boolean
}): string =>
  !keepV4ResponseFormat && fieldType === BasicField.Attachment
    ? `${ATTACHMENT_QUESTION_PREFIX}${question}`
    : question
