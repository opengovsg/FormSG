import { KeyObject } from 'crypto'
import { JWK, JWTPayload, JWTVerifyResult } from 'jose'
import { Options } from 'node-cache'
import { BaseClient } from 'openid-client'

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

// Object returned when cache calls refresh
export type Refresh = {
  ndiPublicKeys: CryptoKeys
  baseClient: BaseClient
}

// Object with jwks converted to a crypto KeyObject
export type CryptoKey = {
  kid: string
  use: string
  alg?: string
  key: KeyObject // Converted jwks
}

export type SigningKey = Required<CryptoKey>

export type CryptoKeys = CryptoKey[]

export type SpcpOidcClientConstructorParams = {
  rpClientId: string
  rpRedirectUrl: string
  ndiDiscoveryEndpoint: string
  ndiJwksEndpoint: string
  rpSecretJwks: SecretJwks
  rpPublicJwks: PublicJwks
}

export type SpcpOidcBaseClientCacheConstructorParams = {
  options?: Options
  ndiDiscoveryEndpoint: string
  ndiJwksEndpoint: string
  rpClientId: string
  rpRedirectUrl: string
  rpSecretJwks: SecretJwks
}

export type ParsedSub = {
  key: string
  value: string
}[]

/**
 * Corppass decrypted and verified idToken
 * From NDI CP Specs: EntityInfo object is a mandatory claim in all Corppass id tokens.
 * CPEntID is a mandatory attribute in EntityInfo.
 * Mandatory attributes in the object will always contain values (could be blank string).
 * @property payload.entityInfo.CPEntID
 */
export type CPJWTVerifyResult = JWTVerifyResult & {
  payload: JWTPayload & {
    entityInfo: {
      CPEntID: string
    }
  }
}

/**
 * Singpass Oidc Client Id field to be injected into token exchange request
 */
export type SpClientIdField = {
  client_id: string
}
