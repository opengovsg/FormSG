import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { getValidatedIdTokenClaims } from 'oauth4webapi'
import * as oidcClient from 'openid-client'

import { ISsoVarsSchema } from 'src/types'

import { isDev } from '../../../config/config'
import { isSsoConfigured, sso } from '../../../config/features/sso.config'
import { createLoggerWithLabel } from '../../../config/logger'
import { resolveAppUrl } from '../../../utils/urls'

import { SsoCreateRedirectUrlError } from './auth-sso.errors'

const logger = createLoggerWithLabel(module)
export const SSO_LOGIN_OAUTH_STATE = 'ssoLogin'

export class AuthSsoServiceClass {
  // RATIONALE: bound retries so a transient outage doesn't disable SSO until
  // restart, without hammering the discovery endpoint on every request.
  private static readonly DISCOVERY_RETRY_INTERVAL_MS = 60_000

  private clientConfigPromise: Promise<oidcClient.Configuration> | null = null
  private discoveryFailedAt: number | null = null
  private readonly config: ISsoVarsSchema
  private readonly isConfigured: boolean

  constructor(config: ISsoVarsSchema) {
    this.config = config
    this.isConfigured = isSsoConfigured(config)
  }

  /**
   * RATIONALE: discover lazily so an unreachable URL doesn't crash startup;
   * cache failures for DISCOVERY_RETRY_INTERVAL_MS before retrying.
   */
  private initializeClientConfig(): void {
    if (this.clientConfigPromise) {
      const recentlyFailed =
        this.discoveryFailedAt !== null &&
        Date.now() - this.discoveryFailedAt <
          AuthSsoServiceClass.DISCOVERY_RETRY_INTERVAL_MS
      if (this.discoveryFailedAt === null || recentlyFailed) {
        return
      }
      this.clientConfigPromise = null
      this.discoveryFailedAt = null
    }

    const { discoveryUrl, clientId, clientSecret } = this.config

    const clientAuth: oidcClient.ClientAuth | undefined = clientSecret
      ? oidcClient.ClientSecretPost(clientSecret)
      : undefined

    const clientDiscoveryRequestOptions: oidcClient.DiscoveryRequestOptions = {
      algorithm: 'oidc',
    }

    if (isDev) {
      clientDiscoveryRequestOptions.execute = [oidcClient.allowInsecureRequests]
    }

    try {
      const oidcServer = new URL(discoveryUrl)
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
              action: 'AuthSsoServiceClass.initializeClientConfig',
              error,
            },
            message:
              'Error while discovering SSO client configuration from upstream service. SSO login is unavailable.',
            error,
          })
          this.discoveryFailedAt = Date.now()
          // RATIONALE: reject (not throw) to satisfy typesafe/no-throw-sync-func;
          // consumed via ResultAsync.fromPromise().
          return Promise.reject(
            new SsoCreateRedirectUrlError(
              'SSO service discovery failed. Please try again later.',
            ),
          )
        })
    } catch (error) {
      logger.error({
        meta: {
          action: 'AuthSsoServiceClass.initializeClientConfig',
          error,
        },
        message:
          'Error while parsing SSO discovery URL. SSO login is unavailable.',
        error,
      })
      this.discoveryFailedAt = Date.now()
      this.clientConfigPromise = Promise.reject(
        new SsoCreateRedirectUrlError(
          'SSO service configuration is invalid. Please try again later.',
        ),
      )
    }
  }

  getClientConfigResult(): ResultAsync<
    oidcClient.Configuration,
    SsoCreateRedirectUrlError
  > {
    const logMeta = {
      action: 'getClientConfigResult',
    }

    if (!this.isConfigured) {
      logger.warn({
        message:
          'SSO is not properly configured. Cannot retrieve client configuration.',
        meta: logMeta,
      })
      return errAsync(
        new SsoCreateRedirectUrlError(
          'SSO service is not configured. Please use Email OTP login.',
        ),
      )
    }

    this.initializeClientConfig()

    // RATIONALE: initializeClientConfig always sets this, but TS can't prove it.
    const configPromise = this.clientConfigPromise
    if (!configPromise) {
      logger.error({
        message: 'SSO client configuration promise was not initialized',
        meta: logMeta,
      })
      return errAsync(
        new SsoCreateRedirectUrlError(
          'SSO service initialization failed. Please try again later.',
        ),
      )
    }

    return ResultAsync.fromPromise(configPromise, (error) => {
      logger.error({
        message:
          'Error while retrieving SSO client configuration. SSO service may be unavailable.',
        meta: logMeta,
        error,
      })
      return new SsoCreateRedirectUrlError(
        'SSO service is currently unavailable. Please try again later or use Email OTP login.',
      )
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
        return new SsoCreateRedirectUrlError(
          'Failed to calculate PKCE code challenge for SSO authentication',
        )
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
          new URL(resolveAppUrl(currentUrl)),
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
          return new SsoCreateRedirectUrlError(
            'Failed to retrieve access token from SSO service',
          )
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
          return new SsoCreateRedirectUrlError(
            'Failed to retrieve user information from SSO service',
          )
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
