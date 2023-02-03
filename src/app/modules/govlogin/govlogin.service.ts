import { GovLoginClient } from '@opengovsg/gov-login-client'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import { IGovLoginVarsSchema } from '../../../types'
import { govlogin } from '../../config/features/govlogin.config'
import { createLoggerWithLabel } from '../../config/logger'

import {
  GovLoginCreateRedirectUrlError,
  GovLoginFetchAccessTokenError,
} from './govlogin.errors'

const logger = createLoggerWithLabel(module)

export const GOVLOGIN_SCOPES = 'openid'

export class GovLoginServiceClass {
  private client: GovLoginClient

  constructor({ hostname, ...govLoginOptions }: IGovLoginVarsSchema) {
    this.client = new GovLoginClient({
      // If hostname is empty, use the default provided by gov-login-client.
      hostname,
      ...govLoginOptions,
    })
  }

  /**
   * Create a URL to govLogin which is used to redirect the user for authentication.
   */
  createRedirectUrl(): Result<string, GovLoginCreateRedirectUrlError> {
    const logMeta = {
      action: 'createRedirectUrl',
    }
    const result = this.client.authorizationUrl('', GOVLOGIN_SCOPES, null)
    if (typeof result.url === 'string') {
      return ok(result.url)
    } else {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: logMeta,
        error: result,
      })
      return err(new GovLoginCreateRedirectUrlError())
    }
  }

  /**
   * Given the OIDC authorization code from govlogin, obtain the corresponding
   * `accessToken`, and `sub` which is the SSO email.
   * @param code - the authorization code
   */
  retrieveAccessToken(
    code: string,
  ): ResultAsync<
    { sub: string; accessToken: string },
    GovLoginFetchAccessTokenError
  > {
    return ResultAsync.fromPromise(
      this.client.callback(code, null),
      (error) => {
        logger.error({
          message: 'Failed to retrieve access token from GovLogin',
          meta: {
            action: 'token',
            code,
          },
          error,
        })
        return new GovLoginFetchAccessTokenError()
      },
    )
  }
}

export const GovLoginService = new GovLoginServiceClass(govlogin)
