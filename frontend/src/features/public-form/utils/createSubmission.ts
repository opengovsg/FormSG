import { datadogLogs } from '@datadog/browser-logs'
import { encode as encodeBase64 } from '@stablelib/base64'
import { chain, forOwn, isEmpty, keyBy, omit, pick } from 'lodash'

import { BasicField, FormFieldDto, PaymentFieldsDto } from '~shared/types/field'
import {
  EmailResponse,
  FieldResponse,
  MobileResponse,
} from '~shared/types/response'
import {
  ResponseMetadata,
  StorageModeAttachment,
  StorageModeAttachmentsMap,
  StorageModeSubmissionContentDto,
} from '~shared/types/submission'

import fileArrayBuffer from '~/utils/fileArrayBuffer'

import formsgSdk from '~utils/formSdk'
import { AttachmentFieldSchema, FormFieldValues } from '~templates/Field'

import { transformInputsToOutputs } from './inputTransformation'
import { validateResponses } from './validateResponses'

// The current encrypt version to assign to the encrypted submission.
// This is needed if we ever break backwards compatibility with
// end-to-end encryption
const ENCRYPT_VERSION = 1

/**
 * @returns StorageModeSubmissionContentDto
 * @throw Error if form inputs are invalid.
 */
export const createEncryptedSubmissionData = async ({
  formFields,
  formInputs,
  publicKey,
  responseMetadata,
  paymentReceiptEmail,
  payments,
}: {
  formFields: FormFieldDto[]
  formInputs: FormFieldValues
  publicKey: string
  responseMetadata?: ResponseMetadata
  paymentReceiptEmail?: string
  payments?: PaymentFieldsDto
}): Promise<StorageModeSubmissionContentDto> => {
  const responses = createResponsesArray(formFields, formInputs)
  const encryptedContent = formsgSdk.crypto.encrypt(responses, publicKey)
  // Edge case: We still send email/verifiable fields to the server in plaintext
  // even with end-to-end encryption in order to support email autoreplies and
  // signature verification (for when signature has expired).
  const filteredResponses = filterSendableStorageModeResponses(
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
    paymentReceiptEmail,
    payments,
    version: ENCRYPT_VERSION,
    responseMetadata,
  }
}

/**
 * @returns formData containing form responses and attachments.
 * @throws Error if form inputs are invalid.
 */
export const createEmailSubmissionFormData = (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
  responseMetadata?: ResponseMetadata,
) => {
  const responses = createResponsesArray(formFields, formInputs)
  const attachments = getAttachmentsMap(formFields, formInputs)

  // Convert content to FormData object.
  const formData = new FormData()
  formData.append('body', JSON.stringify({ responses, responseMetadata }))

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
  formInputs: FormFieldValues,
): FieldResponse[] => {
  const transformedResponses = formFields
    .map((ff) => transformInputsToOutputs(ff, formInputs[ff._id]))
    .filter((output): output is FieldResponse => output !== null)

  return validateResponses(transformedResponses)
}

const getEncryptedAttachmentsMap = async (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
  publicKey: string,
): Promise<StorageModeAttachmentsMap> => {
  const attachmentsMap = getAttachmentsMap(formFields, formInputs)

  const attachmentPromises = Object.entries(attachmentsMap).map(
    ([id, attachment]) => encryptAttachment(attachment, { id, publicKey }),
  )

  return Promise.all(attachmentPromises).then((encryptedAttachmentsMeta) =>
    chain(encryptedAttachmentsMeta)
      .keyBy('id')
      // Remove id from object.
      .mapValues((v) => omit(v, 'id'))
      .value(),
  )
}

const getAttachmentsMap = (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
): Record<string, File> => {
  const attachmentsMap: Record<string, File> = {}
  const attachmentFields = formFields.filter(
    (ff): ff is AttachmentFieldSchema => ff.fieldType === BasicField.Attachment,
  )
  attachmentFields.forEach((af) => {
    const attachmentValue = formInputs[af._id]
    if (!(attachmentValue instanceof File)) return
    attachmentsMap[af._id] = attachmentValue
  })

  return attachmentsMap
}

// TODO (FRM-1232): Remove once encryption boundary has been shifted.
/**
 * Utility to filter out responses that should be sent to the server. This includes:
 * 1. Email fields that have an autoreply enabled.
 * 2. Verifiable fields to verify its signature on the backend.
 */
const filterSendableStorageModeResponses = (
  formFields: FormFieldDto[],
  responses: FieldResponse[],
) => {
  const mapFieldIdToField = keyBy(formFields, '_id')
  return responses
    .filter((r): r is EmailResponse | MobileResponse => {
      switch (r.fieldType) {
        case BasicField.Email: {
          const field = mapFieldIdToField[r._id]
          if (!field || field.fieldType !== r.fieldType) return false
          // Only filter out fields with auto reply set to true, or if field is verifiable.
          return field.autoReplyOptions.hasAutoReply || field.isVerifiable
        }
        case BasicField.Mobile: {
          const field = mapFieldIdToField[r._id]
          if (!field || field.fieldType !== r.fieldType) return false
          return field.isVerifiable
        }
        default:
          return false
      }
    })
    .map((r) => pick(r, ['fieldType', '_id', 'answer', 'signature']))
}
const encryptAttachment = async (
  attachment: File,
  { id, publicKey }: { id: string; publicKey: string },
): Promise<StorageModeAttachment & { id: string }> => {
  let label

  try {
    label = 'Read file content'
    const buffer = await fileArrayBuffer(attachment)

    const fileContentsView = new Uint8Array(buffer)

    label = 'Encrypt content'
    const encryptedAttachment = await formsgSdk.crypto.encryptFile(
      fileContentsView,
      publicKey,
    )

    label = 'Base64-encode encrypted content'
    const encodedEncryptedAttachment = {
      ...encryptedAttachment,
      binary: encodeBase64(encryptedAttachment.binary),
    }

    return { id, encryptedFile: encodedEncryptedAttachment }
  } catch (error) {
    // TODO: remove error logging when error about arrayBuffer not being a function is resolved
    datadogLogs.logger.error(`encryptAttachment: ${label}: ${error?.message}`, {
      meta: {
        error: {
          message: error?.message,
          stack: error?.stack,
        },
        attachment: {
          id,
          type: typeof attachment,
          extension: attachment.name?.split('.').pop(),
          size: attachment.size,
          isBlob: attachment instanceof Blob,
          isFile: attachment instanceof File,
          arrayBuffer: typeof attachment.arrayBuffer,
        },
      },
    })
    // Rethrow to maintain behaviour
    throw error
  }
}
