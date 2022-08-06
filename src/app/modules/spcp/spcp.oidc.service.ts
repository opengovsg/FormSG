import fs from 'fs'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import { FormAuthType } from '../../../../shared/types'
import {
  ISpcpMyInfo,
  spcpMyInfoConfig,
} from '../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../config/logger'

import {
  CreateJwtError,
  CreateRedirectUrlError,
  ExchangeAuthTokenError,
  InvalidIdTokenError,
  InvalidJwtError,
  InvalidStateError,
  MissingAttributesError,
  MissingJwtError,
  VerifyJwtError,
} from './spcp.errors'
import {
  CpOidcClient,
  SpcpOidcBaseClient,
  SpOidcClient,
} from './spcp.oidc.client'
import {
  CorppassJwtPayloadFromCookie,
  ExtractedCorppassNDIPayload,
  JwtName,
  JwtPayload,
  JwtPayloadFromCookie,
  ParsedSpcpParams,
  SingpassJwtPayloadFromCookie,
  SpcpCookies,
  SpcpDomainSettings,
} from './spcp.types'
import {
  extractFormId,
  isCorppassJwtPayload,
  isExtractedCorppassNDIPayload,
  isSingpassJwtPayload,
} from './spcp.util'

const logger = createLoggerWithLabel(module)

/**
 * Class for executing Singpass/Corppass OIDC-related services.
 * Exported for testing.
 */
export abstract class SpcpOidcServiceClass {
  authType = '-'
  jwtName = '-'
  oidcProps: {
    cookieMaxAge: number
    cookieMaxAgePreserved?: number
    cookieDomain?: string
  } = { cookieMaxAge: 3600 }

  oidcClient: SpcpOidcBaseClient

  constructor(oidcClient: SpcpOidcBaseClient) {
    this.oidcClient = oidcClient
  }

  /**
   * Retrieve the correct client.
   * @returns SpcpOidcBaseClient
   */
  getClient(): SpcpOidcBaseClient {
    return this.oidcClient
  }

  /**
   * Create the URL to which the client should be redirected for Singpass/Corppass OIDC login.
   * @param state - contains formId, remember me, and stored queryId
   * @param esrvcId SP/CP OIDC e-service ID
   * @returns okAsync(redirectUrl)
   * @returns errAsync(CreateRedirectUrlError)
   */
  createRedirectUrl(
    state: string,
    esrvcId: string,
  ): ResultAsync<string, CreateRedirectUrlError> {
    const logMeta = {
      action: 'createRedirectUrl',
      state,
      esrvcId,
      authType: this.authType,
    }

    const client = this.getClient()

    return ResultAsync.fromPromise(
      client.createAuthorisationUrl(state, esrvcId),
      (error) => {
        logger.error({
          message: 'Error while creating redirect URL',
          meta: logMeta,
          error,
        })
        return new CreateRedirectUrlError()
      },
    )
  }

  /**
   * Extracts the SP/CP JWT from an object containing cookies
   * @param cookies Object containing cookies
   * @returns ok(cookie)
   * @returns err(missingJwtError) if the SP/CP JWT does not exist
   */
  extractJwt(cookies: SpcpCookies): Result<string, MissingJwtError> {
    const cookie = cookies[this.jwtName]
    return cookie ? ok(cookie) : err(new MissingJwtError())
  }

  abstract extractJwtPayload(
    jwt: string,
  ): ResultAsync<any, VerifyJwtError | InvalidJwtError>

  abstract getCookieDuration(rememberMe: boolean): number

  /**
   * Gets the sp/cp session info from the cookies
   * @param cookies The sp/cp cookies set by the redirect
   * @return ok(jwtPayload) if successful
   * @return err(MissingJwtError) if the specified cookie does not exist
   * @return err(VerifyJwtError) if the jwt exists but could not be authenticated
   * @return err(InvalidJwtError) if the jwt exists but the payload is invalid
   */
  extractJwtPayloadFromRequest(
    cookies: SpcpCookies,
  ): ResultAsync<
    JwtPayloadFromCookie,
    VerifyJwtError | InvalidJwtError | MissingJwtError
  > {
    return this.extractJwt(cookies).asyncAndThen((jwtResult) => {
      return this.extractJwtPayload(jwtResult)
    })
  }

  /**
   * Method to parse state and extract formId, destination, rememberMe setting, cookie duration
   * @param state
   * @returns ok(ParsedSpcpParams)
   * @returns err(InvalidStateError)
   */
  parseState(state: string): Result<ParsedSpcpParams, InvalidStateError> {
    const logMeta = {
      action: 'parseState',
      state,
    }
    const payloads = state.split('-')
    const formId = extractFormId(payloads[0])
    if ((payloads.length !== 2 && payloads.length !== 3) || !formId) {
      logger.error({
        message: 'state incorrectly formatted',
        meta: logMeta,
      })
      return err(new InvalidStateError())
    }

    const rememberMe = payloads[1] === 'true'
    const encodedQuery = payloads.length === 3 ? payloads[2] : ''
    let decodedQuery = ''

    try {
      decodedQuery = encodedQuery
        ? `?${Buffer.from(encodedQuery, 'base64').toString('utf8')}`
        : ''
    } catch (e) {
      logger.error({
        message: 'Unable to decode encodedQuery',
        meta: {
          encodedQuery,
          ...logMeta,
        },
        error: e,
      })
      return err(new InvalidStateError())
    }

    const destination = `${payloads[0]}${decodedQuery}`

    return ok({
      formId,
      destination,
      rememberMe,
      cookieDuration: this.getCookieDuration(rememberMe),
    })
  }

