import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import { err, ok, Result } from 'neverthrow'

import { BasicField, FormAuthType } from '../../../../shared/types'
import { hasProp } from '../../../../shared/utils/has-prop'
import { IFormSchema, MapRouteError, SPCPFieldTitle } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
} from '../form/form.errors'
import { ProcessedSingleAnswerResponse } from '../submission/submission.types'

import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  InvalidJwtError,
  LoginPageValidationError,
  MissingJwtError,
  VerifyJwtError,
} from './spcp.errors'
import {
  CorppassJwtPayloadFromCookie,
  ExtractedCorppassNDIPayload,
  RedirectTarget,
  RedirectTargetSpOidc,
  SingpassJwtPayloadFromCookie,
  SpcpForm,
} from './spcp.types'

const logger = createLoggerWithLabel(module)

// Matches the MongoDB ObjectID hex format exactly (24 hex characters)
const DESTINATION_REGEX = /^\/([a-fA-F0-9]{24})\/?$/

// Checks the format of a SAML artifact
const isArtifactValid = function (
  idpPartnerEntityId: string,
  samlArt: string,
): boolean {
  // Artifact should be 44 bytes long, of type 0x0004 and
  // source id should be SHA-1 hash of the issuer's entityID
  const hexEncodedArtifact = Buffer.from(samlArt, 'base64').toString('hex')
  const artifactHexLength = hexEncodedArtifact.length
  const typeCode = parseInt(hexEncodedArtifact.substr(0, 4))
  const sourceId = hexEncodedArtifact.substr(8, 40)
  const hashedEntityId = crypto
    .createHash('sha1')
    .update(idpPartnerEntityId, 'utf8')
    .digest('hex')

  return (
    artifactHexLength === 88 && typeCode === 4 && sourceId === hashedEntityId
  )
}

/**
 * Returns true if the SAML artifact and destination have the correct format,
 * false otherwise.
 * @param samlArt SAML artifact
 * @param destination Redirect destination
 * @param idpPartnerEntityId Entity ID of SP/CP server
 */
export const isValidAuthenticationQuery = (
  samlArt: string,
  destination: string,
  idpPartnerEntityId: string,
): boolean => {
  return !!destination && isArtifactValid(idpPartnerEntityId, samlArt)
}

/**
 * Extracts the form ID from a redirect destination
 * @param destination Redirect destination
 */
export const extractFormId = (destination: string): string | null => {
  const regexSplit = destination.match(DESTINATION_REGEX)
  if (!regexSplit || regexSplit.length < 2) {
    return null
  }
  return regexSplit[1]
}

/**
 * Wraps the auth client's getAttributes method in a Promise
 * @param authClient Auth client whose .getAttributes method should be wrapped
 * @param samlArt SAML artifact
 * @param destination Redirect destination
 */
export const getAttributesPromise = (
  authClient: SPCPAuthClient,
  samlArt: string,
  destination: string,
): Promise<Record<string, unknown>> => {
  return new Promise((resolve, reject) => {
    authClient.getAttributes(samlArt, destination, (err, data) => {
      if (err || !data || !data.attributes) {
        return reject('Auth client could not retrieve attributes')
      }
      return resolve(data.attributes)
    })
  })
}

/**
 * Retrieves a substring in between two markers of the main text
 * @param text Full text
 * @param markerStart Starting string
 * @param markerEnd Ending string
 */
export const getSubstringBetween = (
  text: string,
  markerStart: string,
  markerEnd: string,
): string | null => {
  const start = text.indexOf(markerStart)
  if (start === -1) {
    return null
  } else {
    const end = text.indexOf(markerEnd, start)
    return end === -1 ? null : text.substring(start + markerStart.length, end)
  }
}

/**
 * Wraps the auth client's .verifyJWT method in a Promise
 * @param authClient Auth client whose .verifyJWT method should be wrapped
 * @param jwt
 */
export const verifyJwtPromise = (
  authClient: SPCPAuthClient,
  jwt: string,
): Promise<unknown> => {
  return new Promise<unknown>((resolve, reject) => {
    authClient.verifyJWT<unknown>(jwt, (error, data) => {
      if (error) {
        return reject(error)
      }
      return resolve(data)
    })
  })
}

/**
 * Typeguard for SingPass JWT payload.
 * @param payload Payload decrypted from JWT
 */
export const isSingpassJwtPayload = (
  payload: unknown,
): payload is SingpassJwtPayloadFromCookie => {
  return (
    typeof payload === 'object' &&
    !!payload &&
    hasProp(payload, 'userName') &&
    typeof payload.userName === 'string'
  )
}

/**
 * Typeguard for Corppass JWT payload.
 * @param payload Payload decrypted from JWT
 */
