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
