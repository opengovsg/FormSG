// import { either, taskEither } from 'fp-ts'
import * as TE from 'fp-ts/TaskEither'
import mongoose from 'mongoose'

import { getMongoErrorMessage } from '../../../app/utils/handle-mongo-error'
import { submissionsTopUp } from '../../../config/config'
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
export const getUserCount = (): TE.TaskEither<DatabaseError, number> => {
  return TE.tryCatch(
    () => UserModel.estimatedDocumentCount().exec(),
    (error) => {
      logger.error({
        message: 'Database error when retrieving user collection count',
        meta: {
          action: 'getUserCount',
        },
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
}

/**
 * Retrieves the number of submission documents in the database.
 */
export const getSubmissionCount = (): TE.TaskEither<DatabaseError, number> => {
  return TE.tryCatch(
    () =>
      SubmissionModel.estimatedDocumentCount()
        .exec()
        // Top up submissions from config file that tracks submissions that has been
        // archived (and thus deleted from the database).
        .then((value) => value + submissionsTopUp),
    (error) => {
      logger.error({
        message: 'Database error when retrieving submission collection count',
        meta: {
          action: 'getSubmissionCount',
        },
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
}

/**
 * Retrieves the number of form documents in the database.
 */
export const getFormCount = (): TE.TaskEither<DatabaseError, number> => {
  return TE.tryCatch(
    () => FormModel.estimatedDocumentCount().exec(),
    (error) => {
      logger.error({
        message: 'Database error when retrieving form collection count',
        meta: {
          action: 'getFormCount',
        },
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
}
