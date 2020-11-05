import { StatusCodes } from 'http-status-codes'
import { err, ok, Result } from 'neverthrow'

import { createLoggerWithLabel } from '../../../../config/logger'
import { IPopulatedForm, IUserSchema, Status } from '../../../../types'
import {
  ApplicationError,
  DatabaseError,
  MalformedParametersError,
} from '../../core/core.errors'
import { ErrorResponseData } from '../../core/core.types'
import { MissingUserError } from '../../user/user.errors'
import {
  ForbiddenFormError,
  FormDeletedError,
  FormNotFoundError,
} from '../form.errors'

import {
  CreatePresignedUrlError,
  InvalidFileTypeError,
} from './admin-form.errors'

const logger = createLoggerWithLabel(module)

/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages.
 * @param error The error to retrieve the status codes and error messages
 * @param coreErrorMessage Any error message to return instead of the default core error message, if any
 */
export const mapRouteError = (
  error: ApplicationError,
  coreErrorMessage?: string,
): ErrorResponseData => {
  switch (error.constructor) {
    case InvalidFileTypeError:
    case CreatePresignedUrlError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
    case FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case FormDeletedError: {
      return {
        statusCode: StatusCodes.GONE,
        errorMessage: error.message,
      }
    }
    case ForbiddenFormError: {
      return {
        statusCode: StatusCodes.FORBIDDEN,
        errorMessage: error.message,
      }
    }
    case MissingUserError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: error.message,
      }
    case MalformedParametersError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
    case DatabaseError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage ?? error.message,
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

const isFormActive = (form: IPopulatedForm): Result<true, FormDeletedError> => {
  if (form.status === Status.Archived) {
    return err(new FormDeletedError('Form has been archived'))
  }

  return ok(true)
}

/**
 * Asserts that the given user has read access to the form.
 * @returns ok(true) if given user has read permissions to form
 * @returns err(FormDeletedError) if form has already been archived
 * @returns err(ForbiddenFormError) if user does not have read permissions to form
 */
export const assertHasReadPermissions = (
  user: IUserSchema,
  form: IPopulatedForm,
): Result<true, ForbiddenFormError | FormDeletedError> => {
  return isFormActive(form).andThen(() => {
    // Is form admin. Automatically has permissions.
    if (String(user._id) === String(form.admin._id)) {
      return ok(true)
    }

    // Check if user email is currently in form's allowed list.
    const hasReadPermissions = !!form.permissionList?.find(
      (allowedUser) => allowedUser.email === user.email,
    )

    if (!hasReadPermissions) {
      return err(
        new ForbiddenFormError(
          `User ${user.email} not authorized to perform read operation on Form ${form._id} with title: ${form.title}.`,
        ),
      )
    }

    return ok(true)
  })
}
