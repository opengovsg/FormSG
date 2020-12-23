import { StatusCodes } from 'http-status-codes'
import { flattenDeep, sumBy } from 'lodash'

import { createLoggerWithLabel } from '../../../../config/logger'
import { FilePlatforms } from '../../../../shared/constants'
import * as FileValidation from '../../../../shared/util/file-validation'
import {
  BasicField,
  EmailAutoReplyField,
  EmailDataForOneField,
  EmailFormField,
  EmailJsonField,
  FieldResponse,
  IAttachmentInfo,
  IAttachmentResponse,
  IPopulatedEmailForm,
  IPopulatedForm,
  MapRouteError,
  ResponseMode,
} from '../../../../types'
import {
  CaptchaConnectionError,
  MissingCaptchaError,
  VerifyCaptchaError,
} from '../../../services/captcha/captcha.errors'
import {
  HashDidNotMatchError,
  HashingError,
  MissingHashError,
} from '../../../services/myinfo/myinfo.errors'
import { DatabaseError, MissingFeatureError } from '../../core/core.errors'
import {
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from '../../form/form.errors'
import {
  InvalidJwtError,
  MissingJwtError,
  VerifyJwtError,
} from '../../spcp/spcp.errors'
import {
  ConflictError,
  ProcessingError,
  ResponseModeError,
  SendAdminEmailError,
  ValidateFieldError,
} from '../submission.errors'
import {
  ProcessedCheckboxResponse,
  ProcessedTableResponse,
} from '../submission.types'

import {
  ATTACHMENT_PREFIX,
  MYINFO_PREFIX,
  TABLE_PREFIX,
  VERIFIED_PREFIX,
} from './email-submission.constants'
import {
  AttachmentTooLargeError,
  ConcatSubmissionError,
  InitialiseMultipartReceiverError,
  InvalidFileExtensionError,
  MultipartError,
  SubmissionHashError,
} from './email-submission.errors'
import { ResponseFormattedForEmail } from './email-submission.types'

const logger = createLoggerWithLabel(module)

/**
 * Determines the prefix for a question based on whether it is verified
 * by MyInfo.
 * @param response
 * @param hashedFields Hash for verifying MyInfo fields
 * @returns the prefix
 */
const getMyInfoPrefix = (
  response: ResponseFormattedForEmail,
  hashedFields: Set<string>,
): string => {
  return !!response.myInfo?.attr && hashedFields.has(response._id)
    ? MYINFO_PREFIX
    : ''
}

/**
 * Determines the prefix for a question based on whether it was verified
 * by a user during form submission.
 * @param response
 * @returns the prefix
 */
const getVerifiedPrefix = (response: ResponseFormattedForEmail): string => {
  return response.isUserVerified ? VERIFIED_PREFIX : ''
}

/**
 * Determines the prefix for a question based on its field type.
 * @param fieldType
 * @returns the prefix
 */
const getFieldTypePrefix = (response: ResponseFormattedForEmail): string => {
  switch (response.fieldType) {
    case BasicField.Table:
      return TABLE_PREFIX
    case BasicField.Attachment:
      return ATTACHMENT_PREFIX
    default:
      return ''
  }
}

/**
 * Transforms a question for inclusion in the JSON data used by the
 * data collation tool.
 * @param response
 * @returns the prefixed question for this response
 */
export const getJsonPrefixedQuestion = (
  response: ResponseFormattedForEmail,
): string => {
  const questionComponents = [getFieldTypePrefix(response), response.question]
  return questionComponents.join('')
}

/**
 * Transforms a question for inclusion in the admin email table.
 * @param response
 * @param hashedFields
 * @returns the joined prefixes for the question in the given response
 */
export const getFormDataPrefixedQuestion = (
  response: ResponseFormattedForEmail,
  hashedFields: Set<string>,
): string => {
  const questionComponents = [
    getFieldTypePrefix(response),
    getMyInfoPrefix(response, hashedFields),
    getVerifiedPrefix(response),
    response.question,
  ]
  return questionComponents.join('')
}

/**
 * Creates one response for every row of the table using the answerArray
 * @param response
 * @param response.answerArray an array of array<string> for each row of the table
 * @returns array of duplicated response for each answer in the answerArray
 */
export const getAnswerRowsForTable = (
  response: ProcessedTableResponse,
): ResponseFormattedForEmail[] => {
  return response.answerArray.map((rowResponse) => ({
    _id: response._id,
    fieldType: response.fieldType,
    question: response.question,
    myInfo: response.myInfo,
    isVisible: response.isVisible,
    isUserVerified: response.isUserVerified,
    answer: String(rowResponse),
  }))
}

/**
 * Creates a response for checkbox, with its answer formatted from the answerArray
 * @param response
 * @param response.answerArray an array of strings for each checked option
 * @returns the response with formatted answer
 */
export const getAnswerForCheckbox = (
  response: ProcessedCheckboxResponse,
): ResponseFormattedForEmail => {
  return {
    _id: response._id,
    fieldType: response.fieldType,
    question: response.question,
    myInfo: response.myInfo,
    isVisible: response.isVisible,
    isUserVerified: response.isUserVerified,
    answer: response.answerArray.join(', '),
  }
}

/**
 *  Formats the response for sending to the submitter (autoReplyData),
 *  the table that is sent to the admin (formData),
 *  and the json used by data collation tool (jsonData).
 *
 * @param response
 * @param hashedFields Field IDs hashed to verify answers provided by MyInfo
 * @returns an object containing three sets of formatted responses
 */
export const getFormattedResponse = (
  response: ResponseFormattedForEmail,
  hashedFields: Set<string>,
): EmailDataForOneField => {
  const { question, answer, fieldType, isVisible } = response
  const answerSplitByNewLine = answer.split('\n')

  let autoReplyData: EmailAutoReplyField | undefined
  let jsonData: EmailJsonField | undefined
  // Auto reply email will contain only visible fields
  if (isVisible) {
    autoReplyData = {
      question, // No prefixes for autoreply
      answerTemplate: answerSplitByNewLine,
    }
  }

  // Headers are excluded from JSON data
  if (fieldType !== BasicField.Section) {
    jsonData = {
      question: getJsonPrefixedQuestion(response),
      answer,
    }
  }

  // Send all the fields to admin
  const formData = {
    question: getFormDataPrefixedQuestion(response, hashedFields),
    answerTemplate: answerSplitByNewLine,
    answer,
    fieldType,
  }
  return {
    autoReplyData,
    jsonData,
    formData,
  }
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
  const getInvalidFileExtensionsInZip = FileValidation.getInvalidFileExtensionsInZip(
    FilePlatforms.Server,
  )
  const promises = attachments.map((attachment) => {
    const extension = FileValidation.getFileExtension(attachment.filename)
    if (FileValidation.isInvalidFileExtension(extension)) {
      return Promise.resolve([extension])
    }
    if (extension !== '.zip') return Promise.resolve([])
    return getInvalidFileExtensionsInZip(attachment.content)
  })

  return Promise.all(promises).then((results) => flattenDeep(results))
}

/**
 * Checks whether the total size of attachments exceeds 7MB
 * @param attachments List of attachments
 * @returns true if total attachment size exceeds 7MB
 */
export const areAttachmentsMoreThan7MB = (
  attachments: IAttachmentInfo[],
): boolean => {
  // Check if total attachments size is < 7mb
  const totalAttachmentSize = sumBy(attachments, (a) => a.content.byteLength)
  return totalAttachmentSize > 7000000
}

const isAttachmentResponse = (
  response: FieldResponse,
): response is IAttachmentResponse => {
  return (
    response.fieldType === BasicField.Attachment &&
    (response as IAttachmentResponse).content !== undefined
  )
}

/**
 * Extracts attachment fields from form responses
 * @param responses Form responses
 */
export const mapAttachmentsFromResponses = (
  responses: FieldResponse[],
): IAttachmentInfo[] => {
  // look for attachments in parsedResponses
  // Could be undefined if it is not required, or hidden
  return responses.filter(isAttachmentResponse).map((response) => ({
    fieldId: response._id,
    filename: response.filename,
    content: response.content,
  }))
}

export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case InitialiseMultipartReceiverError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Required headers are missing',
      }
    case MultipartError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: 'Submission could not be parsed.',
      }
    case InvalidFileExtensionError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Some files were invalid. Try uploading another file.',
      }
    case AttachmentTooLargeError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Please keep the size of your attachments under 7MB.',
      }
    case ConflictError:
      return {
        statusCode: StatusCodes.CONFLICT,
        errorMessage:
          'The form has been updated. Please refresh and submit again.',
      }
    case ProcessingError:
    case ValidateFieldError:
    case ConcatSubmissionError:
    case ResponseModeError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
      }
    case DatabaseError:
    case SubmissionHashError:
    case MissingFeatureError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage:
          'Could not send submission. For assistance, please contact the person who asked you to fill in this form.',
      }
    case SendAdminEmailError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Could not send submission. For assistance, please contact the person who asked you to fill in this form.',
      }
    case FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: "Oops! We can't find the form you're looking for.",
      }
    case PrivateFormError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage:
          'This form has been taken down. For assistance, please contact the person who asked you to fill in this form.',
      }
    case FormDeletedError:
      return {
        statusCode: StatusCodes.GONE,
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
    case MissingJwtError:
    case VerifyJwtError:
    case InvalidJwtError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage:
          'Something went wrong with your login. Please try logging in and submitting again.',
      }
    case MissingHashError:
      return {
        statusCode: StatusCodes.GONE,
        errorMessage:
          'MyInfo verification expired, please refresh and try again.',
      }
    case HashDidNotMatchError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage: 'MyInfo verification failed.',
      }
    case HashingError:
      return {
        statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        errorMessage:
          'MyInfo verification unavailable, please try again later.',
      }
    default:
      logger.error({
        message: 'mapRouteError called with unknown error type',
        meta: {
          action: 'mapRouteError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Something went wrong. Please refresh and try again.',
      }
  }
}

