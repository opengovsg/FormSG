import crypto from 'crypto'
import { err, ok, Result, ResultAsync } from 'neverthrow'
import * as client from 'openid-client'

import config from '../../../config/config'
import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../../config/logger'
import { retrieveJsonContent } from '../../../utils/iac'

import { MyInfoFapiConfigError } from './myinfo.fapi.errors'

const logger = createLoggerWithLabel(module)

const REQUEST_TIMEOUT_SECONDS = 10
const CONTENT_ENCRYPTION_ALGORITHMS = ['A256CBC-HS512', 'A256GCM']

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

let publicJwks: JsonWebKeySet | undefined

/**
 * Retrieves the public JWKS from the file system or the SSM param store.
 * @returns The public JWKS.
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
  ).map(({ sig, enc }) => {
    publicJwks = { keys: [sig, enc] }
    return publicJwks
  })
}

let configResult:
  | ResultAsync<client.Configuration, MyInfoFapiConfigError>
  | undefined

/**
 * Retrieves the MyInfo FAPI client configuration from the file system or the SSM param store.
 * @returns The MyInfo FAPI client configuration.
 */
export const getConfiguration = (): ResultAsync<
  client.Configuration,
  MyInfoFapiConfigError
> => {
  if (!configResult) {
    configResult = buildConfiguration().mapErr((error) => {
      // Evict the memo so a transient discovery failure is retried, not cached.
      configResult = undefined
      return error
    })
  }
  return configResult
}

const loadSecretKeys = (): ResultAsync<
  {
    signingKey: CryptoKey
    sigKid: string
    decryptionKey: CryptoKey
    encKid: string
    encAlg: string
  },
  MyInfoFapiConfigError
> =>
  loadJwks(
    'secret',
    spcpMyInfoConfig.myInfoFapiRpJwksSecretPath,
    spcpMyInfoConfig.myInfoFapiRpJwksSecret,
  ).asyncAndThen(({ sig, enc }) =>
    ResultAsync.combine([
      ResultAsync.fromPromise(importEcSigningKey(sig), (error) =>
        configError(
          'secret',
          'Failed to import MyInfo FAPI signing key',
          error,
        ),
      ),
      ResultAsync.fromPromise(importEcDecryptionKey(enc), (error) =>
        configError(
          'secret',
          'Failed to import MyInfo FAPI decryption key',
          error,
        ),
      ),
    ]).map(([signingKey, decryptionKey]) => ({
      signingKey,
      sigKid: sig.kid,
      decryptionKey,
      encKid: enc.kid,
      encAlg: enc.alg,
    })),
  )

/**
 * Calls the MyInfo FAPI discovery endpoint and initialises the client configuration.
 * @returns The MyInfo FAPI client configuration.
 */
const buildConfiguration = (): ResultAsync<
  client.Configuration,
  MyInfoFapiConfigError
> =>
  loadSecretKeys().andThen((keys) =>
    ResultAsync.fromPromise(
      (async () => {
        const configuration = await client.discovery(
          new URL(spcpMyInfoConfig.myInfoFapiIssuer),
          spcpMyInfoConfig.myInfoFapiClientId,
          undefined,
          client.PrivateKeyJwt(
            { key: keys.signingKey, kid: keys.sigKid },
            {
              // Singpass rejects a client assertion without typ, openid-client omits it.
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
      })(),
      (error) => {
        logger.error({
          message: 'MyInfo FAPI client discovery failed',
          meta: { action: 'getConfiguration' },
          error,
        })
        return new MyInfoFapiConfigError()
      },
    ),
  )

const configError = (
  which: JwkType,
  message: string,
  error?: unknown,
): MyInfoFapiConfigError => {
  logger.error({
    message,
    meta: { action: 'loadJwks', which },
    error,
  })
  return new MyInfoFapiConfigError(message)
}

const loadJwks = (
  which: JwkType,
  preIacFilePath: string,
  postIacJsonString: string,
): Result<MyInfoFapiKeyPair, MyInfoFapiConfigError> => {
  const readJwks = Result.fromThrowable(
    () =>
      retrieveJsonContent({
        preIacFilePath,
        postIacJsonString,
      }) as JsonWebKeySet,
    (error) =>
      configError(which, `MyInfo FAPI ${which} JWKS could not be read`, error),
  )

  return readJwks().andThen((jwks) => {
    const keys = jwks?.keys ?? []
    const sig = keys.find((key) => key.use === 'sig')
    const enc = keys.find((key) => key.use === 'enc')
    if (!sig || !enc) {
      return err(
        configError(
          which,
          `MyInfo FAPI ${which} JWKS needs one 'sig' and one 'enc' key`,
        ),
      )
    }
    if (which === 'public' && (sig.d || enc.d)) {
      return err(
        configError(
          which,
          `MyInfo FAPI public JWKS carries private key material; a secret keyset is misprovisioned into the public slot`,
        ),
      )
    }
    return ok({ sig, enc })
  })
}

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
 * Dropping `d` yields the matching public key, used for the DPoP public half.
 * @param jwk - The JSON Web Key.
 * @returns The JSON Web Key.
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

/**
 * Exports the private JWK from the CryptoKey.
 * @param key - The CryptoKey.
 * @returns The private JWK.
 */
export const exportPrivateJwk = (key: CryptoKey): Promise<JsonWebKey> =>
  crypto.subtle.exportKey('jwk', key) as Promise<JsonWebKey>
