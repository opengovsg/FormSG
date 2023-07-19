import { SgidClient } from '@opengovsg/sgid-client'
import fs from 'fs'
import { ResultAsync } from 'neverthrow'

import { ISgidVarsSchema } from 'src/types'

import { sgid } from '../../../config/features/sgid.config'
import { createLoggerWithLabel } from '../../../config/logger'
import {
  SgidFetchAccessTokenError,
  SgidFetchUserInfoError,
} from '../../sgid/sgid.errors'
import { SGIDScopeToValue } from '../../sgid/sgid.types'

const logger = createLoggerWithLabel(module)

export class AuthSgidServiceClass {
  private client: SgidClient
  private privateKey: string

  constructor({ privateKeyPath, hostname, ...sgidOptions }: ISgidVarsSchema) {
    this.privateKey = fs.readFileSync(privateKeyPath, { encoding: 'utf8' })
    this.client = new SgidClient({
      // If hostname is empty, use the default provided by sgid-client.
      hostname: hostname || undefined,
      ...sgidOptions,
      privateKey: this.privateKey,
    })
  }

  createRedirectUrl() {
    return this.client.authorizationUrl(
      'icecream',
      'openid ogpofficerinfo.work_email',
      'icecream2',
    )
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
      this.client.callback(code, 'icecream2'),
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
  }: {
    accessToken: string
  }): ResultAsync<
    { sub: string; data: SGIDScopeToValue },
    SgidFetchUserInfoError
  > {
    return ResultAsync.fromPromise(
      this.client.userinfo(accessToken).then(({ sub, data }) => {
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
}

export const AuthSgidService = new AuthSgidServiceClass(sgid)