export const isCorppassJwtPayload = (
  payload: unknown,
): payload is CorppassJwtPayloadFromCookie => {
  return (
    typeof payload === 'object' &&
    !!payload &&
    hasProp(payload, 'userName') &&
    typeof payload.userName === 'string' &&
    hasProp(payload, 'userInfo') &&
    typeof payload.userInfo === 'string'
  )
}

/**
 * Wraps SingPass data in the form of parsed form fields.
 * @param uinFin UIN or FIN
 */
export const createSingpassParsedResponses = (
  uinFin: string,
): ProcessedSingleAnswerResponse[] => {
  return [
    {
      _id: '',
      question: SPCPFieldTitle.SpNric,
      fieldType: BasicField.Nric,
      isVisible: true,
      answer: uinFin,
    },
  ]
}

/**
 * Wraps CorpPass data in the form of parsed form fields.
 * @param uinFin CorpPass UEN
 * @param userInfo CorpPass UID
 */
export const createCorppassParsedResponses = (
  uinFin: string,
  userInfo: string,
): ProcessedSingleAnswerResponse[] => {
  return [
    {
      _id: '',
      question: SPCPFieldTitle.CpUen,
      fieldType: BasicField.ShortText,
      isVisible: true,
      answer: uinFin,
    },
    {
      _id: '',
      question: SPCPFieldTitle.CpUid,
      fieldType: BasicField.Nric,
      isVisible: true,
      answer: userInfo,
    },
  ]
}

/**
 * Validates that a form is a SPCP form with an e-service ID
 * @param form Form to validate
 */
export const validateSpcpForm = <T extends IFormSchema>(
  form: T,
): Result<SpcpForm<T>, FormAuthNoEsrvcIdError | AuthTypeMismatchError> => {
  // This is an extra check to return the specific error encountered
  if (!form.esrvcId) {
    return err(new FormAuthNoEsrvcIdError(form.id))
  }
  if (isSpcpForm(form)) {
    return ok(form)
  }
  return err(new AuthTypeMismatchError(FormAuthType.CP, form.authType))
}

// Typeguard to ensure that form has eserviceId and correct authType
const isSpcpForm = <F extends IFormSchema>(form: F): form is SpcpForm<F> => {
  return (
    !!form.authType &&
    [FormAuthType.SP, FormAuthType.CP].includes(form.authType) &&
    !!form.esrvcId
  )
}

/**
 * Maps errors to status codes and error messages to return to frontend.
 * @param error
 */
export const mapRouteError: MapRouteError = (
  error,
  coreErrorMessage = 'Sorry, something went wrong. Please try again.',
) => {
  switch (error.constructor) {
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
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage:
          'Something went wrong with your login. Please try logging in and submitting again.',
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
        errorMessage: 'Sorry, something went wrong. Please try again.',
      }
  }
}

// Generates the target to redirect to for the given form id
export const getRedirectTarget = (
  formId: string,
  authType: FormAuthType.SP | FormAuthType.CP,
  isPersistentLogin?: boolean,
  encodedQuery?: string,
): RedirectTarget => {
  // Need to cast to boolean because undefined is allowed as a valid value
  // We are not following corppass's official spec for
  // the target parameter
  const persistentLogin =
    authType === FormAuthType.SP ? !!isPersistentLogin : false
  return encodedQuery
    ? `/${formId},${persistentLogin},${encodedQuery}`
    : `/${formId},${persistentLogin}`
}

/**
 * Generates the redirect target for the form
 * Differs from SAML implementation in using hyphen separation because NDI OIDC does not allow comma in state
 * @param formId
 * @param isPersistentLogin
 * @param encodedQuery
 * @returns
 */
export const getRedirectTargetSpcpOidc = (
  formId: string,
  authType: FormAuthType.SP | FormAuthType.CP,
  isPersistentLogin?: boolean,
  encodedQuery?: string,
): RedirectTargetSpOidc => {
  // Need to cast to boolean because undefined is allowed as a valid value
  const persistentLogin =
    authType === FormAuthType.SP ? !!isPersistentLogin : false
  return encodedQuery
    ? `/${formId}-${persistentLogin}-${encodedQuery}`
    : `/${formId}-${persistentLogin}`
}

// Typeguards

export const isExtractedCorppassNDIPayload = (
  payload: unknown,
): payload is ExtractedCorppassNDIPayload => {
  return (
    typeof payload === 'object' &&
    !!payload &&
    hasProp(payload, 'userInfo') &&
    hasProp(payload, 'userName') &&
    typeof payload.userInfo === 'string' &&
    typeof payload.userName === 'string'
  )
}
