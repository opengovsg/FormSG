import { generatePkcePair, SgidClient } from '@opengovsg/sgid-client'
import fs from 'fs'
import Jwt from 'jsonwebtoken'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import { MyInfoAttribute as InternalAttr } from '../../../../shared/types'
import { ISgidVarsSchema } from '../../../types'
import { sgid } from '../../config/features/sgid.config'
import { createLoggerWithLabel } from '../../config/logger'
import { ApplicationError } from '../core/core.errors'

import { internalAttrListToScopes } from './sgid.adapter'
import {
  SgidCreateRedirectUrlError,
  SgidFetchAccessTokenError,
  SgidFetchUserInfoError,
  SgidInvalidJwtError,
  SgidInvalidStateError,
  SgidMissingJwtError,
  SgidVerifyJwtError,
} from './sgid.errors'
import {
  SGIDJwtAccessPayload,
  SGIDJwtSingpassPayload,
  SGIDJwtVerifierFunction,
  SGIDScopeToValue,
} from './sgid.types'
import { isSgidJwtAccessPayload, isSgidJwtSingpassPayload } from './sgid.util'

const logger = createLoggerWithLabel(module)

const JWT_ALGORITHM = 'RS256'

export class SgidServiceClass {
  private client: SgidClient

  private publicKey: string | Buffer
  private privateKey: string

  private cookieDomain: string
  private cookieMaxAge: number
  private cookieMaxAgePreserved: number

  constructor({
    cookieDomain,
    cookieMaxAge,
    cookieMaxAgePreserved,
    privateKeyPath,
    publicKeyPath,
    hostname,
    formLoginRedirectUri: redirectUri,
    clientId,
    clientSecret,
  }: ISgidVarsSchema) {
    this.privateKey = fs.readFileSync(privateKeyPath, { encoding: 'utf8' })
    this.client = new SgidClient({
      // If hostname is empty, use the default provided by sgid-client.
      hostname: hostname || undefined,
      clientId,
      clientSecret,
      redirectUri,
      privateKey: this.privateKey,
    })
    this.publicKey = fs.readFileSync(publicKeyPath)
    this.cookieDomain = cookieDomain
    this.cookieMaxAge = cookieMaxAge
    this.cookieMaxAgePreserved = cookieMaxAgePreserved
  }