  /**
   * Creates a JWT with a payload of SP user data.
   * @param payload Information to add to JWT
   * @param cookieDuration Cookie validity duration
   * @return okAsync(The JWT in a string)
   * @return errAsync(CreateJwtError)
   */
  createJWT(
    payload: JwtPayload,
    cookieDuration: number,
  ): ResultAsync<string, CreateJwtError> {
    const logMeta = {
      action: 'createJWT',
      authType: this.authType,
    }

    const client = this.getClient()

    return ResultAsync.fromPromise(
      client.createJWT(
        payload,
        `${cookieDuration / 1000}s`,
        // Sets "exp" (Expiration Time) Claim value on the JWT Claims Set. When number is passed that is used as a value
        // When string is passed it is resolved to a time span and added to the current timestamp.
      ),
      (error) => {
        logger.error({
          message: 'Failed to create JWT',
          meta: {
            ...logMeta,
          },
          error,
        })
        return new CreateJwtError()
      },
    )
  }

  /**
   * Gets the cookie domain settings.
   */
  getCookieSettings(): SpcpDomainSettings {
    const cookieDomain = this.oidcProps.cookieDomain
    return cookieDomain ? { domain: cookieDomain, path: '/' } : {}
  }
}

export class SpOidcServiceClass extends SpcpOidcServiceClass {
  authType = FormAuthType.SP
  jwtName = JwtName.SP
  oidcProps: {
    cookieMaxAge: number
    cookieMaxAgePreserved: number
    cookieDomain: string
  }

  constructor(props: ISpcpMyInfo) {
    super(
      new SpOidcClient({
        rpClientId: props.spOidcRpClientId,
        rpRedirectUrl: props.spOidcRpRedirectUrl,
        ndiDiscoveryEndpoint: props.spOidcNdiDiscoveryEndpoint,
        ndiJwksEndpoint: props.spOidcNdiJwksEndpoint,
        rpPublicJwks: JSON.parse(
          fs.readFileSync(props.spOidcRpJwksPublicPath).toString(),
        ),
        rpSecretJwks: JSON.parse(
          fs.readFileSync(props.spOidcRpJwksSecretPath).toString(),
        ),
      }),
    )

    this.oidcProps = {
      cookieMaxAge: props.spCookieMaxAge,
      cookieMaxAgePreserved: props.spCookieMaxAgePreserved,
      cookieDomain: props.spcpCookieDomain,
    }
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
  exchangeAuthCodeAndRetrieveNric(
    code: string,
  ): ResultAsync<string, InvalidIdTokenError> {
    const logMeta = {
      action: 'exchangeAuthCodeAndRetrieveNric',
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

  getCookieDuration(rememberMe: boolean) {
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

export class CpOidcServiceClass extends SpcpOidcServiceClass {
  authType = FormAuthType.CP
  jwtName = JwtName.CP
  oidcClient: CpOidcClient // typescript error is invalid, assignment is done in super constructor :'(
  oidcProps: {
    cookieMaxAge: number
  }

  constructor(props: ISpcpMyInfo) {
    super(
      new CpOidcClient({
        rpClientId: props.cpOidcRpClientId,
        rpRedirectUrl: props.cpOidcRpRedirectUrl,
        ndiDiscoveryEndpoint: props.cpOidcNdiDiscoveryEndpoint,
        ndiJwksEndpoint: props.cpOidcNdiJwksEndpoint,
        rpPublicJwks: JSON.parse(
          fs.readFileSync(props.cpOidcRpJwksPublicPath).toString(),
        ),
        rpSecretJwks: JSON.parse(
          fs.readFileSync(props.cpOidcRpJwksSecretPath).toString(),
        ),
      }),
    )

    this.oidcProps = {
      cookieMaxAge: props.cpCookieMaxAge,
    }
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
  exchangeAuthCodeAndRetrieveNricEntID(
    code: string,
  ): ResultAsync<ExtractedCorppassNDIPayload, InvalidIdTokenError> {
    const logMeta = {
      action: 'exchangeAuthCodeAndRetrieveNricEntID',
    }

    return ResultAsync.fromPromise(
      this.oidcClient
        .exchangeAuthCodeAndDecodeVerifyToken(code)
        .then((decodedVerifiedToken) => {
          return {
            userInfo:
              this.oidcClient.extractNricFromIdToken(decodedVerifiedToken),
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

  getCookieDuration() {
    return this.oidcProps.cookieMaxAge
  }

  /**
   * Creates a payload of SP/CP user data based on attributes
   * @param attributes user data returned by SP/CP from client
   * @param rememberMe Whether to enable longer duration for SingPass cookies
   * @return The payload
   */
  createJWTPayload(
    attributes: ExtractedCorppassNDIPayload,
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

export const SpOidcService = new SpOidcServiceClass(spcpMyInfoConfig)
export const CpOidcService = new CpOidcServiceClass(spcpMyInfoConfig)
