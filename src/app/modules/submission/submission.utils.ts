import { encode as encodeBase64 } from '@stablelib/base64'
import crypto from 'crypto'
import StatusCodes from 'http-status-codes'
import {
  chain,
  differenceBy,
  flattenDeep,
  intersectionBy,
  keyBy,
  omit,
  sumBy,
  uniqBy,
} from 'lodash'
import mongoose from 'mongoose'
import { err, ok, Result } from 'neverthrow'

import { MULTIRESPONDENT_FORM_SUBMISSION_VERSION } from '../../../../shared/constants'
import { FIELDS_TO_REJECT } from '../../../../shared/constants/field/basic'
import { MYINFO_ATTRIBUTE_MAP } from '../../../../shared/constants/field/myinfo'
import {
  BasicField,
  FormAuthType,
  FormField,
  FormResponseMode,
  MyInfoAttribute,
  SubmissionAttachment,
  SubmissionAttachmentsMap,
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
  MapRouteErrors,
} from '../../../types'
import {
  ParsedClearAttachmentResponse,
  ParsedClearAttachmentResponseV3,
  ParsedClearFormFieldResponse,
  ParsedClearFormFieldResponseV3,
} from '../../../types/api'
import { MapRouteError } from '../../../types/routing'
import formsgSdk from '../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../config/logger'
import {
  getEncryptSubmissionModel,
  getMultirespondentSubmissionModel,
} from '../../models/submission.server.model'
import { MalformedVerifiedContentError } from '../../modules/verified-content/verified-content.errors'
import {
  CaptchaConnectionError,
  MissingCaptchaError,
  VerifyCaptchaError,
} from '../../services/captcha/captcha.errors'
import { AutoReplyMailData } from '../../services/mail/mail.types'
import {
  MissingTurnstileError,
  TurnstileConnectionError,
  VerifyTurnstileError,
} from '../../services/turnstile/turnstile.errors'
import { CreatePresignedPostError } from '../../utils/aws-s3'
import { genericMapRouteErrorTransform } from '../../utils/error'
import {
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
  EmptyErrorFieldError,
  MalformedParametersError,
} from '../core/core.errors'
import {
  ForbiddenFormError,
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from '../form/form.errors'
import { isFormEncryptModeOrMultirespondent } from '../form/form.utils'
import { MYINFO_LOGIN_COOKIE_NAME } from '../myinfo/myinfo.constants'
import {
  MyInfoCookieStateError,
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoInvalidLoginCookieError,
  MyInfoMissingHashError,
  MyInfoMissingLoginCookieError,
} from '../myinfo/myinfo.errors'
import { MyInfoKey } from '../myinfo/myinfo.types'
import {
  InvalidPaymentProductsError,
  PaymentNotFoundError,
} from '../payments/payments.errors'
import {
  SGID_COOKIE_NAME,
  SGID_MYINFO_LOGIN_COOKIE_NAME,
} from '../sgid/sgid.constants'
import {
  SgidInvalidJwtError,
  SgidMissingJwtError,
  SgidVerifyJwtError,
} from '../sgid/sgid.errors'
import {
  CreateRedirectUrlError,
  InvalidJwtError,
  MissingJwtError,
  VerifyJwtError,
} from '../spcp/spcp.errors'
import { JwtName } from '../spcp/spcp.types'
import { MissingUserError } from '../user/user.errors'

import { MYINFO_PREFIX } from './email-submission/email-submission.constants'
import { ResponseFormattedForEmail } from './email-submission/email-submission.types'
import {
  AttachmentSizeLimitExceededError,
  AttachmentTooLargeError,
  AttachmentUploadError,
  ConflictError,
  DownloadCleanFileFailedError,
  FeatureDisabledError,
  InvalidEncodingError,
  InvalidFieldIdError,
  InvalidFileExtensionError,
  InvalidFileKeyError,
  MaliciousFileDetectedError,
  ProcessingError,
  ResponseModeError,
  SubmissionFailedError,
  SubmissionNotFoundError,
  SubmissionSaveError,
  UnsupportedSettingsError,
  ValidateFieldError,
  ValidateFieldErrorV3,
  VirusScanFailedError,
} from './submission.errors'
import {
  FilteredResponse,
  ProcessedChildrenResponse,
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
} from './submission.types'

const logger = createLoggerWithLabel(module)

const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)
const MultirespondentSubmissionModel =
  getMultirespondentSubmissionModel(mongoose)

