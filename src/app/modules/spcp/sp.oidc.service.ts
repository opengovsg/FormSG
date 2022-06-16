import fs from 'fs'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  ISpcpMyInfo,
  spcpMyInfoConfig,
} from '../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../config/logger'

import { SpOidcClient } from './sp.oidc.client'
import { PublicJwks } from './sp.oidc.client.types'
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
import {
  JwtName,
  JwtPayload,
  JwtPayloadFromCookie,
  ParsedSpcpParams,
  SingpassJwtPayloadFromCookie,
  SpcpCookies,
  SpcpDomainSettings,
} from './spcp.types'
import { extractFormId, isSingpassJwtPayload } from './spcp.util'

const logger = createLoggerWithLabel(module)

/**
 * Class for executing Singpass OIDC-related services.
 * Exported for testing.
 */
export class SpOidcServiceClass {
  #spOidcProps: ISpcpMyInfo
  #spOidcClient: SpOidcClient

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
    this.#spOidcProps = props
  }

  /**
   * Create the URL to which the client should be redirected for Singpass OIDC login.
   * @param state - contains formId, remember me, and stored queryId
   * @param esrvcId SP OIDC e-service ID
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
    }

    return ResultAsync.fromPromise(
      this.#spOidcClient.createAuthorisationUrl(state, esrvcId),
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
   * Extracts the SP JWT from an object containing cookies
   * @param cookies Object containing cookies
   * @returns ok(cookie)
   * @returns err(missingJwtError) if the SP JWT does not exist
   */
  extractJwt(cookies: SpcpCookies): Result<string, MissingJwtError> {
    const jwtName = JwtName.SP
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
   * Gets the sp session info from the cookies
   * @param cookies The sp cookies set by the redirect
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
      return this.extractSingpassJwtPayload(jwtResult)
    })
  }

  /**
   * Method to exchange auth code for decrypted and verified idToken and then extract NRIC
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
          action: 'parseOOBParams',
          encodedQuery,
        },
        error: e,
      })
      return err(new InvalidStateError())
    }

    const destination = `${payloads[0]}${decodedQuery}`

    const cookieDuration = rememberMe
      ? this.#spOidcProps.spCookieMaxAgePreserved
      : this.#spOidcProps.spCookieMaxAge

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
    }

    return ResultAsync.fromPromise(
      this.#spOidcClient.createJWT(
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
    const spcpCookieDomain = this.#spOidcProps.spcpCookieDomain
    return spcpCookieDomain ? { domain: spcpCookieDomain, path: '/' } : {}
  }

  /**
   * Gets the RP's public JWKS
   */
  getRpPublicJwks(): PublicJwks {
    return this.#spOidcClient.rpPublicJwks
  }
}

export const SpOidcService = new SpOidcServiceClass(spcpMyInfoConfig)
