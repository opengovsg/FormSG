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
import { SpOidcClient } from '../spcp.oidc.client'
import {
  JwtName,
  JwtPayload,
  SingpassJwtPayloadFromCookie,
} from '../spcp.types'
import { isSingpassJwtPayload } from '../spcp.util'

import { SpcpOidcServiceClass } from './spcp.oidc.service.base'
import { SpOidcProps } from './spcp.oidc.service.types'

const logger = createLoggerWithLabel(module)

export class SpOidcServiceClass extends SpcpOidcServiceClass {
  authType = FormAuthType.SP
  jwtName = JwtName.SP

  oidcClient: SpOidcClient
  oidcProps: SpOidcProps

  constructor(oidcClient: SpOidcClient, oidcProps: SpOidcProps) {
    super(oidcClient, oidcProps)

    // re-assign to let typescript register the types -_-
    this.oidcClient = oidcClient
    this.oidcProps = oidcProps
  }

  /**
   * Verifies a Singpass JWT and extracts its payload.
   * @param jwt The contents of the JWT cookie
   * @returns ok(Singpass JWT payload)
   * @returns err(VerifyJwtError) if JWT verification failed
   * @returns err(InvalidJwtError) if JWT has invalid shape
   */
  extractJwtPayload(
    jwt: string,
  ): ResultAsync<
    SingpassJwtPayloadFromCookie,
    VerifyJwtError | InvalidJwtError
  > {
    const logMeta = {
      action: 'SpOidcService.extractJwtPayload',
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
      if (isSingpassJwtPayload(payload)) {
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
   * Method to exchange auth code for decrypted and verified idToken and then extract NRIC
   * Used for Singpass forms
   * @param code authorisation code
   * @returns okAsync(nric)
   * @returns errAsync(InvalidIdTokenError) if failed to retrieve NRIC
   */
  exchangeAuthCodeAndRetrieveData(
    code: string,
  ): ResultAsync<string, InvalidIdTokenError> {
    const logMeta = {
      action: 'exchangeAuthCodeAndRetrieveData',
    }

    return ResultAsync.fromPromise(
      this.oidcClient
        .exchangeAuthCodeAndDecodeVerifyToken(code)
        .then((decodedVerifiedToken) => {
          return this.oidcClient.extractNricFromIdToken(decodedVerifiedToken)
        })
        .then((result) => {
          if (result instanceof Error) {
            return Promise.reject(result)
          }
          return result
        }),
      (error) => {
        logger.error({
          message: 'Failed to exchange auth code and retrieve nric',
          meta: logMeta,
          error,
        })
        return new ExchangeAuthTokenError()
      },
    )
  }

  getCookieDuration(rememberMe: boolean): number {
    return rememberMe
      ? this.oidcProps.cookieMaxAgePreserved
      : this.oidcProps.cookieMaxAge
  }

  /**
   * Creates a payload of SP user data based on attributes
   * @param attributes user data returned by SP from client
   * @param rememberMe Whether to enable longer duration for SingPass cookies
   * @return The payload
   */
  createJWTPayload(
    attributes: string,
    rememberMe: boolean,
  ): Result<JwtPayload, MissingAttributesError> {
    const userName = attributes
    return userName && typeof userName === 'string'
      ? ok({ userName, rememberMe })
      : err(new MissingAttributesError())
  }
}
