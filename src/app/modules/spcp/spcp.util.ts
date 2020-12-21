import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType, BasicField, MapRouteError } from '../../../types'
import { MissingFeatureError } from '../core/core.errors'
import { ProcessedSingleAnswerResponse } from '../submission/submission.types'

import {
  CreateRedirectUrlError,
  FetchLoginPageError,
  InvalidJwtError,
  LoginPageValidationError,
  MissingJwtError,
  VerifyJwtError,
} from './spcp.errors'
import { JwtPayload } from './spcp.types'

const logger = createLoggerWithLabel(module)
const DESTINATION_REGEX = /^\/([\w]+)\/?/

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
  return (
    !!destination &&
    isArtifactValid(idpPartnerEntityId, samlArt) &&
    DESTINATION_REGEX.test(destination)
  )
}

/**
 * Extracts the form ID from a redirect destination
 * @param destination Redirect destination
 */
export const extractFormId = (destination: string): string | null => {
  const regexSplit = DESTINATION_REGEX.exec(destination)
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
    authClient.verifyJWT<unknown>(jwt, (error: Error, data: unknown) => {
      if (error) {
        return reject(error)
      }
      return resolve(data)
    })
  })
}

/**
 * Typeguard for JWT payload.
 * @param payload Payload decrypted from JWT
 */
export const isJwtPayload = (
  payload: unknown,
  authType: AuthType.SP | AuthType.CP,
): payload is JwtPayload => {
  if (authType === AuthType.SP) {
    return (
      !!payload &&
      typeof payload === 'object' &&
      typeof (payload as Record<string, unknown>).userName === 'string'
    )
  } else {
    return (
      !!payload &&
      typeof payload === 'object' &&
      typeof (payload as Record<string, unknown>).userName === 'string' &&
      typeof (payload as Record<string, unknown>).userInfo === 'string'
    )
  }
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
      question: 'SingPass Validated NRIC',
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
      question: 'CorpPass Validated UEN',
      fieldType: BasicField.ShortText,
      isVisible: true,
      answer: uinFin,
    },
    {
      _id: '',
      question: 'CorpPass Validated UID',
      fieldType: BasicField.Nric,
      isVisible: true,
      answer: userInfo,
    },
  ]
}

/**
 * Maps errors to status codes and error messages to return to frontend.
 * @param error
 */
export const mapRouteError: MapRouteError = (error) => {
  switch (error.constructor) {
    case MissingFeatureError:
    case CreateRedirectUrlError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Sorry, something went wrong. Please try again.',
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
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage: 'User is not SPCP authenticated',
      }
    case InvalidJwtError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage:
          'Sorry, something went wrong with your login. Please refresh and try again.',
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
