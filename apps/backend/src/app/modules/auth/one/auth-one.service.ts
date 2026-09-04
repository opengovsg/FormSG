import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { getValidatedIdTokenClaims } from 'oauth4webapi'
import * as oidcClient from 'openid-client'

import { IOneVarsSchema } from 'src/types'

import { isDev } from '../../../config/config'
import { isOneConfigured, one } from '../../../config/features/one.config'
import { createLoggerWithLabel } from '../../../config/logger'
import { resolveAppUrl } from '../../../utils/urls'

import { ONE_LOGIN_CALLBACK_PATH } from './auth-one.constants'
import { OneCreateRedirectUrlError } from './auth-one.errors'

const logger = createLoggerWithLabel(module)

export type OneIdTokenClaims = {
  sub: string
  email: string
  sid?: string
}

type PrivateSigningJwk = JsonWebKey & { alg: string; kid?: string }

// RATIONALE: JWK `alg` doesn't map to a WebCrypto import algorithm on its
// own (e.g. RSA needs an explicit hash) — this is the full set of algs the
// one.gov.sg developer portal accepts (RSA, EC or OKP public keys).
const JWA_TO_WEBCRYPTO_IMPORT_PARAMS: Record<
  string,
  Parameters<typeof crypto.subtle.importKey>[2]
> = {
  RS256: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  RS384: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' },
  RS512: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' },
  PS256: { name: 'RSA-PSS', hash: 'SHA-256' },
  PS384: { name: 'RSA-PSS', hash: 'SHA-384' },
  PS512: { name: 'RSA-PSS', hash: 'SHA-512' },
  ES256: { name: 'ECDSA', namedCurve: 'P-256' },
  ES384: { name: 'ECDSA', namedCurve: 'P-384' },
  ES512: { name: 'ECDSA', namedCurve: 'P-521' },
  EdDSA: { name: 'Ed25519' },
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
   * Import the RP's private signing key and build the private_key_jwt
   * ClientAuth used to authenticate at the one.gov.sg token endpoint.
   *
   * RATIONALE: isOneConfigured() already validated clientJwksSecret parses
   * to a JWK Set with exactly one private key, so JSON.parse and the [0]
   * access here are assumed safe.
   */
  private static async buildPrivateKeyJwtAuth(
    clientJwksSecret: string,
  ): Promise<oidcClient.ClientAuth> {
    const { keys } = JSON.parse(clientJwksSecret) as {
      keys: PrivateSigningJwk[]
    }
    const jwk = keys[0]
    const importParams = JWA_TO_WEBCRYPTO_IMPORT_PARAMS[jwk.alg]
    if (!importParams) {
      return Promise.reject(
        new OneCreateRedirectUrlError(
          `one.gov.sg client JWKS secret has unsupported alg: ${jwk.alg}`,
        ),
      )
    }

    const key = await crypto.subtle.importKey('jwk', jwk, importParams, false, [
      'sign',
    ])
    return oidcClient.PrivateKeyJwt({ key, kid: jwk.kid })
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

    const { discoveryUrl, clientId, clientJwksSecret } = this.config

    const clientDiscoveryRequestOptions: oidcClient.DiscoveryRequestOptions = {
      algorithm: 'oidc',
    }

    if (isDev) {
      clientDiscoveryRequestOptions.execute = [oidcClient.allowInsecureRequests]
    }

    try {
      const oidcServer = new URL(discoveryUrl)
      // RATIONALE: the one.gov.sg IdP retired client_secret_basic in favour of
      // private_key_jwt (2026-08 migration, see opengovsg/suite). isConfigured
      // guarantees clientJwksSecret parses to exactly one private signing key.
      this.clientConfigPromise = AuthOneServiceClass.buildPrivateKeyJwtAuth(
        clientJwksSecret,
      )
        .then((clientAuth) =>
          oidcClient.discovery(
            oidcServer,
            clientId,
            undefined, // clientMetadata,
            clientAuth,
            clientDiscoveryRequestOptions,
          ),
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
        redirect_uri: resolveAppUrl(ONE_LOGIN_CALLBACK_PATH),
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
