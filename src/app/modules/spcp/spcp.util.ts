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
  LoginPageValidationError,
  VerifyJwtError,
} from './spcp.errors'
import { JwtName, JwtPayload, SpcpCookies } from './spcp.types'

const logger = createLoggerWithLabel(module)
const DESTINATION_REGEX = /^\/([\w]+)\/?/

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

export const extractFormId = (destination: string): string | null => {
  const regexSplit = DESTINATION_REGEX.exec(destination)
  if (!regexSplit || regexSplit.length < 2) {
    return null
  }
  return regexSplit[1]
}

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

export const verifyJwtPromise = (
  authClient: SPCPAuthClient,
  jwt: string,
): Promise<JwtPayload> => {
  return new Promise<JwtPayload>((resolve, reject) => {
    authClient.verifyJWT<JwtPayload>(jwt, (error: Error, data: JwtPayload) => {
      if (error) {
        return reject(error)
      }
      return resolve(data)
    })
  })
}

export const extractJwt = (
  cookies: SpcpCookies,
  authType: AuthType,
): string | undefined => {
  switch (authType) {
    case AuthType.SP:
      return cookies[JwtName.SP]
    case AuthType.CP:
      return cookies[JwtName.CP]
    default:
      return undefined
  }
}

export const createSingpassParsedResponses = (
  uinFin: string,
): ProcessedSingleAnswerResponse[] => {
  return [
    {
      _id: '',
      question: 'SingPass Validated NRIC',
      fieldType: 'authenticationSp' as BasicField,
      isVisible: true,
      answer: uinFin,
    },
  ]
}

export const createCorppassParsedResponses = (
  uinFin: string,
  userInfo: string,
): ProcessedSingleAnswerResponse[] => {
  return [
    {
      _id: '',
      question: 'CorpPass Validated UEN',
      fieldType: 'authenticationCp' as BasicField,
      isVisible: true,
      answer: uinFin,
    },
    {
      _id: '',
      question: 'CorpPass Validated UID',
      fieldType: 'authenticationCp' as BasicField,
      isVisible: true,
      answer: userInfo,
    },
  ]
}

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
    case VerifyJwtError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage: 'User is not SPCP authenticated',
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
