import bcrypt from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import moment from 'moment'
import mongoose from 'mongoose'
import { err, ok, Result } from 'neverthrow'
import { v4 as uuidv4, validate as validateUUID } from 'uuid'

import { createLoggerWithLabel } from '../../../config/logger'
import { types as myInfoTypes } from '../../../shared/resources/myinfo'
import {
  AuthType,
  BasicField,
  IFormSchema,
  IHashes,
  IMyInfo,
  IPopulatedForm,
  MapRouteError,
} from '../../../types'
import { DatabaseError, MissingFeatureError } from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'
import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  LoginPageValidationError,
} from '../spcp/spcp.errors'
import { ProcessedFieldResponse } from '../submission/submission.types'

import { MYINFO_COOKIE_NAME } from './myinfo.constants'
import {
  MyInfoAuthTypeError,
  MyInfoCookieStateError,
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoMissingAccessTokenError,
  MyInfoMissingHashError,
  MyInfoNoESrvcIdError,
} from './myinfo.errors'
import {
  IMyInfoForm,
  IPossiblyPrefilledField,
  MyInfoComparePromises,
  MyInfoCookiePayload,
  MyInfoCookieState,
  MyInfoHashPromises,
  MyInfoRelayState,
  MyInfoSuccessfulCookiePayload,
  VisibleMyInfoResponse,
} from './myinfo.types'

const logger = createLoggerWithLabel(module)
const HASH_SALT_ROUNDS = 10

/**
 * Hashes field values which are prefilled and MyInfo-verified.
 * @param prefilledFormFields Fields with fieldValue prefilled using MyInfo and disabled
 * set to true if the prefilled value is MyInfo-verified
 * @returns object mapping MyInfo attributes to Promises of their hashes
 */
export const hashFieldValues = (
  prefilledFormFields: IPossiblyPrefilledField[],
): MyInfoHashPromises => {
  const readOnlyHashPromises: MyInfoHashPromises = {}

  prefilledFormFields.forEach((field) => {
    if (!field.myInfo?.attr || !field.fieldValue || !field.disabled) return
    readOnlyHashPromises[field.myInfo.attr] = bcrypt.hash(
      field.fieldValue.toString(),
      HASH_SALT_ROUNDS,
    )
  })
  return readOnlyHashPromises
}

/**
 * Whether a field contains a MyInfo response
 * @param field a processed response with the isVisible attribute
 */
const hasMyInfoAnswer = (
  field: ProcessedFieldResponse,
): field is VisibleMyInfoResponse => {
  return !!field.isVisible && !!field.myInfo?.attr
}

const filterFieldsWithHashes = (
  responses: ProcessedFieldResponse[],
  hashes: IHashes,
): VisibleMyInfoResponse[] => {
  // Filter twice to get types to cooperate
  return responses
    .filter(hasMyInfoAnswer)
    .filter((response) => !!hashes[response.myInfo.attr])
}

const transformAnswer = (field: VisibleMyInfoResponse): string => {
  const answer = field.answer
  return field.fieldType === BasicField.Date
    ? moment(new Date(answer)).format('YYYY-MM-DD')
    : answer
}

const compareSingleHash = (
  hash: string,
  field: VisibleMyInfoResponse,
): Promise<boolean> => {
  const transformedAnswer = transformAnswer(field)
  return bcrypt.compare(transformedAnswer, hash)
}

/**
 * Compares the MyInfo responses within the given response array to the given hashes.
 * @param responses Responses with isVisible true if they are not hidden by logic
 * @param hashes Hashed values of the MyInfo responses
 */
export const compareHashedValues = (
  responses: ProcessedFieldResponse[],
  hashes: IHashes,
): MyInfoComparePromises => {
  // Filter responses to only those fields with a corresponding hash
  const fieldsWithHashes = filterFieldsWithHashes(responses, hashes)
  // Map MyInfoAttribute to response
  const myInfoResponsesMap: MyInfoComparePromises = new Map()
  fieldsWithHashes.forEach((field) => {
    const attr = field.myInfo.attr
    // Already checked that hashes contains this attr
    myInfoResponsesMap.set(field._id, compareSingleHash(hashes[attr]!, field))
  })
  return myInfoResponsesMap
}

/**
 * Maps an error to the status code and message returned for the verifyMyInfoVals middleware
 * @param error The error thrown
 */
