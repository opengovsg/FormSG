import { StatusCodes } from 'http-status-codes'
import { compact } from 'lodash'

import { BasicField, FormAuthType } from '../../../../../shared/types'
import {
  EmailAdminDataField,
  EmailDataCollationToolField,
  EmailDataFields,
  EmailDataForOneField,
  EmailRespondentConfirmationField,
  IAttachmentInfo,
  MapRouteError,
  SPCPFieldTitle,
} from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'
import {
  CaptchaConnectionError,
  MissingCaptchaError,
  VerifyCaptchaError,
} from '../../../services/captcha/captcha.errors'
import {
  MailGenerationError,
  MailSendError,
} from '../../../services/mail/mail.errors'
import {
  MissingTurnstileError,
  TurnstileConnectionError,
  VerifyTurnstileError,
} from '../../../services/turnstile/turnstile.errors'
import {
  isProcessedCheckboxResponse,
  isProcessedChildResponse,
  isProcessedTableResponse,
} from '../../../utils/field-validation/field-validation.guards'
import {
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
} from '../../core/core.errors'
import {
  ForbiddenFormError,
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from '../../form/form.errors'
import {
  MyInfoCookieStateError,
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoInvalidLoginCookieError,
  MyInfoMissingHashError,
  MyInfoMissingLoginCookieError,
} from '../../myinfo/myinfo.errors'
import { MyInfoKey } from '../../myinfo/myinfo.types'
import {
  SgidInvalidJwtError,
  SgidMissingJwtError,
  SgidVerifyJwtError,
} from '../../sgid/sgid.errors'
import {
  InvalidJwtError,
  MissingJwtError,
  VerifyJwtError,
} from '../../spcp/spcp.errors'
import { MissingUserError } from '../../user/user.errors'
import {
  AttachmentTooLargeError,
  ConflictError,
  InvalidFileExtensionError,
  ProcessingError,
  ResponseModeError,
  ValidateFieldError,
} from '../submission.errors'
import {
  ProcessedCheckboxResponse,
  ProcessedFieldResponse,
  ProcessedTableResponse,
} from '../submission.types'
import { getAnswersForChild, getMyInfoPrefix } from '../submission.utils'

import {
  ATTACHMENT_PREFIX,
  TABLE_PREFIX,
  VERIFIED_PREFIX,
} from './email-submission.constants'
import { SubmissionHashError } from './email-submission.errors'
import { ResponseFormattedForEmail } from './email-submission.types'

const logger = createLoggerWithLabel(module)

/**
 * Determines the prefix for a question based on whether it was verified
 * by a user during form submission.
 *
 * Verified prefixes are not added for optional fields that are left blank.
 * @param response
 * @returns the prefix
 */
const getVerifiedPrefix = (response: ResponseFormattedForEmail): string => {
  const { answer, isUserVerified } = response
  const isAnswerBlank = answer === ''
  return isUserVerified && !isAnswerBlank ? VERIFIED_PREFIX : ''
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
 *  and the json used by data collation tool (dataCollationData).
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

  let autoReplyData: EmailRespondentConfirmationField | undefined
  let dataCollationData: EmailDataCollationToolField | undefined
  // Auto reply email will contain only visible fields
  if (isVisible) {
    autoReplyData = {
      question, // No prefixes for autoreply
      answerTemplate: answerSplitByNewLine,
    }
  }

  // Headers are excluded from JSON data
  if (fieldType !== BasicField.Section) {
    dataCollationData = {
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
    dataCollationData,
    formData,
  }
}

export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case DatabasePayloadSizeError:
      return {
        statusCode: StatusCodes.REQUEST_TOO_LONG,
        errorMessage:
          'Submission too large to be saved. Please reduce the size of your submission and try again.',
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
    case DatabaseConflictError:
    case ConflictError:
      return {
        statusCode: StatusCodes.CONFLICT,
        errorMessage:
          'The form has been updated. Please refresh and submit again.',
      }
    case ProcessingError:
    case ValidateFieldError:
    case ResponseModeError:
    case DatabaseValidationError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
      }
    case DatabaseError:
    case SubmissionHashError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage:
          'Could not send submission. For assistance, please contact the person who asked you to fill in this form.',
      }
    case MailGenerationError:
    case MailSendError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Could not send submission. For assistance, please contact the person who asked you to fill in this form.',
      }
    case MissingUserError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: 'You must be logged in to perform this action.',
      }
    case ForbiddenFormError:
      return {
        statusCode: StatusCodes.FORBIDDEN,
        errorMessage: 'You do not have permission to perform this action.',
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
    case SgidMissingJwtError:
    case SgidVerifyJwtError:
    case SgidInvalidJwtError:
    case MissingJwtError:
    case VerifyJwtError:
    case InvalidJwtError:
    case MyInfoMissingLoginCookieError:
    case MyInfoCookieStateError:
    case MyInfoInvalidLoginCookieError:
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
 * Concatenate response into a string for hashing
 * @param formData Field-value tuples for admin email
 * @param attachments Array of attachments as buffers
 * @returns concatenated response to hash
 */
export const concatAttachmentsAndResponses = (
  formData: EmailAdminDataField[],
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
 * Applies a formatting function to generate email data for a single field
 * @param response
 * @param hashedFields Used if formatting function is getFormFormattedResponse to provide
 * [verified] field to admin
 * @param getFormattedFunction The formatting function to use
 * @returns EmailRespondentConfirmationField[], EmailDataCollationToolField[] or
 * EmailAdminDataField[] depending on which formatting function is used
 */
const createFormattedDataForOneField = <T extends EmailDataFields | undefined>(
  response: ProcessedFieldResponse,
  hashedFields: Set<MyInfoKey>,
  getFormattedFunction: (
    response: ResponseFormattedForEmail,
    hashedFields: Set<MyInfoKey>,
  ) => T,
): T[] => {
  if (isProcessedTableResponse(response)) {
    return getAnswerRowsForTable(response).map((row) =>
      getFormattedFunction(row, hashedFields),
    )
  } else if (isProcessedCheckboxResponse(response)) {
    const checkbox = getAnswerForCheckbox(response)
    return [getFormattedFunction(checkbox, hashedFields)]
  } else if (isProcessedChildResponse(response)) {
    return getAnswersForChild(response).map((childField) =>
      getFormattedFunction(childField, hashedFields),
    )
  } else {
    return [getFormattedFunction(response, hashedFields)]
  }
}

/**
 * Helper function to mask the front of a string
 * Used to mask NRICs in Corppass Validated UID
 * @param field The string to be masked
 * @param charsToReveal The number of characters at the tail to reveal
 */
const maskStringHead = (field: string, charsToReveal = 4): string => {
  // Defensive, in case a negative number is passed in
  // the entire string is masked
  if (charsToReveal < 0) return '*'.repeat(field.length)

  return field.length >= charsToReveal
    ? '*'.repeat(field.length - charsToReveal) + field.substr(-charsToReveal)
    : field
}

/**
 * Helper function that masks the UID on the last
 * field of autoReplyData using maskStringHead function
 */
const maskUidOnLastField = (
  autoReplyData: EmailRespondentConfirmationField[],
): EmailRespondentConfirmationField[] => {
  // Mask corppass UID and show only last 4 chars in autoreply to form filler
  // This does not affect response email to form admin
  // Function assumes corppass UID is last in the autoReplyData array
  // TODO(#1104): Refactor to move validation and construction of parsedResponses in class constructor
  // This will allow for proper tagging of corppass UID field instead of checking field title and position

  return autoReplyData.map(
    (autoReplyField: EmailRespondentConfirmationField, index) => {
      if (
        autoReplyField.question === SPCPFieldTitle.CpUid && // Check field title
        index === autoReplyData.length - 1 // Check field position
      ) {
        const maskedAnswerTemplate = autoReplyField.answerTemplate.map(
          (answer) => maskStringHead(answer, 4),
        )
        return {
          question: autoReplyField.question,
          answerTemplate: maskedAnswerTemplate,
        }
      } else {
        return autoReplyField
      }
    },
  )
}

/**
 * Function to extract information for email json field from response
 * Json field is used for data collation tool
 */
const getDataCollationFormattedResponse = (
  response: ResponseFormattedForEmail,
): EmailDataCollationToolField | undefined => {
  const { answer, fieldType } = response
  // Headers are excluded from JSON data
  if (fieldType !== BasicField.Section) {
    return {
      question: getJsonPrefixedQuestion(response),
      answer,
    }
  }
  return undefined
}

/**
 * Function to extract information for email form field from response
 * Form field is used to send responses to admin
 */
const getFormFormattedResponse = (
  response: ResponseFormattedForEmail,
  hashedFields: Set<MyInfoKey>,
): EmailAdminDataField => {
  const { answer, fieldType } = response
  const answerSplitByNewLine = answer.split('\n')
  return {
    question: getFormDataPrefixedQuestion(response, hashedFields),
    answerTemplate: answerSplitByNewLine,
    answer,
    fieldType,
  }
}

/**
 * Function to extract information for email autoreply field from response
 * Autoreply field is used to send confirmation emails
 */
const getAutoReplyFormattedResponse = (
  response: ResponseFormattedForEmail,
): EmailRespondentConfirmationField | undefined => {
  const { question, answer, isVisible } = response
  const answerSplitByNewLine = answer.split('\n')
  // Auto reply email will contain only visible fields
  if (isVisible !== false) {
    return {
      question, // No prefixes for autoreply
      answerTemplate: answerSplitByNewLine,
    }
  }
  return undefined
}

export class SubmissionEmailObj {
  parsedResponses: ProcessedFieldResponse[]
  hashedFields: Set<MyInfoKey>
  authType: FormAuthType

  constructor(
    parsedResponses: ProcessedFieldResponse[],
    hashedFields: Set<MyInfoKey> = new Set<MyInfoKey>(),
    authType: FormAuthType,
  ) {
    this.parsedResponses = parsedResponses
    this.hashedFields = hashedFields
    this.authType = authType
  }

  /**
   * Getter function to return dataCollationData which is used for data collation tool
   */
  get dataCollationData(): EmailDataCollationToolField[] {
    const dataCollationFormattedData = this.parsedResponses.flatMap(
      (response) =>
        createFormattedDataForOneField(
          response,
          this.hashedFields,
          getDataCollationFormattedResponse,
        ),
    )

    // Compact is necessary because getDataCollationFormattedResponse
    // will return undefined for header fields
    return compact(dataCollationFormattedData)
  }

  /**
   * Getter function to return autoReplyData for confirmation emails to respondent
   * If FormAuthType is CP, return a masked version
   */
  get autoReplyData(): EmailRespondentConfirmationField[] {
    // Compact is necessary because getAutoReplyFormattedResponse
    // will return undefined for non-visible fields
    const unmaskedAutoReplyData = compact(
      this.parsedResponses.flatMap((response) =>
        createFormattedDataForOneField(
          response,
          this.hashedFields,
          getAutoReplyFormattedResponse,
        ),
      ),
    )

    return this.authType === FormAuthType.CP
      ? maskUidOnLastField(unmaskedAutoReplyData)
      : unmaskedAutoReplyData
  }
  /**
   * Getter function to return formData which is used to send responses to admin
   */
  get formData(): EmailAdminDataField[] {
    return this.parsedResponses.flatMap((response) =>
      createFormattedDataForOneField(
        response,
        this.hashedFields,
        getFormFormattedResponse,
      ),
    )
  }
}
