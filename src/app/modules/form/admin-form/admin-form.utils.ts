import { StatusCodes } from 'http-status-codes'
import { err, ok, Result } from 'neverthrow'

import { createLoggerWithLabel } from '../../../../config/logger'
import { IPopulatedForm, ResponseMode, Status } from '../../../../types'
import { assertUnreachable } from '../../../utils/assert-unreachable'
import {
  ApplicationError,
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
  MalformedParametersError,
} from '../../core/core.errors'
import { ErrorResponseData } from '../../core/core.types'
import { MissingUserError } from '../../user/user.errors'
import {
  ForbiddenFormError,
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
  TransferOwnershipError,
} from '../form.errors'

import {
  CreatePresignedUrlError,
  InvalidFileTypeError,
} from './admin-form.errors'
import {
  AssertFormFn,
  DuplicateFormBody,
  OverrideProps,
  PermissionLevel,
} from './admin-form.types'

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
    case FormDeletedError:
      return {
        statusCode: StatusCodes.GONE,
        errorMessage: error.message,
      }
    case PrivateFormError:
    case ForbiddenFormError:
      return {
        statusCode: StatusCodes.FORBIDDEN,
        errorMessage: error.message,
      }
    case DatabaseValidationError:
    case MissingUserError:
      return {
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        errorMessage: error.message,
      }
    case TransferOwnershipError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
    case MalformedParametersError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: error.message,
      }
    case DatabaseConflictError:
      return {
        statusCode: StatusCodes.CONFLICT,
        errorMessage: error.message,
      }
    case DatabasePayloadSizeError:
      return {
        statusCode: StatusCodes.REQUEST_TOO_LONG,
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

/**
 * Asserts whether a form is available for retrieval by users.
 * @param form the form to check
 * @returns ok(true) if form status is not archived.
 * @returns err(FormDeletedError) if the form has already been archived
 */
export const assertFormAvailable = (
  form: IPopulatedForm,
): Result<true, FormDeletedError> => {
  return form.status === Status.Archived
    ? err(new FormDeletedError('Form has been archived'))
    : ok(true)
}

/**
 * Asserts that the given user has read access for the form.
 * @returns ok(true) if given user has read permissions
 * @returns err(ForbiddenFormError) if user does not have read permissions
 */
export const assertHasReadPermissions: AssertFormFn = (user, form) => {
  // Is form admin. Automatically has permissions.
  if (String(user._id) === String(form.admin._id)) {
    return ok(true)
  }

  // Check if user email is currently in form's allowed list.
  const hasReadPermissions = !!form.permissionList?.find(
    (allowedUser) => allowedUser.email === user.email,
  )

  return hasReadPermissions
    ? ok(true)
    : err(
        new ForbiddenFormError(
          `User ${user.email} not authorized to perform read operation on Form ${form._id} with title: ${form.title}.`,
        ),
      )
}

/**
 * Asserts that the given user has delete permissions for the form.
 * @returns ok(true) if given user has delete permissions
 * @returns err(ForbiddenFormError) if user does not have delete permissions
 */
export const assertHasDeletePermissions: AssertFormFn = (user, form) => {
  const isFormAdmin = String(user._id) === String(form.admin._id)
  // If form admin
  return isFormAdmin
    ? ok(true)
    : err(
        new ForbiddenFormError(
          `User ${user.email} not authorized to perform delete operation on Form ${form._id} with title: ${form.title}.`,
        ),
      )
}

/**
 * Asserts that the given user has write permissions for the form.
 * @returns ok(true) if given user has write permissions
 * @returns err(ForbiddenFormError) if user does not have write permissions
 */
export const assertHasWritePermissions: AssertFormFn = (user, form) => {
  // Is form admin. Automatically has permissions.
  if (String(user._id) === String(form.admin._id)) {
    return ok(true)
  }

  // Check if user email is currently in form's allowed list, and has write
  // permissions.
  const hasWritePermissions = !!form.permissionList?.find(
    (allowedUser) => allowedUser.email === user.email && allowedUser.write,
  )

  return hasWritePermissions
    ? ok(true)
    : err(
        new ForbiddenFormError(
          `User ${user.email} not authorized to perform write operation on Form ${form._id} with title: ${form.title}.`,
        ),
      )
}

export const getAssertPermissionFn = (level: PermissionLevel): AssertFormFn => {
  switch (level) {
    case PermissionLevel.Read:
      return assertHasReadPermissions
    case PermissionLevel.Write:
      return assertHasWritePermissions
    case PermissionLevel.Delete:
      return assertHasDeletePermissions
    default:
      return assertUnreachable(level)
  }
}

/**
 * Reshapes given duplicate params into override props.
 * @param params the parameters to reshape
 * @param newAdminId the new admin id to inject
 *
 * @returns override props for use in duplicating a form
 */
export const processDuplicateOverrideProps = (
  params: DuplicateFormBody,
  newAdminId: string,
): OverrideProps => {
  const { responseMode, title } = params

  const overrideProps: OverrideProps = {
    responseMode,
    title,
    admin: newAdminId,
  }

  switch (params.responseMode) {
    case ResponseMode.Encrypt:
      overrideProps.publicKey = params.publicKey
      break
    case ResponseMode.Email:
      overrideProps.emails = params.emails
      break
  }

  return overrideProps
}
