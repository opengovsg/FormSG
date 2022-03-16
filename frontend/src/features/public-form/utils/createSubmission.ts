import { forOwn, isEmpty } from 'lodash'

import { BasicField, FormFieldDto } from '~shared/types/field'
import { FieldResponse } from '~shared/types/response'

import { AttachmentFieldSchema } from '~templates/Field'

import { transformInputsToOutputs } from './inputTransformation'
import { validateAttachmentInput } from './inputValidation'

export const createEmailSubmissionFormData = (
  formFields: FormFieldDto[],
  formInputs: Record<string, unknown>,
) => {
  const responses = createResponsesArray(formFields, formInputs)
  const attachments = getAttachmentsMap(formFields, formInputs)

  // Convert content to FormData object.
  const formData = new FormData()
  formData.append('body', JSON.stringify({ responses }))

  if (!isEmpty(attachments)) {
    forOwn(attachments, (attachment, fieldId) => {
      if (attachment) {
        formData.append(attachment.name, attachment, fieldId)
      }
    })
  }

  return formData
}

const createResponsesArray = (
  formFields: FormFieldDto[],
  formInputs: Record<string, unknown>,
): FieldResponse[] => {
  return formFields
    .map((ff) => transformInputsToOutputs(ff, formInputs[ff._id]))
    .filter((output): output is FieldResponse => output !== undefined)
}

const getAttachmentsMap = (
  formFields: FormFieldDto[],
  formInputs: Record<string, unknown>,
): Record<string, File> => {
  const attachmentsMap: Record<string, File> = {}
  const attachmentFields = formFields.filter(
    (ff): ff is AttachmentFieldSchema => ff.fieldType === BasicField.Attachment,
  )
  attachmentFields.forEach((af) => {
    const attachmentValue = formInputs[af._id]
    if (!validateAttachmentInput(attachmentValue)) return
    attachmentsMap[af._id] = attachmentValue
  })

  return attachmentsMap
}
