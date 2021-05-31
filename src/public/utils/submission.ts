import forOwn from 'lodash/forOwn'
import isEmpty from 'lodash/isEmpty'

import { EmailSubmissionDto } from '../../types/api'

export const createEmailSubmissionFormData = ({
  content,
  attachments = {},
}: {
  content: EmailSubmissionDto
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
