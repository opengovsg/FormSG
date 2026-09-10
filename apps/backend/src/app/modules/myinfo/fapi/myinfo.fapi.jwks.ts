import crypto from 'crypto'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../../config/logger'
import { retrieveJsonContent } from '../../../utils/iac'

import { MyInfoFapiConfigError } from './myinfo.fapi.errors'

const logger = createLoggerWithLabel(module)

const KEY_MANAGEMENT_ALGORITHMS = [
  'ECDH-ES',
  'ECDH-ES+A128KW',
  'ECDH-ES+A192KW',
  'ECDH-ES+A256KW',
]

type JwkType = 'public' | 'secret'
type MyInfoFapiJwk = JsonWebKey & {
  kty: 'EC'
  crv: string
  x: string
  y: string
  use: 'sig' | 'enc'
  alg: string
  kid: string
}
type JsonWebKeySet = { keys: MyInfoFapiJwk[] }
type MyInfoFapiKeyPair = { sig: MyInfoFapiJwk; enc: MyInfoFapiJwk }
type MyInfoFapiRpKeys = {
  signingKey: CryptoKey
  sigKid: string
  decryptionKey: CryptoKey
  encKid: string
  encAlg: string
}

let publicJwks: JsonWebKeySet | undefined

/**
 * Retrieves and validates public JWKS from file/SSM if not already cached.
 * Singpass uses public JWKS to validate the client assertion.
 */
export const getPublicJwks = (): Result<
  JsonWebKeySet,
  MyInfoFapiConfigError
> => {
  if (publicJwks) {
    return ok(publicJwks)
  }
  return loadJwks(
    'public',
    spcpMyInfoConfig.myInfoFapiRpJwksPublicPath,
    spcpMyInfoConfig.myInfoFapiRpJwksPublic,
  )
    .andThen(validatePublicKeys)
    .map((keys) => {
      publicJwks = { keys }
      return publicJwks
    })
}

/**
 * Loads the active RP signing and decryption keys as CryptoKeys, failing here
 * rather than inside a later WebCrypto import or response decryption.
 */
export const loadSecretKeys = (): ResultAsync<
  MyInfoFapiRpKeys,
  MyInfoFapiConfigError
> =>
  loadSecretKeyPair().asyncAndThen(({ sig, enc }) =>
    ResultAsync.combine([
      ResultAsync.fromPromise(importEcSigningKey(sig), (error) => {
        logger.error({
          message: 'Failed to import MyInfo FAPI signing key',
          meta: { action: 'loadSecretKeys' },
          error,
        })
        return new MyInfoFapiConfigError()
      }),
      ResultAsync.fromPromise(importEcDecryptionKey(enc), (error) => {
        logger.error({
          message: 'Failed to import MyInfo FAPI decryption key',
          meta: { action: 'loadSecretKeys' },
          error,
        })
        return new MyInfoFapiConfigError()
      }),
    ]).map(([signingKey, decryptionKey]) => ({
      signingKey,
      sigKid: sig.kid,
      decryptionKey,
      encKid: enc.kid,
      encAlg: enc.alg,
    })),
  )

/**
 * Loads JWKS from file/SSM and parses into a JsonWebKeySet.
 */
const loadJwks = (
  which: JwkType,
  preIacFilePath: string,
  postIacJsonString: string,
): Result<JsonWebKeySet, MyInfoFapiConfigError> => {
  const readJwks = Result.fromThrowable(
    () =>
      retrieveJsonContent({
        preIacFilePath,
        postIacJsonString,
      }) as JsonWebKeySet,
    (error) => {
      logger.error({
        message: `MyInfo FAPI ${which} JWKS could not be read`,
        meta: { action: 'loadJwks', which },
        error,
      })
      return new MyInfoFapiConfigError()
    },
  )

  return readJwks().map((jwks) => ({ keys: jwks?.keys ?? [] }))
}

const isEcPublicJwk = (jwk: MyInfoFapiJwk): boolean =>
  jwk.kty === 'EC' && !!jwk.crv && !!jwk.x && !!jwk.y

const isEcPrivateJwk = (jwk: MyInfoFapiJwk): boolean =>
  isEcPublicJwk(jwk) && !!jwk.d

/**
 * Serves every published key rather than the active pair alone, so a rotation
 * can list the outgoing and incoming `kid`s side by side.
 */
