import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import getUserModel from '../../models/user.server.model'
import { DatabaseError } from '../core/core.errors'

const UserModel = getUserModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Retrieves the number of user documents in the database.
 * @returns ok(user count) on success
 * @returns err(DatabaseError) on query failure
 */
export const getUsersCount = (): ResultAsync<number, DatabaseError> => {
  return ResultAsync.fromPromise(
    UserModel.estimatedDocumentCount().exec(),
    (error) => {
      logger.error({
        message: 'Database error when retrieving user collection count',
        meta: {
          action: 'getUsersCount',
        },
        error,
      })

      return new DatabaseError()
    },
  )
}
