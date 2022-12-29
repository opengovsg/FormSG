import { SgidClient } from '@opengovsg/sgid-client'
import fs from 'fs'
import Jwt from 'jsonwebtoken'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import { ISgidVarsSchema } from '../../../types'
import { sgid } from '../../config/features/sgid.config'
import { createLoggerWithLabel } from '../../config/logger'
import { ApplicationError } from '../core/core.errors'

import {
  SgidCreateRedirectUrlError,
  SgidFetchAccessTokenError,
  SgidFetchUserInfoError,
  SgidInvalidJwtError,
  SgidInvalidStateError,
  SgidMissingJwtError,
  SgidVerifyJwtError,
} from './sgid.errors'
import { isSgidJwtPayload } from './sgid.util'

const logger = createLoggerWithLabel(module)

const JWT_ALGORITHM = 'RS256'
export const SGID_SCOPES = 'openid myinfo.nric_number'

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
    ...sgidOptions
  }: ISgidVarsSchema) {
    this.privateKey = fs.readFileSync(privateKeyPath, { encoding: 'utf8' })
    this.client = new SgidClient({
      // If hostname is empty, use the default provided by sgid-client.
      hostname: hostname || undefined,
      ...sgidOptions,
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
   * @param encodedQuery base64 encoded queryId for frontend to retrieve stored query params (usually contains prefilled form information)
   * for an extended period of time
   */
  createRedirectUrl(
    formId: string,
    rememberMe: boolean,
    encodedQuery?: string,
  ): Result<string, SgidCreateRedirectUrlError> {
    const state = encodedQuery
      ? `${formId},${rememberMe},${encodedQuery}`
      : `${formId},${rememberMe}`
    const logMeta = {
      action: 'createRedirectUrl',
      state,
    }
    const result = this.client.authorizationUrl(state, SGID_SCOPES, null)
    if (typeof result.url === 'string') {
      return ok(result.url)
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
  ): ResultAsync<
    { sub: string; accessToken: string },
    SgidFetchAccessTokenError
  > {
    return ResultAsync.fromPromise(
      this.client.callback(code, null),
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
   * user's NRIC number and proxy id
   * @param accessToken - the access token
   */
  retrieveUserInfo({
    accessToken,
  }: {
    accessToken: string
  }): ResultAsync<
    { sub: string; data: { 'myinfo.nric_number': string } },
    SgidFetchUserInfoError
  > {
    return ResultAsync.fromPromise(
      this.client.userinfo(accessToken).then(({ sub, data }) => ({
        sub,
        data: { 'myinfo.nric_number': data['myinfo.nric_number'] },
      })),
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
  createJwt(
    data: { 'myinfo.nric_number': string },
    rememberMe: boolean,
  ): Result<{ jwt: string; maxAge: number }, ApplicationError> {
    const userName = data['myinfo.nric_number']
    const payload = { userName, rememberMe }
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
   * Verifies a sgID JWT and extracts its payload.
   * @param jwtSgid The contents of the JWT cookie
   */
  extractSgidJwtPayload(
    jwtSgid: string,
  ): Result<
    { userName: string },
    SgidVerifyJwtError | SgidInvalidJwtError | SgidMissingJwtError
  > {
    const logMeta = {
      action: 'extractSgidJwtPayload',
    }
    try {
      if (!jwtSgid) {
        return err(new SgidMissingJwtError())
      }

      const payload = Jwt.verify(jwtSgid, this.publicKey, {
        algorithms: [JWT_ALGORITHM],
      })

      if (isSgidJwtPayload(payload)) {
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
