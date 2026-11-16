import { ATTACHMENT_QUESTION_PREFIX } from 'formsg-shared/constants'
import { BasicField } from 'formsg-shared/types'

/**
 * Labels an attachment question `[attachment] <question>`, unless ops turned
 * on keep-v4-attachment-prefix to keep the old unlabelled question.
 */
export const getAttachmentQuestionLabel = ({
  question,
  fieldType,
  keepV4AttachmentPrefix,
}: {
  question: string
  fieldType: string
  keepV4AttachmentPrefix: boolean
}): string =>
  !keepV4AttachmentPrefix && fieldType === BasicField.Attachment
    ? `${ATTACHMENT_QUESTION_PREFIX}${question}`
    : question
