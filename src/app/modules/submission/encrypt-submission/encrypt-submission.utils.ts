import { StatusCodes } from 'http-status-codes'
import moment from 'moment-timezone'

import {
  FormPaymentsField,
  PaymentFieldsDto,
  PaymentType,
  StorageModeSubmissionDto,
  SubmissionPaymentDto,
  SubmissionType,
} from '../../../../../shared/types'
import {
  IEncryptedSubmissionSchema,
  ISubmissionSchema,
  MapRouteErrors,
  SubmissionData,
} from '../../../../types'
import { MapRouteError } from '../../../../types/routing'
import { createLoggerWithLabel } from '../../../config/logger'
import { MalformedVerifiedContentError } from '../../../modules/verified-content/verified-content.errors'
import {
  CaptchaConnectionError,
  MissingCaptchaError,
  VerifyCaptchaError,
} from '../../../services/captcha/captcha.errors'
import { genericMapRouteErrorTransform } from '../../../utils/error'
import {
  AttachmentUploadError,
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
  EmptyErrorFieldError,
  MalformedParametersError,
} from '../../core/core.errors'
import { CreatePresignedUrlError } from '../../form/admin-form/admin-form.errors'
import {
  ForbiddenFormError,
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from '../../form/form.errors'
import { PaymentNotFoundError } from '../../payments/payments.errors'
import {
  SgidInvalidJwtError,
  SgidMissingJwtError,
  SgidVerifyJwtError,
} from '../../sgid/sgid.errors'
import {
  CreateRedirectUrlError,
  InvalidJwtError,
  MissingJwtError,
  VerifyJwtError,
} from '../../spcp/spcp.errors'
import { MissingUserError } from '../../user/user.errors'
import {
  ConflictError,
  InvalidEncodingError,
  ProcessingError,
  ResponseModeError,
  SubmissionNotFoundError,
  ValidateFieldError,
} from '../submission.errors'

const logger = createLoggerWithLabel(module)

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
    case MalformedVerifiedContentError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage:
          'Something went wrong with your login. Please try logging in and submitting again.',
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
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
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
    case MalformedParametersError:
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
    case DatabaseValidationError:
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
    case CreatePresignedUrlError:
    case DatabaseError:
    case EmptyErrorFieldError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
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
 * Typeguard to check if given submission is an encrypt mode submission.
 * @param submission the submission to check
 * @returns true if submission is encrypt mode submission, false otherwise.
 */
export const isSubmissionEncryptMode = (
  submission: ISubmissionSchema,
): submission is IEncryptedSubmissionSchema => {
  return submission.submissionType === SubmissionType.Encrypt
}

/**
 * Creates and returns an EncryptedSubmissionDto object from submissionData and
 * attachment presigned urls.
 */
export const createEncryptedSubmissionDto = (
  submissionData: SubmissionData,
  attachmentPresignedUrls: Record<string, string>,
  payment?: SubmissionPaymentDto,
): StorageModeSubmissionDto => {
  return {
    refNo: submissionData._id,
    submissionTime: moment(submissionData.created)
      .tz('Asia/Singapore')
      .format('ddd, D MMM YYYY, hh:mm:ss A'),
    content: submissionData.encryptedContent,
    verified: submissionData.verifiedContent,
    attachmentMetadata: attachmentPresignedUrls,
    payment,
    version: submissionData.version,
  }
}

/**
 * Retrieves payment amount by payment_type
 * @param formPaymentFields data from the form
 * @param incomingSubmissionPaymentFields data from responder's submission
 */
export const getPaymentAmount = (
  formPaymentFields: FormPaymentsField, // fields that are from document.form
  incomingSubmissionPaymentFields?: PaymentFieldsDto, // fields that are from incoming submission
): number | undefined => {
  // legacy payment forms may not have a payment type
  const { payment_type } = formPaymentFields
  switch (payment_type) {
    case PaymentType.Fixed:
      return formPaymentFields.amount_cents
    case PaymentType.Variable:
      return incomingSubmissionPaymentFields?.amount_cents

    default: {
      // Force TS to emit an error if the cases above are not exhaustive
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = payment_type
    }
  }
}
