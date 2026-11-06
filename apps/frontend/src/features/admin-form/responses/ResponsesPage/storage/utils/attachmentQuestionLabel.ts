import { ATTACHMENT_QUESTION_PREFIX } from 'formsg-shared/constants'
import { BasicField } from 'formsg-shared/types'

/** Labels an attachment question `[attachment] <question>` under Attachments v2. */
export const getAttachmentQuestionLabel = ({
  question,
  fieldType,
  isAttachmentsV2Enabled,
}: {
  question: string
  fieldType: string
  isAttachmentsV2Enabled: boolean
}): string =>
  isAttachmentsV2Enabled && fieldType === BasicField.Attachment
    ? `${ATTACHMENT_QUESTION_PREFIX}${question}`
    : question
