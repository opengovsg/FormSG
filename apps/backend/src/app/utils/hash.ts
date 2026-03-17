import bcrypt from 'bcrypt'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../config/logger'
import { ApplicationError } from '../modules/core/core.errors'

const logger = createLoggerWithLabel(module)
const DEFAULT_SALT_ROUNDS = 10

/**
 * Error while hashing data
 */
export class HashingError extends ApplicationError {
  constructor(
    message = 'Error occurred while processing OTP. Please try again.',
  ) {
    super(message)
  }
}

/**
 * Neverthrown version of bcrypt.hash.
 * @param dataToHash the data to hash
 * @param logMeta additional metadata for logging, if available
 * @returns ok(hashed data) if the hashing was successful
 * @returns err(ApplicationError) if hashing error occurs
 */
export const hashData = (
  dataToHash: string | Buffer,
  logMeta: Record<string, unknown> = {},
  saltRounds?: number,
): ResultAsync<string, HashingError> => {
  return ResultAsync.fromPromise(
    bcrypt.hash(dataToHash, saltRounds ?? DEFAULT_SALT_ROUNDS),
    (error) => {
      logger.error({
        message: 'bcrypt hash error',
        meta: {
          action: 'hashData',
          ...logMeta,
        },
        error,
      })

      return new HashingError()
    },
  )
}

/**
 * Neverthrown version of bcrypt.compare.
 * @param data the unhashed data to compare with
 * @param encrypted the hashed data to check match for
 * @param logMeta additional metadata for logging, if available
 * @returns ok(boolean) if the hash matches
 * @returns err(ApplicationError) if error occurs whilst comparing hashes
 */
export const compareHash = (
  data: string | Buffer,
  encrypted: string,
  logMeta: Record<string, unknown> = {},
): ResultAsync<boolean, HashingError> => {
  return ResultAsync.fromPromise(bcrypt.compare(data, encrypted), (error) => {
    logger.error({
      message: 'bcrypt compare error',
      meta: {
        action: 'compareHash',
        ...logMeta,
      },
      error,
    })

    return new HashingError()
  })
}
