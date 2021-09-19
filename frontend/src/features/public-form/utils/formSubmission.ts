import { forOwn, isEmpty } from 'lodash'

import { EmailModeSubmissionContentDto } from '~shared/types/submission'

export const createEmailSubmissionFormData = ({
  content,
  attachments = {},
}: {
  content: EmailModeSubmissionContentDto
  attachments?: Record<string, File>
}): FormData => {
  // Convert passed content to FormData object.
  const formData = new FormData()
  formData.append('body', JSON.stringify(content))

  if (!isEmpty(attachments)) {
    forOwn(attachments, (attachment, fieldId) => {
      if (attachment) {
        formData.append(attachment.name, attachment, fieldId)
      }
    })
  }

  return formData
}
