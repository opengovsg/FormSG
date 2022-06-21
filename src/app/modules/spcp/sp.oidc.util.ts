import { EC, ECPrivate } from 'jwk-to-pem'
import promiseRetry from 'promise-retry'

import { hasProp } from '../../../../shared/utils/has-prop'

import { CryptoKey, SigningKey } from './sp.oidc.client.types'

/**
 * Helper function to retry a promise 2 times
 * Used to call NDI's endpoints
 * @param promise
 * @returns promise with 3 attempts
 */
export const retryPromiseThreeAttempts = <T>(
  promise: Promise<T>,
): Promise<T> => {
  return promiseRetry(
    async (retry) => {
      try {
        const result = await promise
        return result
      } catch (e) {
        return retry(e)
      }
    },
    {
      retries: 2, // NDI specs: 3 attempts. Do once then retry two times
      minTimeout: 0, // Retry immediately upon failure
      maxTimeout: 3000, // NDI specs: timeout of max 3s
      maxRetryTime: 3000,
    },
  )
}

/**
 * Helper function to retry a promise unlimited times
 * The time between each attempt follows an exponential backoff
 * Used to wrap the refresh() method in the cache so that
 * Refresh ahead continues indefinitely until success
 * @param promise
 * @returns promise with unlimited attempts
 */
export const retryPromiseForever = <T>(promise: Promise<T>): Promise<T> => {
  return promiseRetry(
    async (retry) => {
      try {
        const result = await promise
        return result
      } catch (e) {
        return retry(e)
      }
    },
    {
      retries: 0,
      forever: true, // Retries indefinitely until success. See https://github.com/tim-kos/node-retry/blob/11efd6e4e896e06b7873df4f6e187c1e6dd2cf1b/test/integration/test-forever.js for example implementation.
      // This uses an exponential backoff where the time between retries is
      // 1000ms * Math.pow(2, attempt)
      // See https://github.com/tim-kos/node-retry
    },
  )
}

// Typeguards

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
