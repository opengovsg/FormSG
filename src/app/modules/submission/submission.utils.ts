import {
  differenceBy,
  flattenDeep,
  intersectionBy,
  keyBy,
  sumBy,
  uniqBy,
} from 'lodash'
import mongoose from 'mongoose'
import { err, ok, Result } from 'neverthrow'

import { FIELDS_TO_REJECT } from '../../../../shared/constants/field/basic'
import { MYINFO_ATTRIBUTE_MAP } from '../../../../shared/constants/field/myinfo'
import {
  BasicField,
  FormField,
  FormResponseMode,
  MyInfoAttribute,
} from '../../../../shared/types'
import * as FileValidation from '../../../../shared/utils/file-validation'
import {
  FieldResponse,
  FormFieldSchema,
  IAttachmentInfo,
  IEncryptSubmissionModel,
  IFormDocument,
  IMultirespondentSubmissionModel,
  IPopulatedEncryptedForm,
  IPopulatedForm,
  IPopulatedMultirespondentForm,
} from '../../../types'
import {
  ParsedClearAttachmentResponse,
  ParsedClearFormFieldResponse,
} from '../../../types/api'
import {
  getEncryptSubmissionModel,
  getMultirespondentSubmissionModel,
} from '../../models/submission.server.model'
import { AutoReplyMailData } from '../../services/mail/mail.types'
import { isFormEncryptModeOrMultirespondent } from '../form/form.utils'
import { MyInfoKey } from '../myinfo/myinfo.types'
import { getMyInfoChildHashKey } from '../myinfo/myinfo.util'

import { MYINFO_PREFIX } from './email-submission/email-submission.constants'
import { ResponseFormattedForEmail } from './email-submission/email-submission.types'
import { ConflictError, ResponseModeError } from './submission.errors'
import {
  FilteredResponse,
  ProcessedChildrenResponse,
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
} from './submission.types'

const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)
const MultirespondentSubmissionModel =
  getMultirespondentSubmissionModel(mongoose)

type ResponseModeFilterParam = {
  fieldType: BasicField
}

const MB_MULTIPLIER = 1000000

/**
 * Returns the file size limit in MB based on whether request is an email-mode submission
 * @param isEmailMode boolean flag of whether request is in email-mode
 * @returns 7 if email mode, 20 if not
 */
export const fileSizeLimit = (responseMode: FormResponseMode) => {
  switch (responseMode) {
    case FormResponseMode.Email:
      return 7
    case FormResponseMode.Encrypt:
    case FormResponseMode.Multirespondent:
      return 20
  }
}

export const checkFormIsEncryptModeOrMultirespondent = (
  form: IPopulatedForm,
): Result<
  IPopulatedEncryptedForm | IPopulatedMultirespondentForm,
  ResponseModeError
> => {
  return isFormEncryptModeOrMultirespondent(form)
    ? ok(form)
    : err(
        new ResponseModeError(
          [FormResponseMode.Encrypt, FormResponseMode.Multirespondent],
          form.responseMode,
        ),
      )
}

export const getEncryptedSubmissionModelByResponseMode = (
  responseMode: FormResponseMode,
): Result<
  IEncryptSubmissionModel | IMultirespondentSubmissionModel,
  ResponseModeError
> => {
  switch (responseMode) {
    case FormResponseMode.Encrypt:
      return ok(EncryptSubmissionModel)
    case FormResponseMode.Multirespondent:
      return ok(MultirespondentSubmissionModel)
    default:
      return err(
        new ResponseModeError(
          [FormResponseMode.Encrypt, FormResponseMode.Multirespondent],
          responseMode,
        ),
      )
  }
}

// TODO (FRM-1232): Refactor once encryption boundary has been shifted.
// Exported for testing.
export const getResponseModeFilter = (
  isEncrypted: boolean,
): (<T extends ResponseModeFilterParam>(responses: T[]) => T[]) => {
  if (isEncrypted) return encryptedResponseModeFilter
  else return clearResponseModeFilter
}

const clearResponseModeFilter = <T extends ResponseModeFilterParam>(
  responses: T[],
) => {
  return responses.filter(
    ({ fieldType }) => !FIELDS_TO_REJECT.includes(fieldType),
  )
}

