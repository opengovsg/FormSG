import { err, ok, Result, ResultAsync } from 'neverthrow'

import { FormAuthType } from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import {
  CreateJwtError,
  CreateRedirectUrlError,
  InvalidIdTokenError,
  InvalidJwtError,
  InvalidStateError,
  MissingAttributesError,
  MissingJwtError,
  VerifyJwtError,
} from '../spcp.errors'
import { SpcpOidcBaseClient } from '../spcp.oidc.client'
import {
  CorppassJwtPayloadFromCookie,
  ExtractedNDIPayload,
  JwtName,
  JwtPayload,
  JwtPayloadFromCookie,
  ParsedSpcpParams,
  SingpassJwtPayloadFromCookie,
  SpcpCookies,
  SpcpDomainSettings,
} from '../spcp.types'
import { extractFormId } from '../spcp.util'

import { SpcpOidcProps } from './spcp.oidc.service.types'

const logger = createLoggerWithLabel(module)

/**
 * Class for executing Singpass/Corppass OIDC-related services.
 * Exported for testing.
 */
export abstract class SpcpOidcServiceClass {
  abstract authType: FormAuthType
  abstract jwtName: JwtName

  abstract oidcClient: SpcpOidcBaseClient
  abstract oidcProps: SpcpOidcProps

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
  ): ResultAsync<
    CorppassJwtPayloadFromCookie | SingpassJwtPayloadFromCookie,
    VerifyJwtError | InvalidJwtError
  >

  abstract getCookieDuration(rememberMe: boolean): number

  abstract exchangeAuthCodeAndRetrieveData(
    code: string,
  ): ResultAsync<ExtractedNDIPayload, InvalidIdTokenError>

  abstract createJWTPayload(
    attributes: ExtractedNDIPayload,
    rememberMe: boolean,
  ): Result<JwtPayload, MissingAttributesError>

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
