import { datadogLogs } from '@datadog/browser-logs'
import { encode as encodeBase64 } from '@stablelib/base64'
import { chain, forOwn, isEmpty, keyBy, omit, pick } from 'lodash'

import { E2EE_SUBMISSION_VERSION } from '~shared/constants'
import { FieldResponsesV3, FieldResponseV3, ProductItem } from '~shared/types'
import { BasicField, FormFieldDto, PaymentFieldsDto } from '~shared/types/field'
import {
  EmailResponse,
  FieldResponse,
  MobileResponse,
} from '~shared/types/response'
import {
  ResponseMetadata,
  StorageModeSubmissionContentDto,
  SubmissionAttachment,
  SubmissionAttachmentsMap,
} from '~shared/types/submission'

import fileArrayBuffer from '~/utils/fileArrayBuffer'

import formsgSdk from '~utils/formSdk'
import {
  AttachmentFieldSchema,
  FormFieldValue,
  FormFieldValues,
} from '~templates/Field'

import { FieldIdToQuarantineKeyType } from '../PublicFormService'

import { transformInputsToOutputs } from './inputTransformation'
import { validateResponses } from './validateResponses'

/**
 * @returns StorageModeSubmissionContentDto
 * @throws Error if form inputs are invalid.
 */
export const createEncryptedSubmissionData = async ({
  formFields,
  formInputs,
  publicKey,
  responseMetadata,
  paymentReceiptEmail,
  payments,
  paymentProducts,
}: {
  formFields: FormFieldDto[]
  formInputs: FormFieldValues
  publicKey: string
  responseMetadata?: ResponseMetadata
  paymentReceiptEmail?: string
  payments?: PaymentFieldsDto
  paymentProducts?: Array<ProductItem>
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
    paymentProducts,
    payments,
    version: E2EE_SUBMISSION_VERSION,
    responseMetadata,
  }
}

type CreateEmailSubmissionFormDataArgs = {
  formFields: FormFieldDto[]
  formInputs: FormFieldValues
  responseMetadata?: ResponseMetadata
}

type CreateStorageSubmissionFormDataArgs = CreateEmailSubmissionFormDataArgs & {
  paymentReceiptEmail?: string
  paymentProducts?: ProductItem[]
  payments?: PaymentFieldsDto
  version: number
}

type CreateMultirespondentSubmissionFormDataArgs =
  CreateEmailSubmissionFormDataArgs & {
    submissionSecretKey?: string
    version: number
  }

/**
 * Used for both Email mode submissions and Storage mode submissions after encryption boundary shift.
 * @returns formData containing form responses and attachments.
 * @throws Error if form inputs are invalid.
 */
export const createClearSubmissionFormData = (
  formDataArgs:
    | CreateEmailSubmissionFormDataArgs
    | CreateStorageSubmissionFormDataArgs,
) => {
  const { formFields, formInputs, ...formDataArgsRest } = formDataArgs
  const responses = createResponsesArray(formFields, formInputs)
  const attachments = getAttachmentsMap(formFields, formInputs)

  // Convert content to FormData object.
  const formData = new FormData()
  formData.append(
    'body',
    JSON.stringify({
      responses,
      ...formDataArgsRest,
    }),
  )

  if (!isEmpty(attachments)) {
    forOwn(attachments, (attachment, fieldId) => {
      if (attachment) {
        formData.append(attachment.name, attachment, fieldId)
      }
    })
  }

  return formData
}

/**
 * Used for Storage mode submissions v2.1+ (after virus scanning).
 * @returns formData containing form responses and attachments.
 * @throws Error if form inputs are invalid or contain malicious attachment(s).
 */
export const createClearSubmissionWithVirusScanningFormData = (
  formDataArgs:
    | CreateEmailSubmissionFormDataArgs
    | CreateStorageSubmissionFormDataArgs,
  fieldIdToQuarantineKeyMap: FieldIdToQuarantineKeyType[],
) => {
  const { formFields, formInputs, ...formDataArgsRest } = formDataArgs
  const responses = createResponsesArray(formFields, formInputs).map(
    (response) => {
      if (response.fieldType === BasicField.Attachment && response.answer) {
        // for each attachment response, find the corresponding quarantine bucket key
        const fieldIdToQuarantineKeyEntry = fieldIdToQuarantineKeyMap.find(
          (v) => v.fieldId === response._id,
        )
        if (!fieldIdToQuarantineKeyEntry)
          throw new Error(
            `Attachment response with fieldId ${response._id} not found among attachments uploaded to quarantine bucket`,
          )
        // set response.answer as the quarantine bucket key
        response.answer = fieldIdToQuarantineKeyEntry.quarantineBucketKey
      }
      return response
    },
  )
  const attachments = getAttachmentsMap(formFields, formInputs)

  // Convert content to FormData object.
  const formData = new FormData()
  formData.append(
    'body',
    JSON.stringify({
      responses,
      ...formDataArgsRest,
    }),
  )

  if (!isEmpty(attachments)) {
    forOwn(attachments, (attachment, fieldId) => {
      if (attachment) {
        formData.append(
          attachment.name,
          // Set content as empty array buffer.
          new File([], attachment.name, { type: attachment.type }),
          fieldId,
        )
      }
    })
  }

  return formData
}

/**
 * Used for MRF submissions v3 (after virus scanning).
 * @returns formData containing form responses and attachments.
 * @throws Error if form inputs are invalid or contain malicious attachment(s).
 */
