import { okAsync, ResultAsync } from 'neverthrow'
import { getValidatedIdTokenClaims } from 'oauth4webapi'
import * as oidcClient from 'openid-client'

import { isDev } from 'src/app/config/config'
import { sso } from 'src/app/config/features/sso.config'
import { ISsoVarsSchema } from 'src/types'

import { createLoggerWithLabel } from '../../../config/logger'

import { SsoCreateRedirectUrlError } from './auth-sso.error'

const logger = createLoggerWithLabel(module)
export const SSO_LOGIN_OAUTH_STATE = 'ssoLogin'

export class AuthSsoServiceClass {
  private clientConfigPromise: Promise<oidcClient.Configuration>

  constructor({ discoveryUrl, clientId, clientSecret }: ISsoVarsSchema) {
    const clientAuth: oidcClient.ClientAuth | undefined = clientSecret
      ? oidcClient.ClientSecretPost(clientSecret)
      : undefined

    const clientDiscoveryRequestOptions: oidcClient.DiscoveryRequestOptions = {
      algorithm: 'oidc',
    }

    if (isDev) {
      clientDiscoveryRequestOptions.execute = [oidcClient.allowInsecureRequests]
    }

    this.clientConfigPromise = oidcClient.discovery(
      discoveryUrl,
      clientId,
      undefined, // clientMetadata,
      clientAuth,
      clientDiscoveryRequestOptions,
    )
  }

  getClientConfigResult(): ResultAsync<
    oidcClient.Configuration,
    SsoCreateRedirectUrlError
  > {
    const logMeta = {
      action: 'getClientConfigResult',
    }
    return ResultAsync.fromPromise(this.clientConfigPromise, (error) => {
      logger.error({
        message: 'Error while retrieving SSO client configuration',
        meta: logMeta,
        error,
      })
      return new SsoCreateRedirectUrlError()
    })
  }
  /**
   * Create a URL to SSO which is used to redirect the user for authentication
   * @returns The redirectUrl and the associated code verifier
   */
  createRedirectUrl(): ResultAsync<
    { redirectUrl: string; codeVerifier: string },
    SsoCreateRedirectUrlError
  > {
    const logMeta = {
      action: 'createRedirectUrl',
    }

    logger.info({
      message: `Starting sso login flow`,
      meta: logMeta,
    })

    const codeVerifier: string = oidcClient.randomPKCECodeVerifier()

    const codeChallengeResult = ResultAsync.fromPromise(
      oidcClient.calculatePKCECodeChallenge(codeVerifier),
      (error) => {
        logger.error({
          message: 'Error while calculating PKCE code challenge',
          meta: logMeta,
          error,
        })
        return new SsoCreateRedirectUrlError()
      },
    )
    return ResultAsync.combine([
      this.getClientConfigResult(),
      codeChallengeResult,
    ]).andThen(([clientConfig, codeChallenge]) => {
      const codeVerifier: string = oidcClient.randomPKCECodeVerifier()

      const nonce = oidcClient.randomNonce()

      const params: Record<string, string> = {
        code_challenge: codeChallenge,
        state: nonce,
        scope: ['openid', 'email'].join(' '),
        code_challenge_method: 'S256',
      }

      if (clientConfig.serverMetadata().supportsPKCE()) {
        params.state = nonce
      }

      const redirectTo: URL = oidcClient.buildAuthorizationUrl(
        clientConfig,
        params,
      )
      return okAsync({ redirectUrl: redirectTo.toString(), codeVerifier })
    })
  }

  retrieveAccessToken(
    codeVerifier: string,
    state: string,
    currentUrl: string,
  ): ResultAsync<oidcClient.TokenEndpointResponse, SsoCreateRedirectUrlError> {
    const logMeta = {
      action: 'retrieveAccessToken',
    }
    return this.getClientConfigResult().andThen((clientConfig) => {
      return ResultAsync.fromPromise(
        oidcClient.authorizationCodeGrant(
          clientConfig,
          new URL(currentUrl),
          {
            pkceCodeVerifier: codeVerifier,
            expectedState: state,
            idTokenExpected: true,
          },
          {},
          {},
        ),
        (error) => {
          logger.error({
            message: 'Error while retrieving access token from SSO',
            meta: logMeta,
            error,
          })
          return new SsoCreateRedirectUrlError()
        },
      )
    })
  }

  retrieveUserInfo(
    tokens: oidcClient.TokenEndpointResponse,
  ): ResultAsync<oidcClient.UserInfoResponse, SsoCreateRedirectUrlError> {
    const logMeta = {
      action: 'retrieveUserInfo',
    }

    logger.info({
      message: `Retrieving user info from SSO`,
      meta: logMeta,
    })

    return this.getClientConfigResult().andThen((clientConfig) => {
      return ResultAsync.fromPromise(
        oidcClient.fetchUserInfo(
          clientConfig,
          tokens.access_token,
          getValidatedIdTokenClaims(tokens)?.sub ?? '',
        ),
        (error) => {
          logger.error({
            message: 'Error while retrieving user info from SSO',
            meta: logMeta,
            error,
          })
          return new SsoCreateRedirectUrlError()
        },
      ).map((userInfo) => {
        logger.info({
          message: `Successfully retrieved user info from SSO`,
          meta: logMeta,
        })

        return userInfo
      })
    })
  }
}

export const AuthSsoService = new AuthSsoServiceClass(sso)
