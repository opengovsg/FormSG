import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { getValidatedIdTokenClaims } from 'oauth4webapi'
import * as oidcClient from 'openid-client'

import { IOneVarsSchema } from 'src/types'

import { isDev } from '../../../config/config'
import { isOneConfigured, one } from '../../../config/features/one.config'
import { createLoggerWithLabel } from '../../../config/logger'
import { resolveAppUrl } from '../../../utils/urls'

import { OneCreateRedirectUrlError } from './auth-one.errors'

const logger = createLoggerWithLabel(module)

export type OneIdTokenClaims = {
  sub: string
  email: string
  sid?: string
}

export class AuthOneServiceClass {
  // RATIONALE: bound retries so a transient outage doesn't disable one.gov.sg
  // login until restart, without hammering the discovery endpoint on every
  // request.
  private static readonly DISCOVERY_RETRY_INTERVAL_MS = 60_000

  private clientConfigPromise: Promise<oidcClient.Configuration> | null = null
  private discoveryFailedAt: number | null = null
  private readonly config: IOneVarsSchema
  private readonly isConfigured: boolean

  constructor(config: IOneVarsSchema) {
    this.config = config
    this.isConfigured = isOneConfigured(config)
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
          AuthOneServiceClass.DISCOVERY_RETRY_INTERVAL_MS
      if (this.discoveryFailedAt === null || recentlyFailed) {
        return
      }
      this.clientConfigPromise = null
      this.discoveryFailedAt = null
    }

    const { discoveryUrl, clientId, clientSecret } = this.config

