import { EC, ECPrivate } from 'jwk-to-pem'
import promiseRetry from 'promise-retry'

import { hasProp } from '../../../../shared/utils/has-prop'
import {
  isMFinSeriesValid,
  isNricValid,
} from '../../../../shared/utils/nric-validation'
import { createLoggerWithLabel } from '../../config/logger'

import { InvalidIdTokenError } from './sp.oidc.client.errors'
import { CryptoKey, ParsedSub, SigningKey } from './sp.oidc.client.types'

const logger = createLoggerWithLabel(module)
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
    async (retry, attemptNo) => {
      logger.info({
        message: 'Attempting promise',
        meta: {
          action: 'retryPromiseThreeAttempts',
          promise,
          attemptNo,
        },
      })
      try {
        const result = await promise
        logger.info({
          message: 'Promise resolved',
          meta: {
            action: 'retryPromiseThreeAttempts',
            promise,
            attemptNo,
          },
        })
        return result
      } catch (e) {
        logger.warn({
          message: 'Promise rejected',
          meta: {
            action: 'retryPromiseThreeAttempts',
            promise,
            attemptNo,
          },
          error: e,
        })
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
    async (retry, attemptNo) => {
      logger.info({
        message: 'Attempting promise',
        meta: {
          action: 'retryPromiseForever',
          promise,
          attemptNo,
        },
      })
      try {
        const result = await promise
        logger.info({
          message: 'Promise resolved',
          meta: {
            action: 'retryPromiseForever',
            promise,
            attemptNo,
          },
        })
        return result
      } catch (e) {
        logger.warn({
          message: 'Promise rejected',
          meta: {
            action: 'retryPromiseForever',
            promise,
            attemptNo,
          },
          error: e,
        })
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

/**
 * Helper function to parse the `sub` attribute in the idToken
 * NDI Spec: `sub` is the principal that is the subject of the JWT.
 * Contains a comma-separated, key=value mapping that identifies the user;
 * possibly including multiple alternate IDs representing the user.
 * @param sub attribute from idToken
 * @returns ParsedSub
 * @returns InvalidIdTokenError if mapping fails - too few or too many `=` chars
 */
export const parseSub = (sub: string): ParsedSub | InvalidIdTokenError => {
  let keyValuePairs
  try {
    keyValuePairs = sub.split(',').map((keyValuePair) => {
      const pair = keyValuePair.split('=')
      return {
        key: pair[0],
        value: pair[1],
      }
    })
    return keyValuePairs
  } catch {
    return new InvalidIdTokenError()
  }
}

/**
 * Helper function to extract NRIC from a parsed sub attribute
 * @param parsedSub
 * @returns NRIC if it exists
 * @returns undefined if NRIC does not exist
 */
export const extractNricFromParsedSub = (
  parsedSub: ParsedSub,
): string | undefined => {
  const nric = parsedSub.find((keyValuePair) => {
    const { key, value } = keyValuePair
    return key === 's' && (isNricValid(value) || isMFinSeriesValid(value))
  })
  return nric ? nric.value : undefined
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
