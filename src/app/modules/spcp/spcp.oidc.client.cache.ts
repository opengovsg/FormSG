import axios from 'axios'
import { createPublicKey } from 'crypto'
import jwkToPem from 'jwk-to-pem'
import NodeCache from 'node-cache'
import { BaseClient, Issuer } from 'openid-client'
import { timeout, TimeoutError } from 'promise-timeout'

import { createLoggerWithLabel } from '../../config/logger'

import { JwkError } from './spcp.oidc.client.errors'
import {
  CryptoKeys,
  PublicJwks,
  Refresh,
  SecretJwks,
  SpcpOidcBaseClientCacheConstructorParams,
} from './spcp.oidc.client.types'
import {
  isEC,
  retryPromiseForever,
  retryPromiseThreeAttempts,
} from './spcp.oidc.util'

const logger = createLoggerWithLabel(module)

// Name of keys in cache
const BASE_CLIENT_NAME = 'baseClient'
const NDI_PUBLIC_KEY_NAME = 'ndiPublicKeys'
const EXPIRY_NAME = 'expiry'

// Timeout for getNdiPublicKeys and getBaseClient when cache is first being populated
// Prevents accumulation of callers if refresh never resolves
const INITIAL_REFRESH_TIMEOUT = 10000

/**
 * Cache class which provides read-through capability and refresh-ahead before expiry
 * Handles discovery and retrieval of NDI's public jwks
 */
export class SpcpOidcBaseClientCache {
  /**
   * Cache to store NDI's keys and client
   * @private
   * accessible only for testing
   */
  _cache: NodeCache

  /**
   * Stores the refresh promise so that there is at most
   * one in-flight refresh at any point in time.
   * Stored promise is always pending
   * @private
   * accessible only for testing
   */
  _refreshPromise?: Promise<Refresh>

  #ndiDiscoveryEndpoint: string
  #ndiJwksEndpoint: string
  #rpClientId: string
  #rpRedirectUrl: string
  #rpSecretJwks: SecretJwks

  /**
   * Constructor for cache
   * On instantiation, trigger a refresh to populate the cache
   */
  constructor({
    options,
    ndiDiscoveryEndpoint,
    ndiJwksEndpoint,
    rpClientId,
    rpRedirectUrl,
    rpSecretJwks,
  }: SpcpOidcBaseClientCacheConstructorParams) {
    this.#ndiDiscoveryEndpoint = ndiDiscoveryEndpoint
    this.#ndiJwksEndpoint = ndiJwksEndpoint
    this.#rpClientId = rpClientId
    this.#rpRedirectUrl = rpRedirectUrl
    this.#rpSecretJwks = rpSecretJwks
    this._cache = new NodeCache(options)

    // On expiry, refresh cache.
    this._cache.on('expired', () => this.refresh())

    // Trigger refresh on instantiation to populate cache.
    void this.refresh()
  }

  /**
   * Method to retrieve NDI's public keys from cache
   * @async
   * @returns NDI's public keys
   * @throws error if refresh does not complete within 10s
   */
  async getNdiPublicKeys(): Promise<CryptoKeys> {
    const ndiPublicKeys = this._cache.get<CryptoKeys>(NDI_PUBLIC_KEY_NAME)
    if (!ndiPublicKeys) {
      const { ndiPublicKeys } = await timeout(
        this.refresh(),
        INITIAL_REFRESH_TIMEOUT,
      ).catch((err) => {
        if (err instanceof TimeoutError) {
          logger.warn({
            message: 'Failed to retrieve ndiPublicKeys at start',
            meta: {
              action: 'getNdiPublicKeys',
            },
            error: err,
          })
        }
        throw err
      })

      return ndiPublicKeys
    }
    return ndiPublicKeys
  }

  /**
   * Method to retrieve base client from cache
   * Triggers a refresh
   * @async
   * @returns Base client
   * @throws error if refresh does not complete within 10s
   */
  async getBaseClient(): Promise<BaseClient> {
    const baseClient = this._cache.get<BaseClient>(BASE_CLIENT_NAME)
    if (!baseClient) {
      const { baseClient } = await timeout(
        this.refresh(),
        INITIAL_REFRESH_TIMEOUT,
      ).catch((err) => {
        if (err instanceof TimeoutError) {
          logger.warn({
            message: 'Failed to retrieve baseClient at start',
            meta: {
              action: 'getBaseClient',
            },
            error: err,
          })
        }
        throw err
      })

      return baseClient
    }
    return baseClient
  }

  /**
   * Method to create a promise to fetch NDI's public keys and
   * discover the well known endpoint to construct the base client,
   * and store NDI's public key and base client in cache
   * Sets `expiry` key in cache with TTL of 1hour to attempt refresh ahead
   * Will retry infinite number of times until success, with each retry consisting of
   * at most 3 back-to-back attempts (retryPromiseThreeAttempts), and
   * 10s between each retry
   * @returns object {ndiPublicKeys, baseClient}
   * @async
   * @throws error if retrievePublicKeysFromNdi or retrieveBaseClientFromNdi fails
   */
  async createRefreshPromise(): Promise<Refresh> {
    const [ndiPublicKeys, baseClient] = await retryPromiseForever(
      () =>
        Promise.all([
          this.retrievePublicKeysFromNdi(),
          this.retrieveBaseClientFromNdi(),
        ]),
      `Promise.all([this.retrievePublicKeysFromNdi(), this.retrieveBaseClientFromNdi()])`,
    )

    this._cache.set(NDI_PUBLIC_KEY_NAME, ndiPublicKeys) // No TTL - key will be kept forever until refresh is successful on expiry of EXPIRY_NAME key
    this._cache.set(BASE_CLIENT_NAME, baseClient) // No TTL - key will be kept forever until refresh is successful on expiry of EXPIRY_NAME key
    this._cache.set(EXPIRY_NAME, 'expiry', 3600) // set expiry key with TTL of 1 hour, to trigger refresh ahead (note that expiry check is done every 60s)
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
    if (!this._refreshPromise) {
      this._refreshPromise = this.createRefreshPromise().finally(() => {
        this._refreshPromise = undefined // Clean up once promise is fulfilled
      })
    }

    // Return the refresh promise
    return this._refreshPromise
  }

  /**
   * Method to make network call to retrieve public JWKS from NDI
   * Max of 3 back-to-back attemps with timeout of 3s per attempt as per NDI specs
   * @async
   * @returns NDI's public keys
   * @throws JwkError if keys are not the correct shape
   */
  async retrievePublicKeysFromNdi(): Promise<CryptoKeys> {
    const getJwksWithRetries = retryPromiseThreeAttempts(
      () => axios.get<PublicJwks>(this.#ndiJwksEndpoint, { timeout: 3000 }),
      `axios.get<PublicJwks>(this.#ndiJwksEndpoint)`,
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
   * Max of 3 back-to-back attemps with timeout of 3s per attempt as per NDI specs
   * @async
   * @returns Base client
   */
  async retrieveBaseClientFromNdi(): Promise<BaseClient> {
    const getIssuerWithRetries = retryPromiseThreeAttempts(
      () => Issuer.discover(this.#ndiDiscoveryEndpoint),
      `Issuer.discover(this.#ndiDiscoveryEndpoint)`,
    )

    const issuer = await getIssuerWithRetries

    const baseClient = new issuer.Client(
      {
        client_id: this.#rpClientId,
        token_endpoint_auth_method: 'private_key_jwt',
        redirect_uris: [this.#rpRedirectUrl],
      },
      this.#rpSecretJwks,
    )

    return baseClient
  }
}
