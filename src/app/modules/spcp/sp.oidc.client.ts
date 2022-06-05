import axios from 'axios'
import { ObjectId } from 'bson'
import { createPrivateKey, createPublicKey, KeyObject } from 'crypto'
import {
  compactDecrypt,
  JWTPayload,
  jwtVerify,
  JWTVerifyResult,
  SignJWT,
} from 'jose'
import jwkToPem from 'jwk-to-pem'
import NodeCache from 'node-cache'
import { BaseClient, Issuer } from 'openid-client'

import {
  CreateAuthorisationUrlError,
  CreateJwtError,
  GetDecryptionKeyError,
  GetVerificationKeyError,
  InvalidIdTokenError,
  JwkError,
  MissingIdTokenError,
  VerificationKeyError,
} from './sp.oidc.client.errors'
import {
  CryptoKeySet,
  isEC,
  isECPrivate,
  isSigningKey,
  PublicJwks,
  SecretJwks,
  SigningKey,
  SpOidcClientCacheConstructorParams,
  SpOidcClientConstructorParams,
} from './sp.oidc.client.types'

/**
 * Cache class which provides read-through capability and refresh-ahead before expiry
 * Handles discovery and retrieval of NDI's public jwks
 * Exported for testing
 */
export class SpOidcClientCache extends NodeCache {
  #spOidcNdiDiscoveryEndpoint: string
  #spOidcNdiJwksEndpoint: string
  #spOidcRpClientId: string
  #spOidcRpRedirectUrl: string
  #spOidcRpSecretJwks: SecretJwks

  constructor({
    options,
    spOidcNdiDiscoveryEndpoint,
    spOidcNdiJwksEndpoint,
    spOidcRpClientId,
    spOidcRpRedirectUrl,
    spOidcRpSecretJwks,
  }: SpOidcClientCacheConstructorParams) {
    super(options)

    this.#spOidcNdiDiscoveryEndpoint = spOidcNdiDiscoveryEndpoint
    this.#spOidcNdiJwksEndpoint = spOidcNdiJwksEndpoint
    this.#spOidcRpClientId = spOidcRpClientId
    this.#spOidcRpRedirectUrl = spOidcRpRedirectUrl
    this.#spOidcRpSecretJwks = spOidcRpSecretJwks

    // On expiry, refresh cache. If fail to refresh, log but do not throw error.
    this.on('expired', () =>
      this.refresh().catch((err) =>
        console.error(`Failed to refresh cache on expiry. Reason: ${err}`),
      ),
    )

    // Trigger refresh on instantiation to populate cache. If fail to refresh, log but do not throw error.
    void this.refresh().catch((err) =>
      console.error(`Failed to refresh cache on expiry. Reason: ${err}`),
    )
  }

  async getNdiPublicKeys(): Promise<CryptoKeySet> {
    const ndiPublicKeys: CryptoKeySet | undefined = this.get('ndiPublicKeys')
    if (!ndiPublicKeys) {
      const { ndiPublicKeys } = await this.refresh()
      return ndiPublicKeys
    }
    return ndiPublicKeys
  }

  async getBaseClient(): Promise<BaseClient> {
    const baseClient: BaseClient | undefined = this.get('baseClient')
    if (!baseClient) {
      const { baseClient } = await this.refresh()
      return baseClient
    }
    return baseClient
  }

  async refresh(): Promise<{
    ndiPublicKeys: CryptoKeySet
    baseClient: BaseClient
  }> {
    const [ndiPublicKeys, baseClient] = await Promise.all([
      this.retrievePublicKeysFromNdi(),
      this.retrieveBaseClientFromNdi(),
    ])

    this.set('ndiPublicKeys', ndiPublicKeys, 3600) // TTL of 60 minutes
    this.set('baseClient', baseClient, 3600) // TTL of 60 minutes
    this.set('expiry', 'expiry', 3000) // set expiry key with TTL of 50 minutes, to trigger refresh ahead
    return { ndiPublicKeys, baseClient }
  }

