import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import getSubmissionModel from '../../models/submission.server.model'
import getUserModel from '../../models/user.server.model'
import { DatabaseError } from '../core/core.errors'

const SubmissionModel = getSubmissionModel(mongoose)
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

export const getSubmissionsCount = (): ResultAsync<number, DatabaseError> => {
  return ResultAsync.fromPromise(
    SubmissionModel.estimatedDocumentCount().exec(),
    (error) => {
      logger.error({
        message: 'Database error when retrieving submission collection count',
        meta: {
          action: 'getSubmissionsCount',
        },
        error,
      })

      return new DatabaseError()
    },
  )
}
