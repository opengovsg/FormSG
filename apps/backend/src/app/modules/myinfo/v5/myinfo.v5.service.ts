import axios from 'axios'
import type { JSONWebKeySet } from 'jose'
import * as jose from 'jose'
import { err, errAsync, Result, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'

import {
  createClientAssertion,
  deriveCodeChallenge,
  generateNonce,
  generatePkceVerifier,
} from './myinfo.v5.crypto'
import {
  MyInfoV5ConfigError,
  MyInfoV5TokenError,
  MyInfoV5UserinfoError,
} from './myinfo.v5.errors'
import type {
  MyInfoV5DiscoveryDocument,
  MyInfoV5RpKeyset,
  MyInfoV5TokenResponse,
  MyInfoV5UserinfoClaims,
} from './myinfo.v5.types'

const logger = createLoggerWithLabel(module)

/**
 * Service that implements the Singpass Auth API v5 / MyInfo v5 OIDC flow.
 *
 * Design notes:
 * - The `issuer` URL is fully parameterized — mockpass and prod share one
 *   code path. The discovery doc at `${issuer}/.well-known/openid-configuration`
 *   provides every other endpoint.
 * - The service deliberately uses `Bearer` userinfo auth, matching mockpass.
 *   Production Singpass v5 requires DPoP (RFC 9449); a TODO marker is left at
 *   the call site so we don't accidentally flip prod traffic before DPoP lands.
 * - The RP keyset (sig + enc EC keys) is loaded once at boot. The public half
 *   is served at `${appUrl}/api/v3/mi/v5/.well-known/jwks.json` so the IdP can
 *   fetch it to verify our client_assertion and encrypt the userinfo JWE.
 * - The discovery document is cached in-memory after first fetch. Mockpass and
 *   prod both expose long-lived endpoints; we re-fetch on token/userinfo
 *   failures by clearing the cache (TODO: explicit invalidation).
 */
export class MyInfoV5ServiceClass {
  readonly #issuer: string
  readonly #clientId: string
  readonly #redirectUri: string
  readonly #rpKeyset: MyInfoV5RpKeyset | null
  #discoveryDoc: MyInfoV5DiscoveryDocument | null = null
  #idpJwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null

  /**
   * Whether v5 has the minimum config needed to operate. Returned to callers
   * so the dispatcher can fall back to v3 gracefully when the flag is on but
   * v5 hasn't been provisioned (e.g. CI environments where keys aren't set).
   */
  get isConfigured(): boolean {
    return Boolean(this.#issuer && this.#clientId && this.#rpKeyset)
  }

  constructor({
    issuer,
    clientId,
    redirectUri,
    rpKeyset,
  }: {
    issuer: string
    clientId: string
    redirectUri: string
    rpKeyset: MyInfoV5RpKeyset | null
  }) {
    this.#issuer = issuer
    this.#clientId = clientId
    this.#redirectUri = redirectUri
    this.#rpKeyset = rpKeyset
  }

  /**
   * Public JWKS (sig + enc), served at the configured endpoint for the IdP to
   * fetch. Strips private material defensively.
   */
  getPublicJwks(): JSONWebKeySet {
    if (!this.#rpKeyset) return { keys: [] }
    return {
      keys: this.#rpKeyset.publicJwks.keys.map((k) => ({ ...k })),
    }
  }

  /**
   * Lazily fetch the OIDC discovery document.
   */
  async #fetchDiscovery(): Promise<MyInfoV5DiscoveryDocument> {
    if (this.#discoveryDoc) return this.#discoveryDoc
    const url = `${this.#issuer.replace(/\/$/, '')}/.well-known/openid-configuration`
    const response = await axios.get<MyInfoV5DiscoveryDocument>(url, {
      timeout: 5000,
    })
    this.#discoveryDoc = response.data
    return response.data
  }

  async #getIdpJwks(): Promise<ReturnType<typeof jose.createRemoteJWKSet>> {
    if (this.#idpJwks) return this.#idpJwks
    const disc = await this.#fetchDiscovery()
    this.#idpJwks = jose.createRemoteJWKSet(new URL(disc.jwks_uri))
    return this.#idpJwks
  }

  /**
   * Build the URL to which the user agent should be redirected to begin the
   * Singpass v5 login. Returns the URL plus PKCE/nonce/state material that
   * the caller must persist (in cookies) and validate on callback.
   */
  createRedirectURL({
    formId,
    scopes,
    encodedQuery,
  }: {
    formId: string
    scopes: string[]
    encodedQuery?: string
  }): ResultAsync<
    {
      redirectURL: string
      codeVerifier: string
      nonce: string
      state: string
    },
    MyInfoV5ConfigError
  > {
    if (!this.isConfigured) {
      return errAsync(new MyInfoV5ConfigError())
    }
    return ResultAsync.fromPromise(this.#fetchDiscovery(), (error) => {
      logger.error({
        message: 'Failed to fetch v5 discovery document',
        meta: { action: 'createRedirectURL', issuer: this.#issuer },
        error,
      })
      return new MyInfoV5ConfigError('Could not fetch discovery document')
    }).map((disc) => {
      const codeVerifier = generatePkceVerifier()
      const nonce = generateNonce()
      const state = encodeState({ formId, encodedQuery })

      const url = new URL(disc.authorization_endpoint)
      url.searchParams.set('client_id', this.#clientId)
      url.searchParams.set('scope', scopes.join(' '))
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('redirect_uri', this.#redirectUri)
      url.searchParams.set('state', state)
      url.searchParams.set('nonce', nonce)
      url.searchParams.set('code_challenge', deriveCodeChallenge(codeVerifier))
      url.searchParams.set('code_challenge_method', 'S256')

      return {
        redirectURL: url.toString(),
        codeVerifier,
        nonce,
        state,
      }
    })
  }

  /**
   * Exchange the auth code for an access token, authenticating with
   * `private_key_jwt` per RFC 7523.
   *
   * Returns the raw token response so the caller can pass `access_token`
   * straight to the userinfo call.
   */
  exchangeCodeForTokens({
    code,
    codeVerifier,
  }: {
    code: string
    codeVerifier: string
  }): ResultAsync<MyInfoV5TokenResponse, MyInfoV5TokenError> {
    if (!this.#rpKeyset) return errAsync(new MyInfoV5TokenError('No keyset'))
    const sigJwk = this.#rpKeyset.privateJwks.keys.find((k) => k.use === 'sig')
    if (!sigJwk) return errAsync(new MyInfoV5TokenError('No sig key'))
    return ResultAsync.fromPromise(
      this.#fetchDiscovery().then(async (disc) => {
        const signingKey = (await jose.importJWK(
          sigJwk,
          'ES256',
        )) as jose.KeyLike
        const clientAssertion = await createClientAssertion({
          clientId: this.#clientId,
          audience: disc.issuer,
          signingKey,
          signingKid: sigJwk.kid ?? 'sig-1',
          signingAlg: 'ES256',
        })

        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.#redirectUri,
          client_id: this.#clientId,
          client_assertion_type:
            'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: clientAssertion,
          code_verifier: codeVerifier,
        })

        const response = await axios.post<MyInfoV5TokenResponse>(
          disc.token_endpoint,
          body.toString(),
          {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            timeout: 10000,
          },
        )
        return response.data
      }),
      (error) => {
        logger.error({
          message: 'v5 token exchange failed',
          meta: { action: 'exchangeCodeForTokens' },
          error,
        })
        return new MyInfoV5TokenError()
      },
    )
  }

  /**
   * Fetch + decrypt the userinfo response, returning the JWS claims.
   *
   * Wire: GET ${userinfo_endpoint}
   *   Authorization: Bearer ${access_token}        // TODO(v5-prod): switch to DPoP
   * Response: application/jwt — a JWE wrapping a JWS whose payload is the
   *   set of MyInfo claims.
   */
  fetchUserinfo(
    accessToken: string,
  ): ResultAsync<MyInfoV5UserinfoClaims, MyInfoV5UserinfoError> {
    if (!this.#rpKeyset) {
      return errAsync(new MyInfoV5UserinfoError('No keyset'))
    }
    const encJwk = this.#rpKeyset.privateJwks.keys.find((k) => k.use === 'enc')
    if (!encJwk) return errAsync(new MyInfoV5UserinfoError('No enc key'))
    return ResultAsync.fromPromise(
      (async () => {
        const disc = await this.#fetchDiscovery()
        const response = await axios.get<string>(disc.userinfo_endpoint, {
          headers: {
            authorization: `Bearer ${accessToken}`,
            accept: 'application/jwt',
          },
          // userinfo body is a JWT string; let axios keep it as text.
          transformResponse: (raw) => raw,
          timeout: 10000,
        })
        const jweCompact: string =
          typeof response.data === 'string'
            ? response.data
            : String(response.data)

        // Step 1: decrypt the JWE with our private encryption key.
        const encKey = (await jose.importJWK(
          encJwk,
          (encJwk.alg as string) ?? 'ECDH-ES+A256KW',
        )) as jose.KeyLike
        const { plaintext } = await jose.compactDecrypt(jweCompact, encKey)

        // Step 2: the JWE payload is a JWS (compact). Verify it against the
        //         IdP's published signing key.
        const jws = new TextDecoder().decode(plaintext)
        const idpJwks = await this.#getIdpJwks()
        const { payload } = await jose.jwtVerify(jws, idpJwks)

        return payload as MyInfoV5UserinfoClaims
      })(),
      (error) => {
        logger.error({
          message: 'v5 userinfo fetch/decrypt failed',
          meta: { action: 'fetchUserinfo' },
          error,
        })
        return new MyInfoV5UserinfoError()
      },
    )
  }
}

/**
 * Encode formId + encodedQuery into the OAuth `state` parameter.
 * v3 uses a JSON string for this; we keep the same shape so error logging
 * and downstream parsing look familiar.
 */
function encodeState({
  formId,
  encodedQuery,
}: {
  formId: string
  encodedQuery?: string
}): string {
  return Buffer.from(
    JSON.stringify({ formId, encodedQuery, v: 5 }),
    'utf8',
  ).toString('base64url')
}

export function decodeV5State(
  state: string,
): Result<{ formId: string; encodedQuery?: string }, Error> {
  // JSON.parse is the only throw source — wrap it with fromThrowable and
  // narrow the shape afterwards so we never throw ourselves.
  const parsed = Result.fromThrowable(
    () =>
      JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
        formId?: unknown
        encodedQuery?: unknown
        v?: unknown
      },
    (e) => e as Error,
  )()
  return parsed.andThen((decoded) =>
    typeof decoded.formId === 'string'
      ? Result.fromThrowable<
          () => { formId: string; encodedQuery?: string },
          Error
        >(
          () => ({
            formId: decoded.formId as string,
            encodedQuery:
              typeof decoded.encodedQuery === 'string'
                ? decoded.encodedQuery
                : undefined,
          }),
          (e) => e as Error,
        )()
      : err<{ formId: string; encodedQuery?: string }, Error>(
          new Error('formId missing'),
        ),
  )
}
