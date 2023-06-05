import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import { FormAuthType } from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import {
  ExchangeAuthTokenError,
  InvalidIdTokenError,
  InvalidJwtError,
  MissingAttributesError,
  VerifyJwtError,
} from '../spcp.errors'
import { CpOidcClient } from '../spcp.oidc.client'
import {
  CorppassJwtPayloadFromCookie,
  ExtractedCorppassNDIPayload,
  ExtractedNDIPayload,
  JwtName,
  JwtPayload,
} from '../spcp.types'
import {
  isCorppassJwtPayload,
  isExtractedCorppassNDIPayload,
} from '../spcp.util'

import { SpcpOidcServiceClass } from './spcp.oidc.service.base'
import { CpOidcProps } from './spcp.oidc.service.types'

const logger = createLoggerWithLabel(module)

export class CpOidcServiceClass extends SpcpOidcServiceClass {
  authType = FormAuthType.CP
  jwtName = JwtName.CP

  oidcClient: CpOidcClient
  oidcProps: CpOidcProps

  constructor(oidcClient: CpOidcClient, oidcProps: CpOidcProps) {
    super()

    // assign members in subclass to let typescript register the types
    this.oidcClient = oidcClient
    this.oidcProps = oidcProps
  }

  /**
   * Verifies a Corppass JWT and extracts its payload.
   * @param jwt The contents of the JWT cookie
   * @returns ok(Corppass JWT payload)
   * @returns err(VerifyJwtError) if JWT verification failed
   * @returns err(InvalidJwtError) if JWT has invalid shape
   */
  extractJwtPayload(
    jwt: string,
  ): ResultAsync<
    CorppassJwtPayloadFromCookie,
    VerifyJwtError | InvalidJwtError
  > {
    const logMeta = {
      action: 'CpOidcService.extractJwtPayload',
    }

    const result = ResultAsync.fromPromise(
      this.oidcClient.verifyJwt(jwt),
      (error) => {
        logger.error({
          message: 'Failed to verify JWT with auth client',
          meta: logMeta,
          error,
        })
        return new VerifyJwtError()
      },
    ).andThen((payload) => {
      if (isCorppassJwtPayload(payload)) {
        return okAsync(payload)
      }
      const payloadIsDefined = !!payload
      const payloadKeys =
        typeof payload === 'object' && !!payload && Object.keys(payload)
      logger.error({
        message: 'JWT has incorrect shape',
        meta: {
          ...logMeta,
          payloadIsDefined,
          payloadKeys,
        },
      })
      return errAsync(new InvalidJwtError())
    })

    return result
  }

  /**
   * Method to exchange auth code for decrypted and verified idToken and then extract NRIC and entityId
   * Used for Corppass forms
   * @param code authorisation code
   * @returns okAsync(ExtractedCorppassNDIPayload)
   * @returns errAsync(InvalidIdTokenError) if failed to retrieve NRIC or entityId
   */
  exchangeAuthCodeAndRetrieveData(
    code: string,
  ): ResultAsync<ExtractedCorppassNDIPayload, InvalidIdTokenError> {
    const logMeta = {
      action: 'exchangeAuthCodeAndRetrieveData',
    }

    return ResultAsync.fromPromise(
      this.oidcClient
        .exchangeAuthCodeAndDecodeVerifyToken(code)
        .then((decodedVerifiedToken) => {
          return {
            userInfo:
              this.oidcClient.extractNricOrForeignIdFromIdToken(
                decodedVerifiedToken,
              ),
            userName:
              this.oidcClient.extractCPEntityIdFromIdToken(
                decodedVerifiedToken,
              ),
          }
        })
        .then((result) => {
          if (isExtractedCorppassNDIPayload(result)) {
            return result
          }
          if (result.userName instanceof Error) {
            return Promise.reject(result.userName)
          } else {
            return Promise.reject(result.userInfo)
          }
        }),
      (error) => {
        logger.error({
          message: 'Failed to exchange auth code and retrieve nric and entID',
          meta: logMeta,
          error,
        })
        return new ExchangeAuthTokenError()
      },
    )
  }

  getCookieDuration(): number {
    return this.oidcProps.cookieMaxAge
  }

  /**
   * Creates a payload of SP/CP user data based on attributes
   * @param attributes user data returned by SP/CP from client
   * @param rememberMe Whether to enable longer duration for SingPass cookies
   * @return The payload
   */
  createJWTPayload(
    attributes: ExtractedNDIPayload,
    rememberMe: boolean,
  ): Result<JwtPayload, MissingAttributesError> {
    if (isExtractedCorppassNDIPayload(attributes)) {
      const { userName, userInfo } = attributes
      return userName && userInfo
        ? ok({ userName, userInfo, rememberMe })
        : err(new MissingAttributesError())
    }

    return err(new MissingAttributesError())
  }
}