export const mapVerifyMyInfoError: MapRouteError = (error) => {
  switch (error.constructor) {
    case MissingFeatureError:
    case MyInfoHashingError:
    case DatabaseError:
      return {
        statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        errorMessage:
          'MyInfo verification unavailable, please try again later.',
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
    default:
      logger.error({
        message: 'Unknown route error observed',
        meta: {
          action: 'mapVerifyMyInfoError',
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
 * Maps errors while creating MyInfo redirect URL to status codes and messages.
 * @param error Error to be mapped
 * @param coreErrorMessage Default error message
 */
export const mapRedirectURLError: MapRouteError = (
  error,
  coreErrorMessage = 'Something went wrong. Please refresh and try again.',
) => {
  switch (error.constructor) {
    case FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage:
          'Could not find the form requested. Please refresh and try again.',
      }
    case MyInfoAuthTypeError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'This form does not have MyInfo enabled. Please refresh and try again.',
      }
    case DatabaseError:
    case MissingFeatureError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
    default:
      logger.error({
        message: 'Unknown route error observed',
        meta: {
          action: 'mapRedirectURLError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
  }
}

/**
 * Maps errors while validating e-service ID to status codes and messages.
 * @param error Error to be mapped
 * @param coreErrorMessage Default error message
 */
export const mapEServiceIdCheckError: MapRouteError = (
  error,
  coreErrorMessage = 'Something went wrong. Please refresh and try again.',
) => {
  switch (error.constructor) {
    case FormNotFoundError:
      return {
        statusCode: StatusCodes.NOT_FOUND,
        errorMessage:
          'Could not find the form requested. Please refresh and try again.',
      }
    case MyInfoAuthTypeError:
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage:
          'This form does not have MyInfo enabled. Please refresh and try again.',
      }
    case MyInfoNoESrvcIdError:
      return {
        statusCode: StatusCodes.FORBIDDEN,
        errorMessage:
          'This form does not have valid MyInfo credentials. Please contact the form administrator.',
      }
    case FetchLoginPageError:
    case LoginPageValidationError:
      return {
        statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        errorMessage: 'Failed to contact SingPass. Please try again.',
      }
    case DatabaseError:
    case MissingFeatureError:
    case CreateRedirectUrlError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
    default:
      logger.error({
        message: 'Unknown route error observed',
        meta: {
          action: 'mapRedirectURLError',
        },
        error,
      })
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: coreErrorMessage,
      }
  }
}

/**
 * Retrieves the field options which should be provided with a MyInfo
 * dropdown field.
 * @param myInfoAttr MyInfo attribute
 */
export const getMyInfoFieldOptions = (
  myInfoAttr: IMyInfo['attr'],
): string[] => {
  const [myInfoField] = myInfoTypes.filter((type) => type.name === myInfoAttr)
  return myInfoField?.fieldOptions || []
}

/**
 * Creates state which MyInfo should forward back once user has logged in.
 * @param formId ID of form which user is logging into
 */
export const createRelayState = (formId: string): string =>
  JSON.stringify({
    uuid: uuidv4(),
    formId,
  })

/**
 * Validates that a form is a MyInfo form with an e-service ID
 * @param form Form to validate
 */
export const validateMyInfoForm = (
  form: IFormSchema | IPopulatedForm,
): Result<IMyInfoForm, MyInfoNoESrvcIdError | MyInfoAuthTypeError> => {
  if (!form.esrvcId) {
    return err(new MyInfoNoESrvcIdError())
  }
  if (form.authType !== AuthType.MyInfo) {
    return err(new MyInfoAuthTypeError())
  }
  return ok(form as IMyInfoForm)
}

/**
 * Utility to narrow type of an object by determining whether
 * it contains the given property.
 * @param obj Object
 * @param prop Property to check
 */
export const hasProp = <K extends string>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  obj: object | Record<string, unknown>,
  prop: K,
): obj is Record<K, unknown> => {
  return prop in obj
}

/**
 * Type guard for MyInfo cookie.
 * @param cookie Unknown object
 */
export const isMyInfoCookie = (
  cookie: unknown,
): cookie is MyInfoCookiePayload => {
  if (cookie && typeof cookie === 'object' && hasProp(cookie, 'state')) {
    // Test for success state
    if (
      cookie.state === MyInfoCookieState.Success &&
      hasProp(cookie, 'accessToken') &&
      typeof cookie.accessToken === 'string' &&
      hasProp(cookie, 'usedCount') &&
      typeof cookie.usedCount === 'number'
    ) {
      return true
    } else if (
      // Test for any other valid state
      Object.values<string>(MyInfoCookieState).includes(String(cookie.state))
    ) {
      return true
    }
  }
  return false
}

/**
 * Extracts a MyInfo cookie from a request's cookies, and validates
 * its shape.
 * @param cookies Cookies in a request
 */
export const extractMyInfoCookie = (
  cookies: Record<string, unknown>,
): Result<MyInfoCookiePayload, MyInfoMissingAccessTokenError> => {
  const cookie = cookies[MYINFO_COOKIE_NAME]
  if (isMyInfoCookie(cookie)) {
    return ok(cookie)
  }
  return err(new MyInfoMissingAccessTokenError())
}

/**
 * Checks if myInfoCookie is successful and returns the result.
 * This function acts as a discriminator so that the type of the cookie is encoded in its type
 * @param cookie the cookie to
 * @returns ok(cookie) the successful myInfoCookie
 * @returns err(cookie) the errored cookie
 */
export const extractSuccessfulCookie = (
  cookie: MyInfoCookiePayload,
): Result<MyInfoSuccessfulCookiePayload, MyInfoCookieStateError> =>
  cookie.state === MyInfoCookieState.Success
    ? ok(cookie)
    : err(new MyInfoCookieStateError())

/**
 * Extracts access token from a MyInfo cookie
 * @param cookie Cookie from which access token should be extracted
 */
export const extractAccessTokenFromCookie = (
  cookie: MyInfoCookiePayload,
): Result<string, MyInfoCookieStateError> => {
  if (cookie.state !== MyInfoCookieState.Success) {
    return err(new MyInfoCookieStateError())
  }
  return ok(cookie.accessToken)
}

export const isMyInfoRelayState = (obj: unknown): obj is MyInfoRelayState =>
  typeof obj === 'object' &&
  !!obj &&
  hasProp(obj, 'formId') &&
  typeof obj.formId === 'string' &&
  mongoose.Types.ObjectId.isValid(obj.formId) &&
  hasProp(obj, 'uuid') &&
  typeof obj.uuid === 'string' &&
  validateUUID(obj.uuid)