/**
 * Checks whether attachmentMap contains the given response
 * @param attachmentMap Map of field IDs to attachments
 * @param response The response to check
 * @returns true if response is in map, false otherwise
 */
const isAttachmentResponseFromMap = (
  attachmentMap: Record<IAttachmentInfo['fieldId'], IAttachmentInfo>,
  response: FieldResponse,
): response is IAttachmentResponse => {
  return !!attachmentMap[response._id]
}

/**
 * Adds the attachment's content, filename to each response,
 * based on their fieldId.
 * The response's answer is also changed to the attachment's filename.
 *
 * @param responses - Array of responses received
 * @param attachments - Array of file objects
 * @returns void. Modifies responses in place.
 */
export const addAttachmentToResponses = (
  responses: FieldResponse[],
  attachments: IAttachmentInfo[],
): void => {
  // Create a map of the attachments with fieldId as keys
  const attachmentMap: Record<
    IAttachmentInfo['fieldId'],
    IAttachmentInfo
  > = attachments.reduce<Record<string, IAttachmentInfo>>((acc, attachment) => {
    acc[attachment.fieldId] = attachment
    return acc
  }, {})

  if (responses) {
    // matches responses to attachments using id, adding filename and content to response
    responses.forEach((response) => {
      if (isAttachmentResponseFromMap(attachmentMap, response)) {
        const file = attachmentMap[response._id]
        response.answer = file.filename
        response.filename = file.filename
        response.content = file.content
      }
    })
  }
}