// TODO (FRM-1232): Remove once encryption boundary has been shifted.
const encryptedResponseModeFilter = <T extends ResponseModeFilterParam>(
  responses: T[] = [],
) => {
  // To filter for autoreply-able fields.
  return responses.filter(({ fieldType }) =>
    [BasicField.Mobile, BasicField.Email].includes(fieldType),
  )
}

// TODO (FRM-1232): Remove once encryption boundary has been shifted.
const encryptedFormFieldModeFilter = <T extends FormField>(
  responses: T[] = [],
) => {
  // To filter for autoreply-able fields.
  return responses.filter((response) => {
    switch (response.fieldType) {
      case BasicField.Mobile:
        return response.isVerifiable
      case BasicField.Email:
        return response.autoReplyOptions.hasAutoReply || response.isVerifiable
      default:
        return false
    }
  })
}

// TODO (FRM-1232): Refactor once encryption boundary has been shifted.
// Exported for testing.
export const getFormFieldModeFilter = (
  isEncrypted: boolean,
): (<T extends FormField>(responses: T[]) => T[]) => {
  if (isEncrypted) return encryptedFormFieldModeFilter
  else return clearResponseModeFilter
}

/**
 * Extracts response data to be sent in email confirmations
 * @param responses Responses from form filler
 * @param formFields Fields from form object
 * @returns Array of data for email confirmations
 */
export const extractEmailConfirmationData = (
  responses: FieldResponse[],
  formFields: FormFieldSchema[] | undefined,
): AutoReplyMailData[] => {
  const fieldsById = keyBy(formFields, '_id')
  return responses.reduce<AutoReplyMailData[]>((acc, response) => {
    const field = fieldsById[response._id]
    if (
      field &&
      field.fieldType === BasicField.Email &&
      response.fieldType === BasicField.Email &&
      response.answer
    ) {
      const options = field.autoReplyOptions
      if (options.hasAutoReply) {
        acc.push({
          email: response.answer,
          subject: options.autoReplySubject,
          sender: options.autoReplySender,
          body: options.autoReplyMessage,
          includeFormSummary: options.includeFormSummary,
        })
      }
    }
    return acc
  }, [])
}

/**
 * Filter allowed form field responses from given responses and return the
 * array of responses with duplicates removed.
 *
 * @param form The form document
 * @param responses the responses that corresponds to the given form
 * @returns neverthrow ok() filtered list of allowed responses with duplicates (if any) removed
 * @returns neverthrow err(ConflictError) if the given form's form field ids count do not match given responses'
 */
export const getFilteredResponses = (
  form: IFormDocument,
  responses: FieldResponse[],
  isEncryptedMode: boolean,
): Result<FilteredResponse[], ConflictError> => {
  const responseModeFilter = getResponseModeFilter(isEncryptedMode)
  const formFieldModeFilter = getFormFieldModeFilter(isEncryptedMode)

  if (!form.form_fields) {
    return err(new ConflictError('Form fields are missing'))
  }
  // _id must be transformed to string as form response is jsonified.
  const fieldIds = formFieldModeFilter(form.form_fields).map((field) => ({
    _id: String(field._id),
  }))
  const uniqueResponses = uniqBy(responseModeFilter(responses), '_id')
  const results = intersectionBy(uniqueResponses, fieldIds, '_id')

  if (results.length < fieldIds.length) {
    const onlyInForm = differenceBy(fieldIds, results, '_id').map(
      ({ _id }) => _id,
    )

    return err(
      new ConflictError('Some form fields are missing', {
        formId: form._id,
        onlyInForm,
      }),
    )
  }
  return ok(results as FilteredResponse[])
}

export const getNormalisedResponseTime = (
  responseTimeMs: number,
  numVisibleFields: number,
) => {
  return (10 * responseTimeMs) / numVisibleFields
}

export const isAttachmentResponse = (
  response: ParsedClearFormFieldResponse,
): response is ParsedClearAttachmentResponse => {
  return (
    response.fieldType === BasicField.Attachment &&
    response.content !== undefined
  )
}

/**
 * Checks if a response is a quarantined attachment response to be processed by the virus scanner.
 */
