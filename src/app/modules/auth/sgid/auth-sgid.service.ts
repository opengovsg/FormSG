import { SgidClient } from '@opengovsg/sgid-client'
import fs from 'fs'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import { ISgidVarsSchema } from 'src/types'

import { sgid } from '../../../config/features/sgid.config'
import { createLoggerWithLabel } from '../../../config/logger'
import {
  SgidCreateRedirectUrlError,
  SgidFetchAccessTokenError,
  SgidFetchUserInfoError,
} from '../../sgid/sgid.errors'

const logger = createLoggerWithLabel(module)

export const SGID_LOGIN_OAUTH_STATE = 'login'
const SGID_OGP_WORK_EMAIL_SCOPE = 'ogpofficerinfo.work_email'

export class AuthSgidServiceClass {
  private client: SgidClient
  private privateKey: string

  constructor({
    privateKeyPath,
    hostname,
    adminLoginRedirectUri: redirectUri,
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
  }

  /**
   * Create a URL to sgID which is used to redirect the user for authentication
   */
  createRedirectUrl(
    codeChallenge: string,
  ): Result<string, SgidCreateRedirectUrlError> {
    const logMeta = {
      action: 'createRedirectUrl',
    }

    try {
      const result = this.client.authorizationUrl({
        state: SGID_LOGIN_OAUTH_STATE,
        scope: ['openid', SGID_OGP_WORK_EMAIL_SCOPE].join(' '),
        nonce: null,
        codeChallenge,
      })
      return ok(result.url)
    } catch (error) {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: logMeta,
        error,
      })
      return err(new SgidCreateRedirectUrlError())
    }
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
            action: 'retrieveAccessToken',
            code,
          },
          error,
        })
        return new SgidFetchAccessTokenError()
      },
    )
  }

  /**
   * Given the OIDC access token from sgID, obtain the user's information
   * (depending on OAuth scopes associated with the accessToken)
   * @param accessToken - the access token
   * @returns the authenticated OGP user's email
   */
  retrieveUserInfo(
    accessToken: string,
    sub: string,
  ): ResultAsync<string, SgidFetchUserInfoError> {
    return ResultAsync.fromPromise(
      this.client
        .userinfo({ accessToken, sub })
        .then(({ data }) => data[SGID_OGP_WORK_EMAIL_SCOPE]),
      (error) => {
        logger.error({
          message: 'Failed to retrieve user info from sgID',
          meta: {
            action: 'retrieveUserInfo',
            accessToken,
          },
          error,
        })
        return new SgidFetchUserInfoError()
      },
    )
  }
}

export const AuthSgidService = new AuthSgidServiceClass(sgid)