    // RATIONALE: the one.gov.sg IdP expects client_secret_basic at the token
    // endpoint (see opengovsg/suite reference RP), unlike the sso module which
    // uses client_secret_post.
    const clientAuth: oidcClient.ClientAuth | undefined = clientSecret
      ? oidcClient.ClientSecretBasic(clientSecret)
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
              action: 'AuthOneServiceClass.initializeClientConfig',
              error,
            },
            message:
              'Error while discovering one.gov.sg client configuration from upstream service. one.gov.sg login is unavailable.',
            error,
          })
          this.discoveryFailedAt = Date.now()
          // RATIONALE: reject (not throw) to satisfy typesafe/no-throw-sync-func;
          // consumed via ResultAsync.fromPromise().
          return Promise.reject(
            new OneCreateRedirectUrlError(
              'one.gov.sg service discovery failed. Please try again later.',
            ),
          )
        })
    } catch (error) {
      logger.error({
        meta: {
          action: 'AuthOneServiceClass.initializeClientConfig',
          error,
        },
        message:
          'Error while parsing one.gov.sg discovery URL. one.gov.sg login is unavailable.',
        error,
      })
      this.discoveryFailedAt = Date.now()
      this.clientConfigPromise = Promise.reject(
        new OneCreateRedirectUrlError(
          'one.gov.sg service configuration is invalid. Please try again later.',
        ),
      )
    }
  }

  getClientConfigResult(): ResultAsync<
    oidcClient.Configuration,
    OneCreateRedirectUrlError
  > {
    const logMeta = {
      action: 'getClientConfigResult',
    }

    if (!this.isConfigured) {
      logger.warn({
        message:
          'one.gov.sg is not properly configured. Cannot retrieve client configuration.',
        meta: logMeta,
      })
      return errAsync(
        new OneCreateRedirectUrlError(
          'one.gov.sg service is not configured. Please use Email OTP login.',
        ),
      )
    }

    this.initializeClientConfig()

    // RATIONALE: initializeClientConfig always sets this, but TS can't prove it.
    const configPromise = this.clientConfigPromise
    if (!configPromise) {
      logger.error({
        message: 'one.gov.sg client configuration promise was not initialized',
        meta: logMeta,
      })
      return errAsync(
        new OneCreateRedirectUrlError(
          'one.gov.sg service initialization failed. Please try again later.',
        ),
      )
    }

    return ResultAsync.fromPromise(configPromise, (error) => {
      logger.error({
        message:
          'Error while retrieving one.gov.sg client configuration. one.gov.sg service may be unavailable.',
        meta: logMeta,
        error,
      })
      return new OneCreateRedirectUrlError(
        'one.gov.sg service is currently unavailable. Please try again later or use Email OTP login.',
      )
    })
  }

  /**
   * The issuer this service trusts, from the discovered server metadata.
   * Used to validate the `iss` parameter on IdP-initiated logins (ADR-0006).
   */
  getIssuer(): ResultAsync<string, OneCreateRedirectUrlError> {
    return this.getClientConfigResult().map(
      (clientConfig) => clientConfig.serverMetadata().issuer,
    )
  }

  /**
   * Create a URL to one.gov.sg which is used to redirect the user for
   * authentication.
   *
   * RATIONALE: unlike the sso module, state and nonce are distinct values —
   * the one.gov.sg IdP validates the nonce echoed in the id_token separately
   * from the CSRF state in the callback query.
   * @returns The redirectUrl and the associated code verifier, state and nonce
   */
  createRedirectUrl(): ResultAsync<
    { redirectUrl: string; codeVerifier: string; state: string; nonce: string },
    OneCreateRedirectUrlError
  > {
    const logMeta = {
      action: 'createRedirectUrl',
    }

    logger.info({
      message: `Starting one.gov.sg login flow`,
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
        return new OneCreateRedirectUrlError(
          'Failed to calculate PKCE code challenge for one.gov.sg authentication',
        )
      },
    )
    return ResultAsync.combine([
      this.getClientConfigResult(),
      codeChallengeResult,
    ]).andThen(([clientConfig, codeChallenge]) => {
      const state = oidcClient.randomState()
      const nonce = oidcClient.randomNonce()

      const params: Record<string, string> = {
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
        nonce,
        scope: ['openid', 'email'].join(' '),
      }

      const redirectTo: URL = oidcClient.buildAuthorizationUrl(
        clientConfig,
        params,
      )

      return okAsync({
        redirectUrl: redirectTo.toString(),
        codeVerifier,
        state,
        nonce,
      })
    })
  }

  retrieveAccessToken(
    codeVerifier: string,
    state: string,
    nonce: string,
    currentUrl: string,
  ): ResultAsync<
    oidcClient.TokenEndpointResponse & oidcClient.TokenEndpointResponseHelpers,
    OneCreateRedirectUrlError
  > {
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
            expectedState: state,
            expectedNonce: nonce,
            idTokenExpected: true,
          },
        ),
        (error) => {
          logger.error({
            message: 'Error while retrieving access token from one.gov.sg',
            meta: { ...logMeta, error },
            error,
          })
          return new OneCreateRedirectUrlError(
            'Failed to retrieve access token from one.gov.sg service',
          )
        },
      )
    })
  }

  /**
   * Extract the user's identity from the validated id_token claims.
   *
   * RATIONALE: no userinfo call — per one.gov.sg ADR-0002 the `sub` claim IS
   * the verified government email. `sid` is kept for a future central /
   * back-channel logout (ADR-0003).
   */
  retrieveClaims(
    tokens: oidcClient.TokenEndpointResponse &
      oidcClient.TokenEndpointResponseHelpers,
  ): Result<OneIdTokenClaims, OneCreateRedirectUrlError> {
    const claims = getValidatedIdTokenClaims(tokens)

    if (!claims || !claims.sub) {
      logger.error({
        message: 'one.gov.sg id_token has no validated claims',
        meta: { action: 'retrieveClaims' },
      })
      return err(
        new OneCreateRedirectUrlError(
          'Failed to retrieve user information from one.gov.sg service',
        ),
      )
    }

    return ok({
      sub: claims.sub,
      email: (claims.email as string | undefined) ?? claims.sub,
      sid: claims.sid as string | undefined,
    })
  }
}

export const AuthOneService = new AuthOneServiceClass(one)