/**
 * Looks for duplicated filenames and changes the filename
 * to for example 1-abc.txt, 2-abc.txt.
 * One of the duplicated files will not have its name changed.
 * Two abc.txt will become 1-abc.txt and abc.txt
 * @param attachments - Array of file objects
 * @returns void. Modifies array in-place.
 */
export const handleDuplicatesInAttachments = (
  attachments: IAttachmentInfo[],
): void => {
  const names = new Map()

  // fill up the map, the key: filename and value: count
  attachments.forEach((a) => {
    if (names.get(a.filename)) {
      names.set(a.filename, names.get(a.filename) + 1)
    } else {
      names.set(a.filename, 1)
    }
  })

  // Change names of duplicates
  attachments.forEach((a) => {
    if (names.get(a.filename) > 1) {
      const count = names.get(a.filename) - 1
      names.set(a.filename, count)
      a.filename = `${count}-${a.filename}`
    }
  })
}

/**
 * Concatenate response into a string for hashing
 * @param formData Field-value tuples for admin email
 * @param attachments Array of attachments as buffers
 * @returns concatenated response to hash
 */
export const concatAttachmentsAndResponses = (
  formData: EmailFormField[],
  attachments: IAttachmentInfo[],
): string => {
  let response = ''
  response += formData.reduce((acc, fieldData) => {
    const question = fieldData.question.toString().trim()
    const answer = fieldData.answer.toString().trim()
    return acc + `${question} ${answer}; `
  }, '')
  response += attachments.reduce((acc, { content }) => acc + content, '')
  return response
}

/**
 * Type guard for whether a populated form is email mode
 * @param form Form document to check
 */
export const isEmailModeForm = (
  form: IPopulatedForm,
): form is IPopulatedEmailForm => {
  return form.responseMode === ResponseMode.Email
}