  /**
   * Create a URL to sgID which is used to redirect the user for authentication
   * @param formId - the form id to redirect to after authentication
   * @param rememberMe - whether we create a JWT that remembers the user
   * @param requestedAttributes - sgID attributes requested by this form
   * @param encodedQuery base64 encoded queryId for frontend to retrieve stored query params (usually contains prefilled form information)
   * for an extended period of time
   * @returns The redirectUrl and the associated code verifier
   */
  createRedirectUrl(
    formId: string,
    rememberMe: boolean,
    requestedAttributes: InternalAttr[],
    encodedQuery?: string,
  ): Result<
    { redirectUrl: string; codeVerifier: string },
    SgidCreateRedirectUrlError
  > {
    const state = encodedQuery
      ? `${formId},${rememberMe},${encodedQuery}`
      : `${formId},${rememberMe}`

    const logMeta = {
      action: 'createRedirectUrl',
      state,
    }
    const scopes = internalAttrListToScopes(requestedAttributes)
    const { codeChallenge, codeVerifier } = generatePkcePair()
    const result = this.client.authorizationUrl({
      state,
      scope: scopes,
      nonce: null,
      codeChallenge,
    })
    if (typeof result.url === 'string') {
      return ok({ redirectUrl: result.url, codeVerifier })
    } else {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: logMeta,
        error: result,
      })
      return err(new SgidCreateRedirectUrlError())
    }
  }

  /**
   * Parses the string serialization containing the form id and if the
   * user should be remembered, both needed when redirecting the user back to
   * the form post-authentication
   * @param state - a comma-separated string of the form id, a boolean flag
   * indicating if the user should be remembered, and an optional encodedQuery
   * @returns {Result<{ formId: string; rememberMe: boolean; decodedQuery?: string }, SgidInvalidStateError>}
   */
  parseState(
    state: string,
  ): Result<
    { formId: string; rememberMe: boolean; decodedQuery: string },
    SgidInvalidStateError
  > {
    const payloads = state.split(',')
    const formId = payloads[0]
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
      return err(new SgidInvalidStateError())
    }

    return formId
      ? ok({ formId, rememberMe, decodedQuery })
      : err(new SgidInvalidStateError())
  }

  /**
   * Given the OIDC authorization code from sgID, obtain the corresponding
   * access token, which will be used later to retrieve user information
   * @param code - the authorization code
   */
  retrieveAccessToken(
    code: string,
    codeVerifier: string,
  ): ResultAsync<
    { sub: string; accessToken: string },
    SgidFetchAccessTokenError
  > {
    return ResultAsync.fromPromise(
      this.client.callback({ code, nonce: null, codeVerifier }),
      (error) => {
        logger.error({
          message: 'Failed to retrieve access token from sgID',
          meta: {
            action: 'token',
            code,
          },
          error,
        })
        return new SgidFetchAccessTokenError()
      },
    )
  }

  /**
   * Given the OIDC access token from sgID, obtain the
   * user's information (depending on OAuth scopes
   * associated with the accessToken) and proxy id
   * @param accessToken - the access token
   */
  retrieveUserInfo({
    accessToken,
    sub,
  }: {
    accessToken: string
    sub: string
  }): ResultAsync<
    { sub: string; data: SGIDScopeToValue },
    SgidFetchUserInfoError
  > {
    return ResultAsync.fromPromise(
      this.client.userinfo({ accessToken, sub }).then(({ sub, data }) => {
        return {
          sub,
          data,
        }
      }),
      (error) => {
        logger.error({
          message: 'Failed to retrieve user info from sgID',
          meta: {
            action: 'userInfo',
            accessToken,
          },
          error,
        })
        return new SgidFetchUserInfoError()
      },
    )
  }

  /**
   * Create a JWT based on the userinfo from sgID
   * @param data - the userinfo as obtained from sgID
   * @param rememberMe - determines how long the JWT is valid for
   */
  createSgidSingpassJwt(
    data: { 'myinfo.nric_number': string },
    rememberMe: boolean,
  ): Result<{ jwt: string; maxAge: number }, ApplicationError> {
    const userName = data['myinfo.nric_number']
    const payload: SGIDJwtSingpassPayload = { userName, rememberMe }
    const maxAge = rememberMe ? this.cookieMaxAgePreserved : this.cookieMaxAge
    const jwt = Jwt.sign(payload, this.privateKey, {
      algorithm: JWT_ALGORITHM,
      expiresIn: maxAge / 1000,
    })
    return ok({
      jwt,
      maxAge,
    })
  }

  /**
   * Create a JWT with access token from sgID
   *
   * This access token is then used to exchange for MyInfo data in the
   * public form controller.
   *
   * Unlike createSgidSingpassJwt, where the access token is exchanged for
   * userinfo upfront and userinfo (NRIC) is stored in the JWT.
   *
   * Note: sgID access token is tied to the sgID OAuth scopes requested.
   * @param accessToken - sgID access token
   */
  createSgidMyInfoJwt({
    sub,
    accessToken,
  }: {
    sub: string
    accessToken: string
  }): Result<{ jwt: string; maxAge: number; sub: string }, ApplicationError> {
    const payload: SGIDJwtAccessPayload = { accessToken }
    const maxAge = this.cookieMaxAge
    const jwt = Jwt.sign(payload, this.privateKey, {
      algorithm: JWT_ALGORITHM,
      expiresIn: maxAge / 1000,
    })
    return ok({
      sub,
      jwt,
      maxAge,
    })
  }

  /**
   * Verifies a sgID JWT and extracts its payload (Singpass userName).
   * @param jwtSgid The contents of the JWT cookie
   */
  extractSgidSingpassJwtPayload(
    jwtSgid: string,
  ): Result<
    SGIDJwtSingpassPayload,
    SgidVerifyJwtError | SgidInvalidJwtError | SgidMissingJwtError
  > {
    return this._extractSgidJwtGenericPayload<SGIDJwtSingpassPayload>(
      jwtSgid,
      'extractSgidJwtSingpassPayload',
      isSgidJwtSingpassPayload,
    )
  }

  /**
   * Verifies a sgID JWT and extracts its payload (access token).
   * @param jwtSgid The contents of the JWT cookie
   */
  extractSgidJwtMyInfoPayload(
    jwtSgid: string,
  ): Result<
    SGIDJwtAccessPayload,
    SgidVerifyJwtError | SgidInvalidJwtError | SgidMissingJwtError
  > {
    return this._extractSgidJwtGenericPayload<SGIDJwtAccessPayload>(
      jwtSgid,
      'extractSgidJwtAccessPayload',
      isSgidJwtAccessPayload,
    )
  }

  /**
   * Verifies a sgID JWT and extract its payload.
   * sgID JWT has two types/modes
   *   1. Simple auth mode (Singpass auth replacement).
   *   2. MyInfo access token mode (used to fill up MyInfo fields over sgID).
   * @param jwtSgid The contents of the JWT cookie.
   * @param action Name of the calling function.
   * @param verifier Function to verify the contents of the JWT
   * @returns
   */
  _extractSgidJwtGenericPayload<
    R extends SGIDJwtSingpassPayload | SGIDJwtAccessPayload,
  >(
    jwtSgid: string,
    action: string,
    verifier: SGIDJwtVerifierFunction<R>,
  ): Result<R, SgidVerifyJwtError | SgidInvalidJwtError | SgidMissingJwtError> {
    const logMeta = {
      action,
    }
    try {
      if (!jwtSgid) {
        return err(new SgidMissingJwtError())
      }

      const payload = Jwt.verify(jwtSgid, this.publicKey, {
        algorithms: [JWT_ALGORITHM],
      })

      if (verifier(payload)) {
        return ok(payload)
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
      return err(new SgidInvalidJwtError())
    } catch (error) {
      logger.error({
        message: 'Failed to verify JWT with auth client',
        meta: logMeta,
        error,
      })
      return err(new SgidVerifyJwtError())
    }
  }

  /**
   * Gets the cookie domain settings.
   */
  getCookieSettings():
    | { domain: string; path: string }
    | Record<string, never> {
    return this.cookieDomain ? { domain: this.cookieDomain, path: '/' } : {}
  }
}

export const SgidService = new SgidServiceClass(sgid)