  async retrievePublicKeysFromNdi(): Promise<CryptoKeySet> {
    const spOidcNdiPublicJwks = await axios
      .get<PublicJwks>(this.#spOidcNdiJwksEndpoint)
      .then(({ data }) => data)

    return spOidcNdiPublicJwks.keys.map((jwk) => {
      if (!isEC(jwk) || !jwk.kid || !jwk.use) {
        throw new JwkError()
      }
      return {
        kid: jwk.kid,
        use: jwk.use,
        key: createPublicKey(jwkToPem(jwk)), // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
      }
    })
  }

  async retrieveBaseClientFromNdi(): Promise<BaseClient> {
    const issuer = await Issuer.discover(this.#spOidcNdiDiscoveryEndpoint)

    const baseClient = new issuer.Client(
      {
        client_id: this.#spOidcRpClientId,
        token_endpoint_auth_method: 'private_key_jwt',
        redirect_uris: [this.#spOidcRpRedirectUrl],
      },
      this.#spOidcRpSecretJwks,
    )

    return baseClient
  }
}

/**
 * Wrapper around the openid-client library to carry out authentication related tasks with Singpass NDI,
 * and provides methods for decryption and verification of JWE/JWS returned by NDI after authorisation code exchange
 */
export class SpOidcClient {
  #spOidcRpSecretKeys: CryptoKeySet
  #spOidcRpPublicKeys: CryptoKeySet
  #spOidcRpPublicJwks: PublicJwks
  #spOidcClientCache: SpOidcClientCache
  #spOidcRpRedirectUrl: string

  /**
   * Constructor for client
   * @param config
   */
  constructor(config: SpOidcClientConstructorParams) {
    const {
      spOidcRpClientId,
      spOidcRpRedirectUrl,
      spOidcNdiDiscoveryEndpoint,
      spOidcNdiJwksEndpoint,
      spOidcRpSecretJwks,
      spOidcRpPublicJwks,
    } = config

    this.#spOidcClientCache = new SpOidcClientCache({
      spOidcNdiDiscoveryEndpoint,
      spOidcNdiJwksEndpoint,
      spOidcRpClientId,
      spOidcRpRedirectUrl,
      spOidcRpSecretJwks,
      options: {
        useClones: false,
      },
    })

    this.#spOidcRpPublicJwks = spOidcRpPublicJwks
    this.#spOidcRpRedirectUrl = spOidcRpRedirectUrl

    this.#spOidcRpSecretKeys = spOidcRpSecretJwks.keys.map((jwk) => {
      if (!jwk.alg) {
        throw new JwkError('alg attribute not present on rp secret jwk')
      }

      if (!isECPrivate(jwk)) {
        throw new JwkError()
      }

      const cryptoKeySet = {
        kid: jwk.kid,
        use: jwk.use,
        alg: jwk.alg,
        key: createPrivateKey(jwkToPem(jwk, { private: true })), // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
      }

      return cryptoKeySet
    })

    this.#spOidcRpPublicKeys = spOidcRpPublicJwks.keys.map((jwk) => {
      if (!jwk.alg) {
        throw new JwkError('alg attribute not present on rp public jwk')
      }

      if (!isEC(jwk)) {
        throw new JwkError()
      }

      const cryptoKeySet = {
        kid: jwk.kid,
        use: jwk.use,
        alg: jwk.alg,
        key: createPublicKey(jwkToPem(jwk)), // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
      }