const validatePublicKeys = (
  jwks: JsonWebKeySet,
): Result<MyInfoFapiJwk[], MyInfoFapiConfigError> => {
  const { keys } = jwks
  const invalid = (message: string) => {
    logger.error({
      message,
      meta: { action: 'validatePublicKeys' },
    })
    return err(new MyInfoFapiConfigError(message))
  }

  if (
    !keys.some((key) => key.use === 'sig') ||
    !keys.some((key) => key.use === 'enc')
  ) {
    return invalid(`MyInfo FAPI public JWKS needs one 'sig' and one 'enc' key`)
  }
  if (keys.some((key) => key.d || key.k)) {
    return invalid(
      'MyInfo FAPI public JWKS carries private key material; a secret keyset is misprovisioned into the public slot',
    )
  }
  const malformed = keys.find((key) => !isEcPublicJwk(key))
  if (malformed) {
    return invalid(
      `MyInfo FAPI public JWKS key ${malformed.kid} is not a well-formed EC public key`,
    )
  }
  return ok(keys)
}

const loadSecretKeyPair = (): Result<
  MyInfoFapiKeyPair,
  MyInfoFapiConfigError
> =>
  loadJwks(
    'secret',
    spcpMyInfoConfig.myInfoFapiRpJwksSecretPath,
    spcpMyInfoConfig.myInfoFapiRpJwksSecret,
  ).andThen(({ keys }) => {
    const invalid = (message: string) => {
      logger.error({
        message,
        meta: { action: 'loadSecretKeyPair' },
      })
      return err(new MyInfoFapiConfigError(message))
    }
    const sig = keys.find((key) => key.use === 'sig')
    const enc = keys.find((key) => key.use === 'enc')

    if (!sig || !enc) {
      return invalid(
        `MyInfo FAPI secret JWKS needs one 'sig' and one 'enc' key`,
      )
    }
    const malformed = [sig, enc].find((key) => !isEcPrivateJwk(key))
    if (malformed) {
      return invalid(
        `MyInfo FAPI secret JWKS key ${malformed.kid} is not a well-formed EC private key`,
      )
    }
    if (!KEY_MANAGEMENT_ALGORITHMS.includes(enc.alg)) {
      return invalid(
        `MyInfo FAPI secret 'enc' key ${enc.kid} declares unsupported alg ${enc.alg}`,
      )
    }
    return assertPublished({ sig, enc })
  })

/**
 * Ensures the secret key pair is published in the public JWKS.
 * Singpass must resolve each `kid` to the matching public key and purpose.
 */
const assertPublished = (
  pair: MyInfoFapiKeyPair,
): Result<MyInfoFapiKeyPair, MyInfoFapiConfigError> =>
  getPublicJwks().andThen(({ keys }) => {
    const unpublished = [pair.sig, pair.enc].find(
      (secret) =>
        !keys.some(
          (published) =>
            published.kid === secret.kid &&
            published.kty === secret.kty &&
            published.crv === secret.crv &&
            published.x === secret.x &&
            published.y === secret.y &&
            published.use === secret.use &&
            published.alg === secret.alg,
        ),
    )
    if (!unpublished) {
      return ok(pair)
    }
    const message = `MyInfo FAPI public JWKS does not carry a matching key for kid ${unpublished.kid}`
    logger.error({
      message,
      meta: { action: 'assertPublished' },
    })
    return err(new MyInfoFapiConfigError(message))
  })

const ecPublicJwk = ({ kty, crv, x, y }: JsonWebKey): JsonWebKey => ({
  kty,
  crv,
  x,
  y,
})

const ecPrivateJwk = (jwk: JsonWebKey): JsonWebKey => ({
  ...ecPublicJwk(jwk),
  d: jwk.d,
})

export const importEcSigningKey = (jwk: JsonWebKey): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'jwk',
    ecPrivateJwk(jwk),
    { name: 'ECDSA', namedCurve: jwk.crv as string },
    false,
    ['sign'],
  )

/**
 * Dropping `d` yields the matching public key.
 */
export const importEcVerificationKey = (jwk: JsonWebKey): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'jwk',
    ecPublicJwk(jwk),
    { name: 'ECDSA', namedCurve: jwk.crv as string },
    true,
    ['verify'],
  )

const importEcDecryptionKey = (jwk: JsonWebKey): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'jwk',
    ecPrivateJwk(jwk),
    { name: 'ECDH', namedCurve: jwk.crv as string },
    false,
    ['deriveBits'],
  )

export const exportPrivateJwk = (key: CryptoKey): Promise<JsonWebKey> =>
  crypto.subtle.exportKey('jwk', key) as Promise<JsonWebKey>