type ResponseModeFilterParam = {
  fieldType: BasicField
}

const MB_MULTIPLIER = 1000000

/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages.
 * @param error The error to retrieve the status codes and error messages
 */
const errorMapper: MapRouteError = (
  error,
  coreErrorMessage = 'Sorry, something went wrong. Please try again.',
) => {
  switch (error.constructor) {
    case AttachmentUploadError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Could not upload attachments for submission. For assistance, please contact the person who asked you to fill in this form.',
      }
    case SubmissionSaveError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: error.message,
      }
    case CreateRedirectUrlError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
    case SgidMissingJwtError:
    case SgidVerifyJwtError:
    case SgidInvalidJwtError:
    case MissingJwtError:
    case VerifyJwtError:
    case InvalidJwtError:
    case MyInfoMissingLoginCookieError:
    case MyInfoCookieStateError:
    case MyInfoInvalidLoginCookieError:
    case MalformedVerifiedContentError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage:
          'Something went wrong with your login. Please try logging in and submitting again.',
      }
    case MyInfoMissingHashError:
      return {
        statusCode: StatusCodes.GONE,
        errorMessage:
          'MyInfo verification expired, please refresh and try again.',
      }
    case MyInfoHashDidNotMatchError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage: 'MyInfo verification failed.',
      }
    case MyInfoHashingError:
      return {
        statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        errorMessage:
          'MyInfo verification unavailable, please try again later.',
      }
    case MissingUserError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: error.message,
      }
    case FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case ResponseModeError:
    case InvalidPaymentProductsError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
    case FeatureDisabledError:
    case ForbiddenFormError:
      return {
        statusCode: StatusCodes.FORBIDDEN,
        errorMessage: error.message,
      }
    case FormDeletedError:
      return {
        statusCode: StatusCodes.GONE,
        errorMessage: error.message,
      }
    case PrivateFormError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage:
          'This form has been taken down. For assistance, please contact the person who asked you to fill in this form.',
      }
    case CaptchaConnectionError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Could not verify captcha. Please submit again in a few minutes.',
      }
    case VerifyCaptchaError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Captcha was incorrect. Please submit again.',
      }
    case MissingCaptchaError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Captcha was missing. Please refresh and submit again.',
      }
    case TurnstileConnectionError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage:
          'Error connecting to Turnstile server . Please submit again in a few minutes.',
      }
    case VerifyTurnstileError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Incorrect Turnstile parameters. Please refresh and submit again.',
      }
    case MissingTurnstileError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Missing Turnstile challenge. Please refresh and submit again.',
      }
    case MalformedParametersError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
    case UnsupportedSettingsError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
    case SubmissionNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case InvalidEncodingError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Invalid data was found. Please check your responses and submit again.',
      }
    case DatabasePayloadSizeError:
      return {
        statusCode: StatusCodes.REQUEST_TOO_LONG,
        errorMessage:
          'Submission too large to be saved. Please reduce the size of your submission and try again.',
      }
    case ValidateFieldError:
    case ValidateFieldErrorV3:
    case DatabaseValidationError:
    case InvalidFileExtensionError:
    case AttachmentTooLargeError:
    case ProcessingError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
      }
    case DatabaseConflictError:
    case ConflictError:
      return {
        statusCode: StatusCodes.CONFLICT,
        errorMessage:
          'The form has been updated. Please refresh and submit again.',
      }
    case PaymentNotFoundError:
    case CreatePresignedPostError:
    case DatabaseError:
    case EmptyErrorFieldError:
    case VirusScanFailedError:
    case DownloadCleanFileFailedError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: error.message,
      }
    case SubmissionFailedError:
    case InvalidFieldIdError:
    case AttachmentSizeLimitExceededError:
    case InvalidFileKeyError:
    case MaliciousFileDetectedError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
    default:
      logger.error({
        message: 'Unknown route error observed',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })

      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Something went wrong. Please try again.',
      }
  }
}

