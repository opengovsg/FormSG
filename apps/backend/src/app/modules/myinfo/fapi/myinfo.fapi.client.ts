import crypto from 'crypto'
import * as client from 'openid-client'

import config from '../../../config/config'
import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../../config/logger'
import { retrieveJsonContent } from '../../../utils/iac'

const logger = createLoggerWithLabel(module)

const REQUEST_TIMEOUT_SECONDS = 10
const CONTENT_ENCRYPTION_ALGORITHMS = ['A256CBC-HS512', 'A256GCM']
const SIGNING_CURVES = new Set(['P-256', 'P-384', 'P-521'])

type MyInfoFapiJwk = JsonWebKey & { kid?: string }
export type JsonWebKeySet = { keys: MyInfoFapiJwk[] }

/**
 * WebCrypto rejects extra JWK members; keep only the EC coordinates.
 * Dropping `d` yields the matching public key (used for the DPoP public half).
 */
const ecJwk = (jwk: JsonWebKey, includePrivate: boolean): JsonWebKey => {
  const material: JsonWebKey = {
    kty: jwk.kty,
    crv: jwk.crv,
    x: jwk.x,
    y: jwk.y,
  }
  if (includePrivate) {
    material.d = jwk.d
  }
  return material
}

export const importEcSigningKey = (jwk: JsonWebKey): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'jwk',
    ecJwk(jwk, true),
    { name: 'ECDSA', namedCurve: jwk.crv as string },
    false,
    ['sign'],
  )

export const exportPrivateJwk = (key: CryptoKey): Promise<JsonWebKey> =>
  crypto.subtle.exportKey('jwk', key) as Promise<JsonWebKey>

export const importEcVerificationKey = (jwk: JsonWebKey): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'jwk',
    ecJwk(jwk, false),
    { name: 'ECDSA', namedCurve: jwk.crv as string },
    true,
    ['verify'],
  )

const importEcDecryptionKey = (jwk: JsonWebKey): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'jwk',
    ecJwk(jwk, true),
    { name: 'ECDH', namedCurve: jwk.crv as string },
    false,
    ['deriveBits'],
  )

/** JWK members that only appear on private or symmetric keys (RFC 7518 §6). */
const JWK_PRIVATE_MEMBERS = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth', 'k']

const loadJwks = (
  which: 'public' | 'secret',
  preIacFilePath: string,
  postIacJsonString: string,
): JsonWebKeySet => {
  const jwks = retrieveJsonContent({
    preIacFilePath,
    postIacJsonString,
  }) as JsonWebKeySet
  if (!jwks || !jwks.keys || jwks.keys.length === 0) {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new Error(`MyInfo FAPI ${which} JWKS is empty`)
  }
  if (which === 'public') {
    for (const key of jwks.keys) {
      const privateMembers = JWK_PRIVATE_MEMBERS.filter(
        (member) => member in key,
      )
      if (privateMembers.length > 0) {
        // eslint-disable-next-line typesafe/no-throw-sync-func
        throw new Error(
          `MyInfo FAPI public JWKS contains private key material (${privateMembers.join(', ')}); a secret keyset is misprovisioned into the public slot`,
        )
      }
    }
  }
  return jwks
}

let publicJwks: JsonWebKeySet | undefined

export const getPublicJwks = (): JsonWebKeySet => {
  if (!publicJwks) {
    publicJwks = loadJwks(
      'public',
      spcpMyInfoConfig.myInfoFapiRpJwksPublicPath,
      spcpMyInfoConfig.myInfoFapiRpJwksPublic,
    )
  }
  return publicJwks
}

const loadSecretKeys = async () => {
  const jwks = loadJwks(
    'secret',
    spcpMyInfoConfig.myInfoFapiRpJwksSecretPath,
    spcpMyInfoConfig.myInfoFapiRpJwksSecret,
  )
  const sig = jwks.keys.find((key) => key.use === 'sig')
  const enc = jwks.keys.find((key) => key.use === 'enc')
  if (!sig || !enc) {
    throw new Error("MyInfo FAPI secret JWKS needs one 'sig' and one 'enc' key")
  }
  if (!sig.crv || !SIGNING_CURVES.has(sig.crv)) {
    throw new Error(`Unsupported MyInfo FAPI signing curve ${sig.crv}`)
  }
  return {
    signingKey: await importEcSigningKey(sig),
    sigKid: sig.kid,
    decryptionKey: await importEcDecryptionKey(enc),
    encKid: enc.kid,
    encAlg: enc.alg,
  }
}

const buildConfiguration = async (): Promise<client.Configuration> => {
  const keys = await loadSecretKeys()
  const configuration = await client.discovery(
    new URL(spcpMyInfoConfig.myInfoFapiIssuer),
    spcpMyInfoConfig.myInfoFapiClientId,
    undefined,
    client.PrivateKeyJwt(
      { key: keys.signingKey, kid: keys.sigKid },
      {
        // Singpass rejects a client assertion without typ; openid-client omits it.
        [client.modifyAssertion]: (header) => {
          header.typ = 'JWT'
        },
      },
    ),
    {
      timeout: REQUEST_TIMEOUT_SECONDS,
      execute: config.isDevOrTest ? [client.allowInsecureRequests] : [],
    },
  )
  client.enableDecryptingResponses(
    configuration,
    CONTENT_ENCRYPTION_ALGORITHMS,
    {
      key: keys.decryptionKey,
      alg: keys.encAlg,
      kid: keys.encKid,
    },
  )
  logger.info({
    message: 'Initialised MyInfo FAPI client',
    meta: {
      action: 'getConfiguration',
      issuer: configuration.serverMetadata().issuer,
      sigKid: keys.sigKid,
      encKid: keys.encKid,
    },
  })
  return configuration
}

/**
 * One openid-client Configuration for the process. A failed discovery clears
 * the memo so the next login retries instead of inheriting a poisoned promise.
 */
let configPromise: Promise<client.Configuration> | undefined

export const getConfiguration = (): Promise<client.Configuration> => {
  if (configPromise) {
    return configPromise
  }
  configPromise = buildConfiguration().catch((error: unknown) => {
    configPromise = undefined
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw error
  })
  return configPromise
}