export const createClearSubmissionWithVirusScanningFormDataV3 = (
  formDataArgs: CreateMultirespondentSubmissionFormDataArgs,
  fieldIdToQuarantineKeyMap: FieldIdToQuarantineKeyType[],
) => {
  const { formFields, formInputs, ...formDataArgsRest } = formDataArgs

  // Call this to validate responses, but don't actually use the result
  // TODO: Move validation to before response array creation so it can be used for encryption v2-3
  createResponsesArray(formFields, formInputs)

  const responses = createResponsesV3(
    formFields,
    formInputs,
    fieldIdToQuarantineKeyMap,
  )

  const attachments = getAttachmentsMap(formFields, formInputs)

  // Convert content to FormData object.
  const formData = new FormData()
  formData.append(
    'body',
    JSON.stringify({
      responses,
      ...formDataArgsRest,
    }),
  )

  if (!isEmpty(attachments)) {
    forOwn(attachments, (attachment, fieldId) => {
      if (attachment) {
        formData.append(
          attachment.name,
          // Set content as empty array buffer.
          new File([], attachment.name, { type: attachment.type }),
          fieldId,
        )
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

const createResponsesV3 = (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
  fieldIdToQuarantineKeyMap: FieldIdToQuarantineKeyType[],
): FieldResponsesV3 => {
  const returnedInputs: FieldResponsesV3 = {}
  for (const ff of formFields) {
    switch (ff.fieldType) {
      case BasicField.Number:
      case BasicField.Decimal:
      case BasicField.ShortText:
      case BasicField.LongText:
      case BasicField.HomeNo:
      case BasicField.Dropdown:
      case BasicField.Rating:
      case BasicField.Nric:
      case BasicField.Uen:
      case BasicField.Date:
      case BasicField.CountryRegion:
      case BasicField.YesNo: {
        const input = formInputs[ff._id] as
          | FormFieldValue<typeof ff.fieldType>
          | undefined
        if (!input) break
        returnedInputs[ff._id] = {
          fieldType: ff.fieldType,
          answer: input,
        } as FieldResponseV3
        break
      }
      case BasicField.Email:
      case BasicField.Mobile: {
        const input = formInputs[ff._id] as
          | FormFieldValue<typeof ff.fieldType>
          | undefined
        if (!input?.value) break
        returnedInputs[ff._id] = {
          fieldType: ff.fieldType,
          answer: input,
        } as FieldResponseV3
        break
      }
      case BasicField.Table: {
        const input = formInputs[ff._id] as
          | FormFieldValue<typeof ff.fieldType>
          | undefined
        if (!input) break
        if (input.every((row) => Object.values(row).every((value) => !value))) {
          break
        }
        returnedInputs[ff._id] = {
          fieldType: ff.fieldType,
          answer: input,
        } as FieldResponseV3
        break
      }
      case BasicField.Checkbox: {
        const input = formInputs[ff._id] as
          | FormFieldValue<typeof ff.fieldType>
          | undefined
        if (
          (!input?.value || input?.value.length === 0) &&
          !input?.othersInput
        ) {
          break
        }
        returnedInputs[ff._id] = {
          fieldType: ff.fieldType,
          answer: input,
        } as FieldResponseV3
        break
      }
      case BasicField.Children: {
        const input = formInputs[ff._id] as
          | FormFieldValue<typeof ff.fieldType>
          | undefined
        if (
          !input ||
          input.child.every((child) => child.every((value) => !value))
        ) {
          break
        }
        returnedInputs[ff._id] = {
          fieldType: ff.fieldType,
          answer: input,
        } as FieldResponseV3
        break
      }
      case BasicField.Attachment: {
        const input = formInputs[ff._id] as
          | FormFieldValue<typeof ff.fieldType>
          | undefined
        if (!input) break
        // for each attachment response, find the corresponding quarantine bucket key
        const fieldIdToQuarantineKeyEntry = fieldIdToQuarantineKeyMap.find(
          (v) => v.fieldId === ff._id,
        )
        if (!fieldIdToQuarantineKeyEntry)
          throw new Error(
            `Attachment response with fieldId ${ff._id} not found among attachments uploaded to quarantine bucket`,
          )
        returnedInputs[ff._id] = {
          fieldType: ff.fieldType,
          answer: {
            hasBeenScanned: false, //TODO: FRM-1839 + FRM-1590 conditionally set to true if not replaced by respondent 2 onwards
            answer: fieldIdToQuarantineKeyEntry.quarantineBucketKey,
          },
        }
        break
      }
      case BasicField.Radio: {
        const input = formInputs[ff._id] as
          | FormFieldValue<typeof ff.fieldType>
          | undefined
        if (!input?.value && !input?.othersInput) break
        returnedInputs[ff._id] = {
          fieldType: ff.fieldType,
          answer: input.othersInput
            ? { othersInput: input.othersInput }
            : { value: input.value },
        }
        break
      }
      case BasicField.Section:
      case BasicField.Image:
      case BasicField.Statement: {
        break
      }
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = ff
      }
    }
  }
  return returnedInputs
}

const getEncryptedAttachmentsMap = async (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
  publicKey: string,
): Promise<SubmissionAttachmentsMap> => {
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

export const getAttachmentsMap = (
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
): Promise<SubmissionAttachment & { id: string }> => {
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
  } catch (err) {
    const error = err as Error
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
