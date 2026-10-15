import {
  CorppassAttribute,
  FormAuthType,
  FormFieldDto,
} from 'formsg-shared/types'
import {
  getLoginIdentityAttr,
  getLoginIdentityAttrsForAuthType,
  isLoginIdentityFieldOwned,
  LoginIdentityAttribute,
} from 'formsg-shared/utils/login-identity'
import { StatusCodes } from 'http-status-codes'

import { MapRouteError } from 'src/types'

import { createLoggerWithLabel } from '../../../config/logger'
import { ApplicationError, DatabaseError } from '../../core/core.errors'
import { ErrorResponseData } from '../../core/core.types'
import {
  MyInfoFapiAuthRequestError,
  MyInfoFapiConfigError,
} from '../../myinfo/fapi/myinfo.fapi.errors'
import { CreateRedirectUrlError } from '../../spcp/spcp.errors'
import * as FormErrors from '../form.errors'

const logger = createLoggerWithLabel(module)

/**
 * Handler to map ApplicationErrors to their correct status code and error
 * messages for PublicFormController.
 * @param error The error to retrieve the status codes and error messages
 * @param coreErrorMessage Any error message to return instead of the default core error message, if any
 */
export const mapRouteError = (
  error: ApplicationError,
  coreErrorMessage?: string,
): ErrorResponseData => {
  switch (error.constructor) {
    case FormErrors.FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case FormErrors.FormDeletedError:
      return {
        statusCode: StatusCodes.GONE,
        errorMessage: error.message,
      }
    case FormErrors.PrivateFormError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage: error.message,
      }
    case DatabaseError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage ?? error.message,
      }
    default:
      logger.error({
        message: 'Unknown route error observed in PublicFormController',
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
 * Handler to map ApplicationErrors from redirecting to SPCP login page to HTTP errors
 * @param error The error to retrieve the status codes and error messages
 * @param coreErrorMessage Any error message to return instead of the default core error message, if any
 */
export const mapFormAuthError: MapRouteError = (
  error,
  coreErrorMessage = 'Sorry, something went wrong. Please try again.',
) => {
  switch (error.constructor) {
    case FormErrors.FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage:
          'Could not find the form requested. Please refresh and try again.',
      }
    case FormErrors.FormAuthNoEsrvcIdError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'This form does not have a valid eServiceId. Please refresh and try again.',
      }
    case FormErrors.AuthTypeMismatchError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'Please ensure that the form has authentication enabled. Please refresh and try again.',
      }
    case DatabaseError:
    case CreateRedirectUrlError:
    case MyInfoFapiAuthRequestError:
    case MyInfoFapiConfigError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
    default:
      logger.error({
        message: 'Unknown route error observed',
        meta: {
          action: 'mapFormAuthError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Sorry, something went wrong. Please try again.',
      }
  }
}

export type LoginIdentityValues = Partial<
  Record<LoginIdentityAttribute, string>
>

/**
 * The identities a Step 1 login provides, from the same session values the
 * Collect NRIC/FIN/UENs setting records.
 */
export const getLoginIdentityValues = (
  authType: FormAuthType,
  session: { userName?: string; userInfo?: string } | undefined,
): LoginIdentityValues => {
  if (!session?.userName) return {}
  // Corppass sessions carry the UEN as userName and the UID as userInfo.
  return Object.fromEntries(
    getLoginIdentityAttrsForAuthType(authType).map((attr) => [
      attr,
      attr === CorppassAttribute.Uid ? session.userInfo : session.userName,
    ]),
  )
}

/**
 * Fills owned login identity fields from the login and makes them read-only.
 * The server checks what the respondent sends back against the login.
 */
export const prefillLoginIdentityFields = <F extends FormFieldDto>(
  formFields: readonly F[],
  values: LoginIdentityValues,
  workflow?: readonly { edit: readonly unknown[] }[],
): F[] =>
  formFields.map((field) => {
    const attr = getLoginIdentityAttr(field)
    const fieldValue =
      attr && isLoginIdentityFieldOwned(field, workflow)
        ? values[attr]
        : undefined
    return fieldValue ? { ...field, fieldValue, disabled: true } : field
  })
