import bcrypt from 'bcrypt'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'
import { ApplicationError } from '../modules/core/core.errors'

const logger = createLoggerWithLabel(module)
const DEFAULT_SALT_ROUNDS = 10

/**
 * Neverthrown version of bcrypt.hash.
 * @param dataToHash the data to hash
 * @param logMeta additional metadata for logging, if available
 * @returns ok(hashed data) if the hashing was successful
 * @returns err(ApplicationError) if hashing error occurs
 */
export const hashData = (
  dataToHash: unknown,
  logMeta: Record<string, unknown> = {},
): ResultAsync<string, ApplicationError> => {
  return ResultAsync.fromPromise(
    bcrypt.hash(dataToHash, DEFAULT_SALT_ROUNDS),
    (error) => {
      logger.error({
        message: 'bcrypt hash error',
        meta: {
          action: 'hashData',
          ...logMeta,
        },
        error,
      })

      return new ApplicationError()
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
export const compareData = (
  data: unknown,
  encrypted: string,
  logMeta: Record<string, unknown> = {},
): ResultAsync<boolean, ApplicationError> => {
  return ResultAsync.fromPromise(bcrypt.compare(data, encrypted), (error) => {
    logger.error({
      message: 'bcrypt compare error',
      meta: {
        action: 'compareData',
        ...logMeta,
      },
      error,
    })

    return new ApplicationError()
  })
}