      return cryptoKeySet
    })
  }

  /**
   * Method to retrieve NDI's public keys
   * @async
   * @returns NDI's Public Key
   */
  async getNdiPublicKeysFromCache(): Promise<CryptoKeySet> {
    return this.#spOidcClientCache.getNdiPublicKeys()
  }

  /**
   * Method to retrieve baseClient
   * @async
   * @returns baseClient from discovery of NDI's discovery endpoint
   */
  async getBaseClientFromCache(): Promise<BaseClient> {
    return this.#spOidcClientCache.getBaseClient()
  }

  /**
   * Method to generate url to SP login page for authorisation
   * @param state - contains formId, remember me, and stored queryId
   * @param esrvcId - eServiceId
   * @return authorisation url
   * @return CreateAuthorisationUrlError if state or esrvcId is undefined
   */
  async createAuthorisationUrl(
    state: string,
    esrvcId: string,
  ): Promise<string> {
    if (!state) {
      throw new CreateAuthorisationUrlError(
        'Undefined state, failed to create redirect url.',
      )
    }
    if (!esrvcId) {
      throw new CreateAuthorisationUrlError(
        'Undefined esrvcId, failed to create redirect url.',
      )
    }

    const baseClient = await this.getBaseClientFromCache()

    const authorisationUrl = baseClient.authorizationUrl({
      scope: 'openid',
      response_type: 'code',
      state: state,
      esrvc: esrvcId,
      nonce: String(new ObjectId()), // Not used - nonce is a required parameter for SPCP's OIDC implementation although it is optional in OIDC specs
    })

    return authorisationUrl
  }

  /**
   * Method to select the correct decryption key based on kid value of jwe
   * @param jwe
   * @param keySet keySet to choose from
   * @returns decryptKey
   * @returns KidError if unable to find decryption key
   */
  getDecryptionKey(
    jwe: string,
    keySet: CryptoKeySet,
  ): KeyObject | GetDecryptionKeyError {
    // Choose the correct decryption key for the jwe
    if (!jwe) {
      return new GetDecryptionKeyError('jwe is empty')
    }

    const kidJwe: string | undefined = JSON.parse(
      Buffer.from(jwe.split('.')[0], 'base64').toString(),
    )['kid']

    if (!kidJwe) {
      return new GetDecryptionKeyError(
        'getDecryptionKey failed, no kid in idToken JWE',
      )
    }
    const possibleDecryptKeys = keySet.filter((key) => key.kid === kidJwe)
    if (possibleDecryptKeys.length === 0) {
      return new GetDecryptionKeyError(
        'getDecryptionKey failed, no decryption key matches jwe kid',
      )
    }
    const decryptKey = possibleDecryptKeys[0].key
    return decryptKey
  }

  /**
   * Method to select the correct verification key based on kid value of jws
   * @param jws
   * @param keySet keySet to choose from
   * @returns verificationKey
   * @returns KidError is unable to find verification key
   */
  getVerificationKey(
    jws: string,
    keySet: CryptoKeySet,
  ): KeyObject | GetVerificationKeyError {
    if (!jws) {
      return new GetVerificationKeyError('jws is empty')
    }

    const kidJws: string | undefined = JSON.parse(
      Buffer.from(jws.split('.')[0], 'base64').toString(),
    )['kid']

    if (!kidJws) {
      return new GetVerificationKeyError(
        'getVerificationKey failed, no kid in JWS',
      )
    }
    const possibleVerificationKeys = keySet.filter((key) => key.kid === kidJws)
    if (possibleVerificationKeys.length === 0) {
      return new GetVerificationKeyError(
        'getVerificationKey failed, no decryption key matches jws kid',
      )
    }
    const verificationKey = possibleVerificationKeys[0].key

    return verificationKey
  }

  /**
   * Method to exchange authorisation code for idToken from NDI and then decode and verify it
   * @async
   * @param authCode authorisation code provided from browser after authorisation
   * @returns Decoded and verified idToken
   */
  async exchangeAuthCodeAndDecodeVerifyToken(
    authCode: string,
  ): Promise<JWTVerifyResult> {
    const baseClient = await this.getBaseClientFromCache()
    // Exchange Auth Code for tokenSet

    const tokenSet = await baseClient.grant({
      grant_type: 'authorization_code',
      redirect_uri: this.#spOidcRpRedirectUrl,
      code: authCode,
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    })

    // Retrieve idToken from tokenSet
    const { id_token: idToken } = tokenSet

    if (!idToken) {
      throw new MissingIdTokenError()
    }

    // Get the correct decryption key
    const decryptKeyResult = this.getDecryptionKey(
      idToken,
      this.#spOidcRpSecretKeys,
    )
    if (decryptKeyResult instanceof GetDecryptionKeyError) {
      throw decryptKeyResult
    }

    // Decrypt using decryption key
    const decoder = new TextDecoder()

    const decryptedIdToken = await compactDecrypt(
      idToken,
      decryptKeyResult,
    ).then((result) => decoder.decode(result.plaintext))

    // Choose the correct verification key for the jws
    const ndiPublicKeys = await this.getNdiPublicKeysFromCache()

    const verificationKeyResult = this.getVerificationKey(
      decryptedIdToken,
      ndiPublicKeys,
    )

    if (verificationKeyResult instanceof GetVerificationKeyError) {
      throw verificationKeyResult
    }

    // Verify using verification key
    const verifiedIdToken = await jwtVerify(
      decryptedIdToken,
      verificationKeyResult,
    )

    return verifiedIdToken
  }

  /**
   * Method to extract NRIC from decrypted and verified idToken
   * @param idToken decrypted and verified idToken
   * @returns nric string
   */
  extractNricFromIdToken(
    idToken: JWTVerifyResult,
  ): string | InvalidIdTokenError {
    if (!idToken.payload.sub) {
      return new InvalidIdTokenError('sub attribute missing in idToken payload')
    }
    const nricMatches = idToken.payload.sub.match(/s=([STFG])(\d{7})([A-Z])/g)
    if (!nricMatches) {
      return new InvalidIdTokenError(
        'NRIC not found in idToken payload sub attribute',
      )
    }

    const nric = nricMatches[0].substring(2)

    return nric
  }

  /**
   * Creates a JSON Web Token (JWT) for a web session authenticated by SingPass
   * @param  payload - Payload to sign
   * @param  expiresIn - The lifetime of the jwt token
   * @return the created JWT
   */
  async createJWT(
    payload: Record<string, unknown>,
    expiresIn: string | number,
  ): Promise<string> {
    const possibleSigningKeys = this.#spOidcRpSecretKeys.filter(
      (key): key is SigningKey => isSigningKey(key),
    )

    if (possibleSigningKeys.length === 0) {
      throw new CreateJwtError('Create JWT failed. No signing keys found.')
    }

    const signingKey = possibleSigningKeys[0]

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: signingKey.alg, kid: signingKey.kid })
      .setExpirationTime(expiresIn)
      .sign(signingKey.key)

    return jwt
  }

  /**
   * Verifies a JWT for SingPass authenticated session
   * @param  jwt - The JWT to verify
   * @return the decoded payload
   */
  async verifyJwt(jwt: string): Promise<JWTPayload> {
    const verificationKeyResult = this.getVerificationKey(
      jwt,
      this.#spOidcRpPublicKeys,
    )
    if (verificationKeyResult instanceof GetVerificationKeyError) {
      throw new VerificationKeyError(
        'Verify JWT failed, no verification key found',
      )
    }

    const { payload } = await jwtVerify(jwt, verificationKeyResult)

    return payload
  }

  get rpPublicJwks(): PublicJwks {
    return this.#spOidcRpPublicJwks
  }
}
