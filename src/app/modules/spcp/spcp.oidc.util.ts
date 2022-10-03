import { JWTVerifyResult } from 'jose'
import { EC, ECPrivate } from 'jwk-to-pem'
import promiseRetry from 'promise-retry'

import { hasProp } from '../../../../shared/utils/has-prop'
import { createLoggerWithLabel } from '../../config/logger'

import { InvalidIdTokenError } from './spcp.oidc.client.errors'
import {
  CPJWTVerifyResult,
  CryptoKey,
  ParsedSub,
  SigningKey,
} from './spcp.oidc.client.types'

const logger = createLoggerWithLabel(module)
/**
 * Helper function to retry a promise 2 times
 * Used to call NDI's endpoints
 * @param promise
 * * @param promiseName to log in logger
 * @returns promise with 3 attempts
 */
export const retryPromiseThreeAttempts = <T>(
  promiseFn: () => Promise<T>,
  promiseName: string,
): Promise<T> => {
  return promiseRetry(
    async (retry, attemptNo) => {
      logger.info({
        message: 'Attempting promise',
        meta: {
          action: 'retryPromiseThreeAttempts',
          promise: promiseName,
          attemptNo,
        },
      })
      try {
        const result = await promiseFn()
        logger.info({
          message: 'Promise resolved',
          meta: {
            action: 'retryPromiseThreeAttempts',
            promise: promiseName,
            attemptNo,
          },
        })
        return result
      } catch (e) {
        logger.warn({
          message: 'Promise rejected',
          meta: {
            action: 'retryPromiseThreeAttempts',
            promise: promiseName,
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
      maxTimeout: 0, // Retry immediately upon failure
      maxRetryTime: 3000, // NDI specs: timeout of max 3s
    },
  )
}

/**
 * Helper function to retry a promise unlimited times
 * The time between each attempt is exactly 10s
 * Used to wrap the refresh() method in the cache so that
 * Refresh ahead continues indefinitely until success
 * @param promise
 * @param promiseName to log in logger
 * @returns promise with unlimited attempts
 */
export const retryPromiseForever = <T>(
  promiseFn: () => Promise<T>,
  promiseName: string,
): Promise<T> => {
  return promiseRetry(
    async (retry, attemptNo) => {
      logger.info({
        message: 'Attempting promise',
        meta: {
          action: 'retryPromiseForever',
          promise: promiseName,
          attemptNo,
        },
      })
      try {
        const result = await promiseFn()
        logger.info({
          message: 'Promise resolved',
          meta: {
            action: 'retryPromiseForever',
            promise: promiseName,
            attemptNo,
          },
        })
        return result
      } catch (e) {
        logger.warn({
          message: 'Promise rejected',
          meta: {
            action: 'retryPromiseForever',
            promise: promiseName,
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
      minTimeout: 10000, // Exactly 10s between each retry attempt
      maxTimeout: 10000, // Exactly 10s between each retry attempt
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
      if (pair.length !== 2) {
        // Error thrown is caught in catch block
        // eslint-disable-next-line typesafe/no-throw-sync-func
        throw new Error()
      }
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
 * Helper function to extract NRIC or foreign ID from a parsed sub attribute
 * @param parsedSub
 * @returns NRIC or foreign ID if it exists
 * @returns undefined if NRIC or foreign id does not exist
 */
export const extractNricOrForeignIdFromParsedSub = (
  parsedSub: ParsedSub,
): string | undefined => {
  const nricOrForeignId = parsedSub.find((keyValuePair) => {
    // We do not validate NRIC format as it could be a foreign ID and could be any format
    return keyValuePair.key === 's'
  })
  return nricOrForeignId ? nricOrForeignId.value : undefined
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

export const isCPJWTVerifyResult = (
  jwt: JWTVerifyResult,
): jwt is CPJWTVerifyResult => {
  return (
    typeof jwt === 'object' &&
    !!jwt &&
    hasProp(jwt, 'payload') &&
    hasProp(jwt.payload, 'entityInfo') &&
    hasProp(jwt.payload.entityInfo, 'CPEntID')
  )
}
