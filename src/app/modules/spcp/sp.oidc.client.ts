import axios from 'axios'
import { createPrivateKey, createPublicKey, KeyObject } from 'crypto'
import {
  compactDecrypt,
  decodeProtectedHeader,
  JWTPayload,
  jwtVerify,
  JWTVerifyResult,
  SignJWT,
} from 'jose'
import jwkToPem from 'jwk-to-pem'
import NodeCache from 'node-cache'
import { BaseClient, Issuer } from 'openid-client'
import { ulid } from 'ulid'

import {
  CreateAuthorisationUrlError,
  CreateJwtError,
  ExchangeAuthTokenError,
  GetDecryptionKeyError,
  GetVerificationKeyError,
  InvalidIdTokenError,
  JwkError,
  MissingIdTokenError,
  VerificationKeyError,
} from './sp.oidc.client.errors'
import {
  CryptoKeys,
  PublicJwks,
  Refresh,
  SecretJwks,
  SigningKey,
  SpOidcClientCacheConstructorParams,
  SpOidcClientConstructorParams,
} from './sp.oidc.client.types'
import {
  isEC,
  isECPrivate,
  isSigningKey,
  retryPromiseForever,
  retryPromiseThreeAttempts,
} from './sp.oidc.util'

// Name of keys in cache
const BASE_CLIENT_NAME = 'baseClient'
const NDI_PUBLIC_KEY_NAME = 'ndiPublicKeys'
const EXPIRY_NAME = 'expiry'

/**
 * Cache class which provides read-through capability and refresh-ahead before expiry
 * Handles discovery and retrieval of NDI's public jwks
 * Exported for testing
 */
export class SpOidcClientCache {
  #cache: NodeCache
  #spOidcNdiDiscoveryEndpoint: string
  #spOidcNdiJwksEndpoint: string
  #spOidcRpClientId: string
  #spOidcRpRedirectUrl: string
  #spOidcRpSecretJwks: SecretJwks
  #refreshPromise?: Promise<Refresh> // Stores the refresh promise so that there is at most one in-flight refresh at any point in time. Stored promise is always pending

  /**
   * Constructor for cache
   * On instantiation, trigger a refresh to populate the cache
   */
  constructor({
    options,
    spOidcNdiDiscoveryEndpoint,
    spOidcNdiJwksEndpoint,
    spOidcRpClientId,
    spOidcRpRedirectUrl,
    spOidcRpSecretJwks,
  }: SpOidcClientCacheConstructorParams) {
    this.#spOidcNdiDiscoveryEndpoint = spOidcNdiDiscoveryEndpoint
    this.#spOidcNdiJwksEndpoint = spOidcNdiJwksEndpoint
    this.#spOidcRpClientId = spOidcRpClientId
    this.#spOidcRpRedirectUrl = spOidcRpRedirectUrl
    this.#spOidcRpSecretJwks = spOidcRpSecretJwks
    this.#cache = new NodeCache(options)

    // On expiry, refresh cache. If fail to refresh, log but do not throw error.
    this.#cache.on('expired', () =>
      this.refresh().catch((err) =>
        console.warn(
          `Attempted but failed to refresh sp oidc cache on expiry. Reason: ${err}`,
        ),
      ),
    )

