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
  MissingJwtError,
  VerifyJwtError,
} from './spcp.errors'
import { CpOidcClient, SpOidcClient } from './spcp.oidc.client'
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
export class SpcpOidcServiceClass {
  #spcpOidcProps: Pick<
    ISpcpMyInfo,
    | 'spCookieMaxAge'
    | 'spCookieMaxAgePreserved'
    | 'spcpCookieDomain'
    | 'cpCookieMaxAge'
  >

  #spOidcClient: SpOidcClient
  #cpOidcClient: CpOidcClient

  constructor(props: ISpcpMyInfo) {
    this.#spOidcClient = new SpOidcClient({
      spOidcRpClientId: props.spOidcRpClientId,
      spOidcRpRedirectUrl: props.spOidcRpRedirectUrl,
      spOidcNdiDiscoveryEndpoint: props.spOidcNdiDiscoveryEndpoint,
      spOidcNdiJwksEndpoint: props.spOidcNdiJwksEndpoint,
      spOidcRpPublicJwks: JSON.parse(
        fs.readFileSync(props.spOidcRpJwksPublicPath).toString(),
      ),
      spOidcRpSecretJwks: JSON.parse(
        fs.readFileSync(props.spOidcRpJwksSecretPath).toString(),
      ),
    })

    this.#cpOidcClient = new CpOidcClient({
      cpOidcRpClientId: props.cpOidcRpClientId,
      cpOidcRpRedirectUrl: props.cpOidcRpRedirectUrl,
      cpOidcNdiDiscoveryEndpoint: props.cpOidcNdiDiscoveryEndpoint,
      cpOidcNdiJwksEndpoint: props.cpOidcNdiJwksEndpoint,
      cpOidcRpPublicJwks: JSON.parse(
        fs.readFileSync(props.cpOidcRpJwksPublicPath).toString(),
      ),
      cpOidcRpSecretJwks: JSON.parse(
        fs.readFileSync(props.cpOidcRpJwksSecretPath).toString(),
      ),
    })

    this.#spcpOidcProps = {
      spCookieMaxAge: props.spCookieMaxAge,
      cpCookieMaxAge: props.cpCookieMaxAge,
      spCookieMaxAgePreserved: props.spCookieMaxAgePreserved,
      spcpCookieDomain: props.spcpCookieDomain,
    }
  }

  /**
   * Retrieve the correct client.
   * @param authType FormAuthType.SP or FormAuthType.CP
   * @returns spOidcClient or cpOidcClient
   */
  getClient(
    authType: FormAuthType.SP | FormAuthType.CP,
  ): SpOidcClient | CpOidcClient {
    if (authType === FormAuthType.SP) {
      return this.#spOidcClient
    } else {
      return this.#cpOidcClient
    }
  }

  /**
   * Create the URL to which the client should be redirected for Singpass/Corppass OIDC login.
   * @param state - contains formId, remember me, and stored queryId
   * @param esrvcId SP/CP OIDC e-service ID
   * @param authType FormAuthType.SP or FormAuthType.CP
   * @returns okAsync(redirectUrl)
   * @returns errAsync(CreateRedirectUrlError)
   */
  createRedirectUrl(
    state: string,
    esrvcId: string,
    authType: FormAuthType.SP | FormAuthType.CP,
  ): ResultAsync<string, CreateRedirectUrlError> {
    const logMeta = {
      action: 'createRedirectUrl',
      state,
      esrvcId,
      authType,
    }

    const client = this.getClient(authType)

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
   * @param authType FormAuthType.SP or FormAuthType.CP
   * @returns ok(cookie)
   * @returns err(missingJwtError) if the SP/CP JWT does not exist
   */
  extractJwt(
    cookies: SpcpCookies,
    authType: FormAuthType.SP | FormAuthType.CP,
  ): Result<string, MissingJwtError> {
    const jwtName = authType === FormAuthType.SP ? JwtName.SP : JwtName.CP
    const cookie = cookies[jwtName]
    return cookie ? ok(cookie) : err(new MissingJwtError())
  }

  /**
   * Verifies a Singpass JWT and extracts its payload.
   * @param jwt The contents of the JWT cookie
   * @returns ok(Singpass JWT payload)
   * @returns err(VerifyJwtError) if JWT verification failed
   * @returns err(InvalidJwtError) if JWT has invalid shape
   */
  extractSingpassJwtPayload(
    jwt: string,
  ): ResultAsync<
    SingpassJwtPayloadFromCookie,
    VerifyJwtError | InvalidJwtError
  > {
    const logMeta = {
      action: 'extractSingpassJwtPayload',
    }

    const result = ResultAsync.fromPromise(
      this.#spOidcClient.verifyJwt(jwt),
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
   * Verifies a Corppass JWT and extracts its payload.
   * @param jwt The contents of the JWT cookie
   * @returns ok(Corppass JWT payload)
   * @returns err(VerifyJwtError) if JWT verification failed
   * @returns err(InvalidJwtError) if JWT has invalid shape
   */
  extractCorppassJwtPayload(
    jwt: string,
  ): ResultAsync<
    CorppassJwtPayloadFromCookie,
    VerifyJwtError | InvalidJwtError
  > {
    const logMeta = {
      action: 'extractCorppassJwtPayload',
    }

    const result = ResultAsync.fromPromise(
      this.#cpOidcClient.verifyJwt(jwt),
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
   * Gets the sp/cp session info from the cookies
   * @param cookies The sp/cp cookies set by the redirect
   * @param authType FormAuthType.SP or FormAuthType.CP
   * @return ok(jwtPayload) if successful
   * @return err(MissingJwtError) if the specified cookie does not exist
   * @return err(VerifyJwtError) if the jwt exists but could not be authenticated
   * @return err(InvalidJwtError) if the jwt exists but the payload is invalid
   */
  extractJwtPayloadFromRequest(
    cookies: SpcpCookies,
    authType: FormAuthType.SP | FormAuthType.CP,
  ): ResultAsync<
    JwtPayloadFromCookie,
    VerifyJwtError | InvalidJwtError | MissingJwtError
  > {
    return this.extractJwt(cookies, authType).asyncAndThen((jwtResult) => {
      switch (authType) {
        case FormAuthType.SP:
          return this.extractSingpassJwtPayload(jwtResult)
        case FormAuthType.CP:
          return this.extractCorppassJwtPayload(jwtResult)
      }
    })
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
      this.#spOidcClient
        .exchangeAuthCodeAndDecodeVerifyToken(code)
        .then((decodedVerifiedToken) => {
          return this.#spOidcClient.extractNricFromIdToken(decodedVerifiedToken)
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
      this.#cpOidcClient
        .exchangeAuthCodeAndDecodeVerifyToken(code)
        .then((decodedVerifiedToken) => {
          return {
            userInfo:
              this.#cpOidcClient.extractNricFromIdToken(decodedVerifiedToken),
            userName:
              this.#cpOidcClient.extractCPEntityIdFromIdToken(
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

  /**
   * Method to parse state and extract formId, destination, rememberMe setting, cookie duration
   * @param state
   * @param authType FormAuthType.SP | FormAuthType.CP
   * @returns ok(ParsedSpcpParams)
   * @returns err(InvalidStateError)
   */
  parseState(
    state: string,
    authType: FormAuthType.SP | FormAuthType.CP,
  ): Result<ParsedSpcpParams, InvalidStateError> {
    const logMeta = {
      action: 'parseState',
      state,
      authType,
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

    let cookieDuration
    if (authType === FormAuthType.CP) {
      cookieDuration = this.#spcpOidcProps.cpCookieMaxAge
    } else {
      cookieDuration = rememberMe
        ? this.#spcpOidcProps.spCookieMaxAgePreserved
        : this.#spcpOidcProps.spCookieMaxAge
    }

    return ok({
      formId,
      destination,
      rememberMe,
      cookieDuration,
    })
  }

  /**
   * Creates a JWT with a payload of SP user data.
   * @param payload Information to add to JWT
   * @param authType FormAuthType.SP | FormAuthType.CP
   * @param cookieDuration Cookie validity duration
   * @return okAsync(The JWT in a string)
   * @return errAsync(CreateJwtError)
   */
  createJWT(
    payload: JwtPayload,
    cookieDuration: number,
    authType: FormAuthType.SP | FormAuthType.CP,
  ): ResultAsync<string, CreateJwtError> {
    const logMeta = {
      action: 'createJWT',
      authType,
    }

    const client = this.getClient(authType)

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
    const spcpCookieDomain = this.#spcpOidcProps.spcpCookieDomain
    return spcpCookieDomain ? { domain: spcpCookieDomain, path: '/' } : {}
  }
}

export const SpcpOidcService = new SpcpOidcServiceClass(spcpMyInfoConfig)