export const isQuarantinedAttachmentResponse = (
  response: ParsedClearFormFieldResponse,
): response is ParsedClearAttachmentResponse => {
  return response.fieldType === BasicField.Attachment && response.answer !== ''
}

/**
 * Checks an array of attachments to see ensure that every
 * one of them is valid. The validity is determined by an
 * internal isInvalidFileExtension checker function, and
 * zip files are checked recursively.
 *
 * @param attachments - Array of file objects
 * @returns Whether all attachments are valid
 */
export const getInvalidFileExtensions = (
  attachments: IAttachmentInfo[],
): Promise<string[]> => {
  // Turn it into an array of promises that each resolve
  // to an array of file extensions that are invalid (if any)
  const promises = attachments.map((attachment) => {
    const extension = FileValidation.getFileExtension(attachment.filename)
    if (FileValidation.isInvalidFileExtension(extension)) {
      return Promise.resolve([extension])
    }
    if (extension !== '.zip') return Promise.resolve([])
    return FileValidation.getInvalidFileExtensionsInZip(
      'nodebuffer',
      attachment.content,
    )
  })

  return Promise.all(promises).then((results) => flattenDeep(results))
}

export const fileSizeLimitBytes = (responseMode: FormResponseMode) => {
  return MB_MULTIPLIER * fileSizeLimit(responseMode)
}

/**
 * Checks whether the total size of attachments exceeds 7MB
 * @param attachments List of attachments
 * @returns true if total attachment size exceeds 7MB
 */
export const areAttachmentsMoreThanLimit = (
  attachments: IAttachmentInfo[],
  responseMode: FormResponseMode,
): boolean => {
  // Check if total attachments size is < 7mb
  const totalAttachmentSize = sumBy(attachments, (a) => a.content.byteLength)
  return totalAttachmentSize > fileSizeLimitBytes(responseMode)
}

/**
 * Extracts attachment fields from form responses
 * @param responses Form responses
 */
export const mapAttachmentsFromResponses = (
  responses: ParsedClearFormFieldResponse[],
): IAttachmentInfo[] => {
  // look for attachments in parsedResponses
  // Could be undefined if it is not required, or hidden
  return responses.filter(isAttachmentResponse).map((response) => ({
    fieldId: response._id,
    filename: response.filename,
    content: response.content,
  }))
}

/**
 * Determines the prefix for a question based on whether it is verified
 * by MyInfo.
 * @param response
 * @param hashedFields Field ids of hashed fields.
 * @returns the prefix
 */
export const getMyInfoPrefix = (
  response: ResponseFormattedForEmail | ProcessedFieldResponse,
  hashedFields: Set<MyInfoKey>,
): string => {
  return !!response.myInfo?.attr && hashedFields.has(response._id)
    ? MYINFO_PREFIX
    : ''
}

/**
 * Expands child subfields into individual fields, so that they are no longer nested under
 * 1 parent field.
 * @param response
 * @returns
 */
export const getAnswersForChild = (
  response: ProcessedChildrenResponse,
): ProcessedSingleAnswerResponse[] => {
  const subFields = response.childSubFieldsArray
  const qnChildIdx = response.childIdx ?? 0
  if (!subFields) {
    return []
  }
  return response.answerArray.flatMap((arr, childIdx) => {
    // First array element is always child name
    const childName = arr[0]
    return arr.map((answer, idx) => {
      const subfield = subFields[idx]
      return {
        _id: getMyInfoChildHashKey(
          response._id,
          subFields[idx],
          childIdx,
          childName,
        ),
        fieldType: response.fieldType,
        // qnChildIdx represents the index of the MyInfo field
        // childIdx represents the index of the child in this MyInfo field
        // as there might be >1 child for each MyInfo child field if "Add another child" is used
        question: `Child ${qnChildIdx + childIdx + 1} ${
          MYINFO_ATTRIBUTE_MAP[subfield].description
        }`,
        myInfo: {
          attr: subFields[idx] as unknown as MyInfoAttribute,
        },
        isVisible: response.isVisible,
        isUserVerified: response.isUserVerified,
        answer,
      }
    })
  })
}