    // Trigger refresh on instantiation to populate cache. If fail to refresh, log but do not throw error.
    void this.refresh().catch((err) =>
      console.warn(
        `Attempted but failed to refresh sp oidc on instantiation. Reason: ${err}`,
      ),
    )
  }

  /**
   * Method to retrieve NDI's public keys from cache
   * @async
   * @returns NDI's public keys
   * @throws error if refresh fails
   */
  async getNdiPublicKeys(): Promise<CryptoKeys> {
    const ndiPublicKeys = this.#cache.get<CryptoKeys>(NDI_PUBLIC_KEY_NAME)
    if (!ndiPublicKeys) {
      const { ndiPublicKeys } = await this.refresh()
      return ndiPublicKeys
    }
    return ndiPublicKeys
  }

  /**
   * Method to retrieve base client from cache
   * Triggers a refresh
   * @async
   * @returns Base client
   * @throws error if refresh fails
   */
  async getBaseClient(): Promise<BaseClient> {
    const baseClient = this.#cache.get<BaseClient>(BASE_CLIENT_NAME)
    if (!baseClient) {
      const { baseClient } = await this.refresh()
      return baseClient
    }
    return baseClient
  }

  /**
   * Method to create a promise to fetch NDI's public keys and
   * discover the well known endpoint to construct the base client,
   * and store NDI's public key and base client in cache
   * Sets `expiry` key in cache with TTL of 1hour to attempt refresh ahead
   * Refresh ahead will attempt infinite number of times with exponential backoff in time between retries
   * @returns object {ndiPublicKeys, baseClient}
   * @async
   * @throws error if retrievePublicKeysFromNdi or retrieveBaseClientFromNdi fails
   */
  async createRefreshPromise(): Promise<Refresh> {
    const [ndiPublicKeys, baseClient] = await retryPromiseForever(
      Promise.all([
        this.retrievePublicKeysFromNdi(),
        this.retrieveBaseClientFromNdi(),
      ]),
    )

    this.#cache.set(NDI_PUBLIC_KEY_NAME, ndiPublicKeys) // No TTL - key will be kept forever until refresh is successful on expiry of EXPIRY_NAME key
    this.#cache.set(BASE_CLIENT_NAME, baseClient) // No TTL - key will be kept forever until refresh is successful on expiry of EXPIRY_NAME key
    this.#cache.set(EXPIRY_NAME, 'expiry', 3600) // set expiry key with TTL of 1 hour, to trigger refresh ahead (note that expiry check is done every 60s)
    return { ndiPublicKeys, baseClient }
  }

  /**
   * Returns stored refresh promise if it exists and is pending, or else
   * calls createRefreshPromise(), saves the refresh promise and returns it
   * @returns object {ndiPublicKeys, baseClient}
   * @async
   */
  async refresh(): Promise<Refresh> {
    // If promise does not exist, create and store the promise
    if (!this.#refreshPromise) {
      this.#refreshPromise = this.createRefreshPromise().finally(() => {
        this.#refreshPromise = undefined // Clean up once promise is fulfilled
      })
    }

    // Return the refresh promise
    return this.#refreshPromise
  }

  /**
   * Method to make network call to retrieve public JWKS from NDI
   * Max of 3 attemps with timeout of 3s per attempt as per NDI specs
   * @async
   * @returns NDI's public keys
   * @throws JwkError if keys are not the correct shape
   */
  async retrievePublicKeysFromNdi(): Promise<CryptoKeys> {
    const getJwksWithRetries = retryPromiseThreeAttempts(
      axios.get<PublicJwks>(this.#spOidcNdiJwksEndpoint),
    )

    const { data: spOidcNdiPublicJwks } = await getJwksWithRetries

    return spOidcNdiPublicJwks.keys.map((jwk) => {
      if (!isEC(jwk) || !jwk.kid || !jwk.use) {
        throw new JwkError()
      }
      return {
        kid: jwk.kid,
        use: jwk.use,
        // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
        // TODO (#4021): load JWK directly after node upgrade
        key: createPublicKey(jwkToPem(jwk)),
      }
    })
  }

  /**
   * Method to make network call to NDI's discovery endpoint and construct the base client
   * Max of 3 attemps with timeout of 3s per attempt as per NDI specs
   * @async
   * @returns Base client
   */
  async retrieveBaseClientFromNdi(): Promise<BaseClient> {
    const getIssuerWithRetries = retryPromiseThreeAttempts(
      Issuer.discover(this.#spOidcNdiDiscoveryEndpoint),
    )

    const issuer = await getIssuerWithRetries

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
  #spOidcRpSecretKeys: CryptoKeys
  #spOidcRpPublicKeys: CryptoKeys
  #spOidcClientCache: SpOidcClientCache
  #spOidcRpRedirectUrl: string

  /**
   * Constructor for client
   * @param config
   * @throws JwkError if RP's secret or public keys are not of correct shape
   */
  constructor({
    spOidcRpClientId,
    spOidcRpRedirectUrl,
    spOidcNdiDiscoveryEndpoint,
    spOidcNdiJwksEndpoint,
    spOidcRpSecretJwks,
    spOidcRpPublicJwks,
  }: SpOidcClientConstructorParams) {
    this.#spOidcClientCache = new SpOidcClientCache({
      spOidcNdiDiscoveryEndpoint,
      spOidcNdiJwksEndpoint,
      spOidcRpClientId,
      spOidcRpRedirectUrl,
      spOidcRpSecretJwks,
      options: {
        useClones: false,
        checkperiod: 60, // Check cache expiry every 60 seconds
      },
    })

    this.#spOidcRpRedirectUrl = spOidcRpRedirectUrl

    this.#spOidcRpSecretKeys = spOidcRpSecretJwks.keys.map((jwk) => {
      if (!jwk.alg) {
        throw new JwkError('alg attribute not present on rp secret jwk')
      }

      if (!isECPrivate(jwk)) {
        throw new JwkError()
      }

      const cryptoKeys = {
        kid: jwk.kid,
        use: jwk.use,
        alg: jwk.alg,
        // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
        // TODO (#4021): load JWK directly after node upgrade
        key: createPrivateKey(jwkToPem(jwk, { private: true })),
      }

      return cryptoKeys
    })

    this.#spOidcRpPublicKeys = spOidcRpPublicJwks.keys.map((jwk) => {
      if (!jwk.alg) {
        throw new JwkError('alg attribute not present on rp public jwk')
      }

      if (!isEC(jwk)) {
        throw new JwkError()
      }

      const cryptoKeys = {
        kid: jwk.kid,
        use: jwk.use,
        alg: jwk.alg,
        // Conversion to pem is necessary because in node 14, crypto does not support import of JWK directly
        // TODO (#4021): load JWK directly after node upgrade
        key: createPublicKey(jwkToPem(jwk)),
      }

      return cryptoKeys
    })
  }

  /**
   * Method to retrieve NDI's public keys from cache
   * @async
   * @returns NDI's Public Key
   */
  async getNdiPublicKeysFromCache(): Promise<CryptoKeys> {
    return this.#spOidcClientCache.getNdiPublicKeys()
  }

  /**
   * Method to retrieve baseClient from cache
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
   * @throws CreateAuthorisationUrlError if state or esrvcId is undefined
   */
  async createAuthorisationUrl(
    state: string,
    esrvcId: string,
  ): Promise<string> {
    if (!state) {
      throw new CreateAuthorisationUrlError(
        'Empty state, failed to create redirect url.',
      )
    }
    if (!esrvcId) {
      throw new CreateAuthorisationUrlError(
        'Empty esrvcId, failed to create redirect url.',
      )
    }

    const baseClient = await this.getBaseClientFromCache()

    const authorisationUrl = baseClient.authorizationUrl({
      scope: 'openid',
      response_type: 'code',
      state: state,
      esrvc: esrvcId,
      nonce: ulid(), // Not used - nonce is a required parameter for SPCP's OIDC implementation although it is optional in OIDC specs
    })

    return authorisationUrl
  }

  /**
   * Method to select the correct decryption key based on kid value of jwe
   * @param jwe
   * @param keys keys to choose from
   * @returns decryptKey
   * @returns GetDecryptionKeyError if unable to find decryption key
   */
  getDecryptionKey(
    jwe: string,
    keys: CryptoKeys,
  ): KeyObject | GetDecryptionKeyError {
    // Choose the correct decryption key for the jwe
    if (!jwe) {
      return new GetDecryptionKeyError('jwe is empty')
    }

    const { kid } = decodeProtectedHeader(jwe)

    if (!kid) {
      return new GetDecryptionKeyError(
        'getDecryptionKey failed, no kid in idToken JWE',
      )
    }
    const possibleDecryptKeys = keys.filter((key) => key.kid === kid)
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
   * @param keys keys to choose from
   * @returns verificationKey
   * @returns GetVerificationKeyError is unable to find verification key
   */
  getVerificationKey(
    jws: string,
    keys: CryptoKeys,
  ): KeyObject | GetVerificationKeyError {
    if (!jws) {
      return new GetVerificationKeyError('jws is empty')
    }

    const { kid } = decodeProtectedHeader(jws)
    if (!kid) {
      return new GetVerificationKeyError(
        'getVerificationKey failed, no kid in JWS',
      )
    }

    const possibleVerificationKeys = keys.filter((key) => key.kid === kid)
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
   * @throws MissingIdTokenError if id token is missing in tokenSet
   * @throws GetDecryptionKeyError if unable to retrieve decryption key
   * @throws GetVerificationKeyError if unable to retrieve verification key
   * @throws ExchangeAuthTokenError if exchange fails for any other reason
   */
  async exchangeAuthCodeAndDecodeVerifyToken(
    authCode: string,
  ): Promise<JWTVerifyResult> {
    const baseClient = await this.getBaseClientFromCache()

    try {
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
    } catch (err) {
      // If any error in the exchange, trigger refresh of cache. Possible sources of failure are:
      // NDI changed /token endpoint url, hence need to rediscover well-known endpoint
      // NDI changed the signing keys without broadcasting both old and new keys for the 1h cache duration, hence need to refetch keys
      void this.#spOidcClientCache.refresh()
      if (err instanceof Error) {
        throw err
      } else {
        throw new ExchangeAuthTokenError()
      }
    }
  }
  /**
   * Method to extract NRIC from decrypted and verified idToken
   * @param idToken decrypted and verified idToken
   * @returns nric string
   * @returns InvalidIdTokenError is nric not found in idToken
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
   * @throws CreateJwtError if no signing keys found in RP's secret keys
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

    const signingKey = possibleSigningKeys[0] // Can use any of the RP's secret keys. For key rotation, we need to expose the RP's old + new public signing keys for 1h (to allow NDI to refresh cache), and then load only the new secret signing key on our servers.

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
   * @throws VerificationKeyError if no verification key found
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
}
