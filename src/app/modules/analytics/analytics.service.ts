// import { either, taskEither } from 'fp-ts'
import { TaskEither, tryCatch } from 'fp-ts/TaskEither'
import mongoose from 'mongoose'

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
 */
export const getUserCount = (): TaskEither<DatabaseError, number> => {
  return tryCatch(
    () => UserModel.estimatedDocumentCount().exec(),
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
 */
export const getSubmissionCount = (): TaskEither<DatabaseError, number> => {
  return tryCatch(
    () => SubmissionModel.estimatedDocumentCount().exec(),
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
 */
export const getFormCount = (): TaskEither<DatabaseError, number> => {
  return tryCatch(
    () => FormModel.estimatedDocumentCount().exec(),
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
