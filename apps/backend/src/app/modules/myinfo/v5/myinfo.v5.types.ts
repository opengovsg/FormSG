/**
 * Types for the MyInfo v5 / Singpass Auth API v5 flow.
 *
 * Singpass v5 collapses what used to be a separate MyInfo Person endpoint into
 * the OIDC `userinfo` endpoint of the Auth API. Person attributes are returned
 * as claims on the userinfo JWT, wrapped in a JWE.
 *
 * For the mockpass-compatible subset we model only what we read. Production
 * Singpass returns additional structured claims (e.g. `sub_attributes`, nested
 * `person_info` objects) which the adapter handles defensively.
 */

import type { JSONWebKeySet } from 'jose'

/**
 * Standard OIDC discovery document fields we depend on.
 */
export interface MyInfoV5DiscoveryDocument {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  jwks_uri: string
  id_token_signing_alg_values_supported?: string[]
  userinfo_signing_alg_values_supported?: string[]
  userinfo_encryption_alg_values_supported?: string[]
  userinfo_encryption_enc_values_supported?: string[]
}

export interface MyInfoV5TokenResponse {
  access_token: string
  token_type: 'Bearer' | 'DPoP'
  id_token?: string
  expires_in?: number
  scope?: string
}

/**
 * Lightweight relay-state container persisted in cookies between the redirect
 * and the OAuth callback. PKCE + nonce live alongside the formId so we can
 * validate the round trip and pop the user back where they came from.
 */
export interface MyInfoV5RelayPayload {
  formId: string
  encodedQuery?: string
  codeVerifier: string
  nonce: string
  state: string
}

/**
 * Shape of the userinfo claims set after JWE decrypt + JWS verify.
 * Singpass returns each MyInfo attribute as a claim with `{value, source, lastupdated, classification}`.
 * Mockpass returns the bare minimum (uinfin, name) using the same shape.
 *
 * We accept `unknown` per-claim and let the adapter narrow per attribute.
 */
export interface MyInfoV5UserinfoClaims {
  sub: string
  iss: string
  aud: string
  iat: number
  // Each MyInfo attribute appears as its own claim key.
  // E.g. `uinfin`, `name`, `mobileno`, `regadd`, `dob`, ...
  [claim: string]: unknown
}

/**
 * Shape of an RP-controlled JWKS file on disk.
 * One JWKS may contain both signature and encryption keys, distinguished by
 * `use`. We require at least one of each for a complete v5 setup.
 */
export interface MyInfoV5RpKeyset {
  publicJwks: JSONWebKeySet
  privateJwks: JSONWebKeySet
}

export interface MyInfoV5ServiceConfig {
  /**
   * Issuer URL — `${issuer}/.well-known/openid-configuration` returns the
   * discovery document. Mockpass: `http://localhost:5156/singpass/v2`.
   * Prod: typically the Singpass Auth API v5 base URL.
   */
  issuer: string
  clientId: string
  /** Where Singpass should send the user back. */
  redirectUri: string
  rpKeyset: MyInfoV5RpKeyset
  /**
   * Scopes to request. Singpass v5 scopes that map to MyInfo attributes:
   * 'openid' (required), 'uinfin', 'name', 'mobileno', 'regadd', ...
   * The dispatcher derives this from the form's requested MyInfo attributes.
   */
  scopes: string[]
}
