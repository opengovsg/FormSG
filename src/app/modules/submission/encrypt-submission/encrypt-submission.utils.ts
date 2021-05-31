import { StatusCodes } from 'http-status-codes'
import moment from 'moment-timezone'
import { Result } from 'neverthrow'

import { getVisibleFieldIds } from '../../../../shared/util/logic'
import {
  EncryptedSubmissionDto,
  FieldResponse,
  IPopulatedEncryptedForm,
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
import { checkIsEncryptedEncoding } from '../../../utils/encryption'
import {
  AttachmentUploadError,
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
  MalformedParametersError,
  MissingFeatureError,
} from '../../core/core.errors'
import { CreatePresignedUrlError } from '../../form/admin-form/admin-form.errors'
import {
  ForbiddenFormError,
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from '../../form/form.errors'
import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  InvalidJwtError,
  LoginPageValidationError,
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
import { getFilteredResponses, IncomingSubmission } from '../submission.utils'

const logger = createLoggerWithLabel(module)

/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages.
 * @param error The error to retrieve the status codes and error messages
 */
export const mapRouteError: MapRouteError = (
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
    case MissingFeatureError:
    case CreateRedirectUrlError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
    case FetchLoginPageError:
      return {
        statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        errorMessage: 'Failed to contact SingPass. Please try again.',
      }
    case LoginPageValidationError:
      return {
        statusCode: StatusCodes.BAD_GATEWAY,
        errorMessage: 'Error while contacting SingPass. Please try again.',
      }
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
        errorMessage: error.message,
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
    case CreatePresignedUrlError:
    case DatabaseError:
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

/**
 * Creates and returns an EncryptedSubmissionDto object from submissionData and
 * attachment presigned urls.
 */
export const createEncryptedSubmissionDto = (
  submissionData: SubmissionData,
  attachmentPresignedUrls: Record<string, string>,
): EncryptedSubmissionDto => {
  return {
    refNo: submissionData._id,
    submissionTime: moment(submissionData.created)
      .tz('Asia/Singapore')
      .format('ddd, D MMM YYYY, hh:mm:ss A'),
    content: submissionData.encryptedContent,
    verified: submissionData.verifiedContent,
    attachmentMetadata: attachmentPresignedUrls,
  }
}

export class IncomingEncryptSubmission extends IncomingSubmission {
  constructor(
    responses: FieldResponse[],
    public readonly form: IPopulatedEncryptedForm,
    public readonly encryptedContent: string,
  ) {
    super(responses, form)
  }

  static init(
    form: IPopulatedEncryptedForm,
    responses: FieldResponse[],
    encryptedContent: string,
  ): Result<
    IncomingEncryptSubmission,
    ProcessingError | ConflictError | ValidateFieldError
  > {
    return checkIsEncryptedEncoding(encryptedContent)
      .andThen(() => this.processResponses(responses, form))
      .map(
        (filteredResponses) =>
          new IncomingEncryptSubmission(
            filteredResponses,
            form,
            encryptedContent,
          ),
      )
  }

  private static processResponses(
    responses: FieldResponse[],
    form: IPopulatedEncryptedForm,
  ): Result<
    FieldResponse[],
    ProcessingError | ConflictError | ValidateFieldError
  > {
    return getFilteredResponses(form, responses)
      .andThen((filteredResponses) =>
        this.getFieldMap(form, filteredResponses).map((fieldMap) => ({
          filteredResponses,
          fieldMap,
        })),
      )
      .map(({ filteredResponses, fieldMap }) => ({
        filteredResponses,
        fieldMap,
        visibleFieldIds: getVisibleFieldIds(filteredResponses, form),
        verifiableResponseIds: this.getVerifiableResponseIds(
          filteredResponses,
          fieldMap,
        ),
        visibleResponseIds: this.getVisibleResponseIds(
          filteredResponses,
          fieldMap,
          (response: FieldResponse) =>
            'answer' in response &&
            typeof response.answer === 'string' &&
            response.answer.trim() !== '',
        ),
      }))
      .andThen(
        ({
          filteredResponses,
          fieldMap,
          visibleFieldIds,
          visibleResponseIds,
          verifiableResponseIds,
        }) =>
          this.validateResponses(
            filteredResponses,
            form,
            fieldMap,
            visibleFieldIds,
            visibleResponseIds,
            verifiableResponseIds,
          ).map(() => filteredResponses),
      )
  }
}
