import { okAsync, ResultAsync } from 'neverthrow'
import { getValidatedIdTokenClaims } from 'oauth4webapi'
import * as oidcClient from 'openid-client'

import { ISsoVarsSchema } from 'src/types'

import { isDev } from '../../../config/config'
import { sso } from '../../../config/features/sso.config'
import { createLoggerWithLabel } from '../../../config/logger'
import { resolveRedirectionUrl } from '../../../utils/urls'

import { SsoCreateRedirectUrlError } from './auth-sso.error'

const logger = createLoggerWithLabel(module)
export const SSO_LOGIN_OAUTH_STATE = 'ssoLogin'

export class AuthSsoServiceClass {
  private clientConfigPromise: Promise<oidcClient.Configuration>

  constructor({
    discoveryUrl: _discoveryUrl,
    clientId,
    clientSecret,
  }: ISsoVarsSchema) {
    const clientAuth: oidcClient.ClientAuth | undefined = clientSecret
      ? oidcClient.ClientSecretPost(clientSecret)
      : undefined

    const clientDiscoveryRequestOptions: oidcClient.DiscoveryRequestOptions = {
      algorithm: 'oidc',
    }

    if (isDev) {
      clientDiscoveryRequestOptions.execute = [oidcClient.allowInsecureRequests]
    }

    const oidcServer = new URL(_discoveryUrl)
    this.clientConfigPromise = oidcClient
      .discovery(
        oidcServer,
        clientId,
        undefined, // clientMetadata,
        clientAuth,
        clientDiscoveryRequestOptions,
      )
      .catch((error) => {
        logger.error({
          meta: {
            action: 'AuthSsoServiceClass.constructor',
            error,
          },
          message: 'Error while discovering SSO client configuration',
          error,
        })
        throw new SsoCreateRedirectUrlError()
      })
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
    { redirectUrl: string; codeVerifier: string; nonce: string },
    SsoCreateRedirectUrlError
  > {
    const logMeta = {
      action: 'createRedirectUrl',
    }

    logger.info({
      message: `Starting sso login flow`,
      meta: logMeta,
    })

    const codeVerifier = oidcClient.randomPKCECodeVerifier()

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

      return okAsync({
        redirectUrl: redirectTo.toString(),
        codeVerifier,
        nonce,
      })
    })
  }

  retrieveAccessToken(
    codeVerifier: string,
    nonce: string,
    currentUrl: string,
  ): ResultAsync<oidcClient.TokenEndpointResponse, SsoCreateRedirectUrlError> {
    const logMeta = {
      action: 'retrieveAccessToken',
    }

    return this.getClientConfigResult().andThen((clientConfig) => {
      return ResultAsync.fromPromise(
        oidcClient.authorizationCodeGrant(
          clientConfig,
          new URL(resolveRedirectionUrl(currentUrl)),
          {
            pkceCodeVerifier: codeVerifier,
            expectedState: nonce,
            idTokenExpected: true,
          },
          {},
          {},
        ),
        (error) => {
          logger.error({
            message: 'Error while retrieving access token from SSO',
            meta: { ...logMeta, error },
            error,
          })
          return new SsoCreateRedirectUrlError()
        },
      )
    })
  }

  retrieveUserInfo(
    tokens: oidcClient.TokenEndpointResponse,
  ): ResultAsync<{ sub: string; email: string }, SsoCreateRedirectUrlError> {
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
          meta: { ...logMeta, userInfo },
        })

        return userInfo as { sub: string; email: string }
      })
    })
  }
}

export const AuthSsoService = new AuthSsoServiceClass(sso)
