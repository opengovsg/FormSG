import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import getFormStatisticsTotalModel from '../../models/form_statistics_total.server.model'
import getSubmissionModel from '../../models/submission.server.model'
import getUserModel from '../../models/user.server.model'
import { DatabaseError } from '../core/core.errors'

import { MIN_SUB_COUNT } from './analytics.constants'

const FormStatisticsModel = getFormStatisticsTotalModel(mongoose)
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
 * !!! This function should only be called by {@link AnalyticsFactory} !!!
 *
 * ! Access to this function should be determined by whether the `aggregate-stats` feature is enabled.
 *
 * Retrieves the number of forms that has more than MIN_SUB_COUNT responses
 * using the form statistics collection.
 * @returns ok(form count) on success
 * @returns err(DatabaseError) on query failure
 */
export const getFormCountWithStatsCollection = (): ResultAsync<
  number,
  DatabaseError
> => {
  return ResultAsync.fromPromise(
    FormStatisticsModel.aggregateFormCount(MIN_SUB_COUNT),
    (error) => {
      logger.error({
        message:
          'Database error when retrieving form count from FormStatisticsTotal collection',
        meta: {
          action: 'getFormCountWithStatsCollection',
        },
        error,
      })

      return new DatabaseError()
    },
  ).map(([result]) => {
    return result?.numActiveForms ?? 0
  })
}

/**
 * !!! This function should only be called by {@link AnalyticsFactory} !!!
 *
 * ! Access to this function should be determined by whether the `aggregate-stats` feature is enabled.
 *
 * Retrieves the number of forms that has more than MIN_SUB_COUNT responses
 * using the submissions collection.
 * @returns ok(form count) on success
 * @returns err(DatabaseError) on query failure
 */
export const getFormCountWithSubmissionCollection = (): ResultAsync<
  number,
  DatabaseError
> => {
  return ResultAsync.fromPromise(
    SubmissionModel.findFormsWithSubsAbove(MIN_SUB_COUNT),
    (error) => {
      logger.error({
        message:
          'Database error when retrieving form count from submissions collection',
        meta: {
          action: 'getFormCountWithSubmissionCollection',
        },
        error,
      })

      return new DatabaseError()
    },
  ).map((forms) => forms.length)
}
