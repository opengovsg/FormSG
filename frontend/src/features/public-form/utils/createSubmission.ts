import { encode as encodeBase64 } from '@stablelib/base64'
import { chain, forOwn, isEmpty, omit } from 'lodash'

import { BasicField, FormFieldDto } from '~shared/types/field'
import { EmailResponse, FieldResponse } from '~shared/types/response'
import {
  StorageModeAttachment,
  StorageModeAttachmentsMap,
  StorageModeSubmissionContentDto,
} from '~shared/types/submission'

import formsgSdk from '~utils/formSdk'
import { AttachmentFieldSchema } from '~templates/Field'

import { transformInputsToOutputs } from './inputTransformation'
import { validateAttachmentInput } from './inputValidation'

// The current encrypt version to assign to the encrypted submission.
// This is needed if we ever break backwards compatibility with
// end-to-end encryption
const ENCRYPT_VERSION = 1

export const createEncryptedSubmissionData = async (
  formFields: FormFieldDto[],
  formInputs: Record<string, unknown>,
  publicKey: string,
): Promise<StorageModeSubmissionContentDto> => {
  const responses = createResponsesArray(formFields, formInputs)
  const encryptedContent = formsgSdk.crypto.encrypt(responses, publicKey)
  // Edge case: We still send email fields to the server in plaintext
  // even with end-to-end encryption in order to support email autoreplies
  const filteredResponses = filterEmailResponsesWithAutoreply(
    formFields,
    responses,
  )
  const attachments = await getEncryptedAttachmentsMap(
    formFields,
    formInputs,
    publicKey,
  )

  return {
    attachments,
    responses: filteredResponses,
    encryptedContent,
    version: ENCRYPT_VERSION,
  }
}

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

export const createResponsesArray = (
  formFields: FormFieldDto[],
  formInputs: Record<string, unknown>,
): FieldResponse[] => {
  return formFields
    .map((ff) => transformInputsToOutputs(ff, formInputs[ff._id]))
    .filter((output): output is FieldResponse => output !== undefined)
}

const getEncryptedAttachmentsMap = async (
  formFields: FormFieldDto[],
  formInputs: Record<string, unknown>,
  publicKey: string,
): Promise<StorageModeAttachmentsMap> => {
  const attachmentsMap = getAttachmentsMap(formFields, formInputs)

  const attachmentPromises = Object.keys(attachmentsMap).map((id) =>
    encryptAttachment(attachmentsMap[id], { id, publicKey }),
  )

  return Promise.all(attachmentPromises).then((encryptedAttachmentsMeta) => {
    return (
      chain(encryptedAttachmentsMeta)
        .keyBy('id')
        // Remove id from object.
        .mapValues((v) => omit(v, 'id'))
        .value()
    )
  })
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
const filterEmailResponsesWithAutoreply = (
  formFields: FormFieldDto[],
  responses: FieldResponse[],
) => {
  return responses
    .filter((r): r is EmailResponse => {
      const isEmailResponse = r.fieldType === BasicField.Email
      if (!isEmailResponse) return false
      const field = formFields.find((ff) => ff._id === r._id)
      if (field?.fieldType !== BasicField.Email) return false
      // Only filter out fields with auto reply set to true
      return field.autoReplyOptions.hasAutoReply
    })
    .map((r) =>
      chain(r).pick(['fieldType', '_id', 'answer', 'signature']).value(),
    )
}
const encryptAttachment = async (
  attachment: File,
  { id, publicKey }: { id: string; publicKey: string },
): Promise<StorageModeAttachment & { id: string }> => {
  const fileArrayBuffer = await attachment.arrayBuffer()
  const fileContentsView = new Uint8Array(fileArrayBuffer)

  const encryptedAttachment = await formsgSdk.crypto.encryptFile(
    fileContentsView,
    publicKey,
  )
  const encodedEncryptedAttachment = {
    ...encryptedAttachment,
    binary: encodeBase64(encryptedAttachment.binary),
  }

  return { id, encryptedFile: encodedEncryptedAttachment }
}
