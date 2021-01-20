import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import getFormModel from '../../models/form.server.model'
import getSubmissionModel from '../../models/submission.server.model'
import getUserModel from '../../models/user.server.model'
import { DatabaseError } from '../core/core.errors'

const FormModel = getFormModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)
const UserModel = getUserModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Retrieves the number of user documents in the database.
 * @returns ok(user count) on success
 * @returns err(DatabaseError) on query failure
 */
export const getUserCount = (): ResultAsync<number, DatabaseError> => {
  return ResultAsync.fromPromise(
    UserModel.estimatedDocumentCount().exec(),
    (error) => {
      logger.error({
        message: 'Database error when retrieving user collection count',
        meta: {
          action: 'getUserCount',
        },
        error,
      })

      return new DatabaseError()
    },
  )
}

/**
 * Retrieves the number of submission documents in the database.
 * @returns ok(submissions count) on success
 * @returns err(DatabaseError) on query failure
 */
export const getSubmissionCount = (): ResultAsync<number, DatabaseError> => {
  return ResultAsync.fromPromise(
    SubmissionModel.estimatedDocumentCount().exec(),
    (error) => {
      logger.error({
        message: 'Database error when retrieving submission collection count',
        meta: {
          action: 'getSubmissionCount',
        },
        error,
      })

      return new DatabaseError()
    },
  )
}

/**
 * Retrieves the number of form documents in the database.
 * @returns ok(forms count) on success
 * @returns err(DatabaseError) on query failure
 */
export const getFormCount = (): ResultAsync<number, DatabaseError> => {
  return ResultAsync.fromPromise(
    FormModel.estimatedDocumentCount().exec(),
    (error) => {
      logger.error({
        message: 'Database error when retrieving form collection count',
        meta: {
          action: 'getFormCount',
        },
        error,
      })

      return new DatabaseError()
    },
  )
}
