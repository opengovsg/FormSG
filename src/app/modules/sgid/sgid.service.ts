import { SgidClient } from '@opengovsg/sgid-client'
import fs from 'fs'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import { sgid } from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { ApplicationError } from '../core/core.errors'

import {
  SgidCreateRedirectUrlError,
  SgidFetchAccessTokenError,
  SgidFetchUserInfoError,
  SgidInvalidJwtError,
  SgidInvalidStateError,
  SgidVerifyJwtError,
} from './sgid.errors'
import { isSgidJwtPayload } from './sgid.util'

const logger = createLoggerWithLabel(module)

export class SgidService {
  private client: SgidClient

  private publicKey: string | Buffer

  private cookieDomain: string
  private cookieMaxAge: number
  private cookieMaxAgePreserved: number

  constructor({
    cookieDomain,
    cookieMaxAge,
    cookieMaxAgePreserved,
    privateKey,
    publicKey,
    ...sgidOptions
  }: {
    endpoint: string
    clientId: string
    clientSecret: string
    privateKey: string
    publicKey: string
    redirectUri: string
    cookieDomain: string
    cookieMaxAge: number
    cookieMaxAgePreserved: number
  }) {
    this.client = new SgidClient({
      ...sgidOptions,
      privateKey: fs.readFileSync(privateKey),
    })
    this.publicKey = fs.readFileSync(publicKey)
    this.cookieDomain = cookieDomain
    this.cookieMaxAge = cookieMaxAge
    this.cookieMaxAgePreserved = cookieMaxAgePreserved
  }

  createRedirectUrl(state: string): Result<string, SgidCreateRedirectUrlError> {
    const logMeta = {
      action: 'createRedirectUrl',
      state,
    }
    const result = this.client.authorizationUrl(state)
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

  parseState(
    state: string,
  ): Result<{ formId: string; rememberMe: boolean }, SgidInvalidStateError> {
    const [formId, rememberMeStr] = state.split(',')
    const rememberMe = rememberMeStr === 'true'
    return formId
      ? ok({ formId, rememberMe })
      : err(new SgidInvalidStateError())
  }

  token(
    code: string,
  ): ResultAsync<
    { sub: string; accessToken: string },
    SgidFetchAccessTokenError
  > {
    return ResultAsync.fromPromise(this.client.callback(code), (error) => {
      logger.error({
        message: 'Failed to retrieve access token from sgID',
        meta: {
          action: 'token',
          code,
        },
        error,
      })
      return new SgidFetchAccessTokenError()
    })
  }

  userInfo({
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

  createJWT(
    data: { 'myinfo.nric_number': string },
    rememberMe: boolean,
  ): Result<{ jwt: string; maxAge: number }, ApplicationError> {
    const userName = data['myinfo.nric_number']
    const payload = { userName, rememberMe }
    const maxAge = rememberMe ? this.cookieMaxAgePreserved : this.cookieMaxAge
    return ok({
      jwt: this.client.createJWT(payload, maxAge / 1000),
      maxAge,
    })
  }

  /**
   * Verifies a sgID JWT and extracts its payload.
   * @param jwtSgid The contents of the JWT cookie
   */
  extractJWTInfo(
    jwtSgid: string,
  ): Result<{ userName: string }, SgidVerifyJwtError | SgidInvalidJwtError> {
    const logMeta = {
      action: 'extractSingpassJwtPayload',
    }
    try {
      const payload = this.client.verifyJWT(jwtSgid, this.publicKey)

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

export const sgidService = new SgidService(sgid)