export const mapRouteError: MapRouteErrors =
  genericMapRouteErrorTransform(errorMapper)

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
 * Checks if a response is a quarantined attachment response to be processed by the virus scanner.
 */
export const isQuarantinedAttachmentResponseV3 = (
  response: ParsedClearFormFieldResponseV3,
): response is ParsedClearAttachmentResponseV3 => {
  return (
    response.fieldType === BasicField.Attachment &&
    response.answer.answer !== ''
  )
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
    const { filename } = attachment
    // Special case where we found instances where the filename was not a string
    // See https://www.notion.so/opengov/TypeError-Cannot-read-properties-of-undefined-reading-split-in-file-validation-js-6f4dcc17e6fc48319d8f7f0f997685c2?pvs=4
    // We can remove this handling when the issue is found and fixed
    if (filename == null) {
      logger.error({
        message: 'A string is expected, but received null or undefined',
        meta: {
          action: 'getInvalidFileExtensions',
          filename,
        },
      })
      return Promise.reject(new Error('filename is required'))
    }
    const extension = FileValidation.getFileExtension(filename)
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

const encryptAttachment = async (
  attachment: Buffer,
  { id, publicKey }: { id: string; publicKey: string },
  version: number,
): Promise<SubmissionAttachment & { id: string }> => {
  let label

  try {
    label = 'Read file content'

    const fileContentsView = new Uint8Array(attachment)

    label = 'Encrypt content'
    const formsgSdkCrypto =
      version < MULTIRESPONDENT_FORM_SUBMISSION_VERSION
        ? formsgSdk.crypto
        : formsgSdk.cryptoV3
    const encryptedAttachment = await formsgSdkCrypto.encryptFile(
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
    logger.error({
      message: 'Error encrypting attachment',
      meta: {
        action: 'encryptAttachment',
        label,
        error,
      },
    })
    throw error
  }
}

export const getEncryptedAttachmentsMapFromAttachmentsMap = async (
  attachmentsMap: Record<string, Buffer>,
  publicKey: string,
  version: number,
): Promise<SubmissionAttachmentsMap> => {
  const attachmentPromises = Object.entries(attachmentsMap).map(
    ([id, attachment]) =>
      encryptAttachment(attachment, { id, publicKey }, version),
  )

  return Promise.all(attachmentPromises).then((encryptedAttachmentsMeta) =>
    chain(encryptedAttachmentsMeta)
      .keyBy('id')
      // Remove id from object.
      .mapValues((v) => omit(v, 'id'))
      .value(),
  )
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
    return arr.map((answer, idx) => {
      const subfield = subFields[idx]
      return {
        // Recreates the individual _id of the child field based on the parent field's _id and the subfield
        // e.g., childrenbirthrecords.67585515e1ced6d790a91e14.childname.0
        _id: `${MyInfoAttribute.ChildrenBirthRecords}.${response._id}.${subFields[idx]}.${childIdx}`,
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

/**
 * Generates a hash to mask the original submitterId.
 * @param id
 * @returns
 */

export const generateHashedSubmitterId = (id: string, salt: string) => {
  return crypto
    .createHash('sha256')
    .update(id + salt)
    .digest('hex')
}

/**
 * Returns the cookie name based on auth type
 * Valid AuthTypes are SP / CP / MyInfo / SGID
 */
export const getCookieNameByAuthType = (
  authType:
    | FormAuthType.SP
    | FormAuthType.CP
    | FormAuthType.MyInfo
    | FormAuthType.SGID
    | FormAuthType.SGID_MyInfo,
): string => {
  switch (authType) {
    case FormAuthType.SGID_MyInfo:
      return SGID_MYINFO_LOGIN_COOKIE_NAME
    case FormAuthType.MyInfo:
      return MYINFO_LOGIN_COOKIE_NAME
    case FormAuthType.SGID:
      return SGID_COOKIE_NAME
    default:
      return JwtName[authType]
  }
}
