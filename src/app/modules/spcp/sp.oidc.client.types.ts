import { KeyObject } from 'crypto'
import { JWK } from 'jose'
import { EC, ECPrivate } from 'jwk-to-pem'
import { Options } from 'node-cache'

type PublicJwk = Partial<JWK> & Required<Pick<JWK, 'use' | 'kid'>>

type SecretJwk = PublicJwk & {
  d: string
}

export type PublicJwks = {
  keys: PublicJwk[]
}
export type SecretJwks = {
  keys: SecretJwk[]
}

// Object with jwks converted to a crypto KeyObject
type CryptoKey = {
  kid: string
  use: string
  alg?: string
  key: KeyObject // Converted jwks
}

export type SigningKey = Required<CryptoKey>

export type CryptoKeySet = CryptoKey[]

export type SpOidcClientConstructorParams = {
  spOidcRpClientId: string
  spOidcRpRedirectUrl: string
  spOidcNdiDiscoveryEndpoint: string
  spOidcNdiJwksEndpoint: string
  spOidcRpSecretJwks: SecretJwks
  spOidcRpPublicJwks: PublicJwks
}

export type SpOidcClientCacheConstructorParams = {
  options?: Options
  spOidcNdiDiscoveryEndpoint: string
  spOidcNdiJwksEndpoint: string
  spOidcRpClientId: string
  spOidcRpRedirectUrl: string
  spOidcRpSecretJwks: SecretJwks
}

// Typeguards

/**
 * Utility to narrow type of an object by determining whether
 * it contains the given property.
 * @param obj Object
 * @param prop Property to check
 */

const hasProp = <K extends string>(
  obj: unknown,
  prop: K,
): obj is Record<K, unknown> => {
  return typeof obj === 'object' && obj !== null && prop in obj
}

export const isEC = (jwk: unknown): jwk is EC => {
  return (
    typeof jwk === 'object' &&
    !!jwk &&
    hasProp(jwk, 'kty') &&
    jwk.kty === 'EC' &&
    hasProp(jwk, 'crv') &&
    typeof jwk.crv === 'string' &&
    hasProp(jwk, 'x') &&
    typeof jwk.x === 'string' &&
    hasProp(jwk, 'y') &&
    typeof jwk.y === 'string'
  )
}

export const isECPrivate = (jwk: unknown): jwk is ECPrivate => {
  return (
    typeof jwk === 'object' &&
    !!jwk &&
    hasProp(jwk, 'kty') &&
    jwk.kty === 'EC' &&
    hasProp(jwk, 'crv') &&
    typeof jwk.crv === 'string' &&
    hasProp(jwk, 'd') &&
    typeof jwk.d === 'string'
  )
}

export const isSigningKey = (key: CryptoKey): key is SigningKey => {
  return !!key.alg && key.use === 'sig'
}
