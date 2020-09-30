/**
 * ! Important: Note that this service class should only be called by
 * ! BillingFactory in billing.factory as access to the functions in this class
 * ! should be determined by whether the `spcp-myinfo` feature is enabled.
 */

import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { LoginStatistic } from 'src/types'

import { createLoggerWithLabel } from '../../../config/logger'
import getLoginModel from '../../models/login.server.model'
import { DatabaseError } from '../core/core.errors'

const logger = createLoggerWithLabel(module)
const LoginModel = getLoginModel(mongoose)

/**
 * !!! This function should only be called by {@link BillingFactory}.
 *
 * Retrieves SingPass login statistics including total logins for each of the
 * forms with given esrvcId in the given date range.
 * @param esrvcId the esrvcId to filter retrieved login statistics
 * @param minDate the minimum date to retrieve statistics for
 * @param maxDate the maximum date to retrieve statistics for
 * @returns ok(login statistics list) when successful
 * @returns err(DatabaseError) when error occurs whilst running database aggregation pipeline
 */
export const getSpLoginStats = (
  esrvcId: string,
  minDate: Date,
  maxDate: Date,
): ResultAsync<LoginStatistic[], DatabaseError> => {
  return ResultAsync.fromPromise(
    LoginModel.aggregateLoginStats(esrvcId, minDate, maxDate),
    (error) => {
      const errMsg = 'Failed to retrieve billing records'
      logger.error({
        message: errMsg,
        meta: {
          action: 'getSpLoginStats',
          esrvcId,
        },
        error,
      })
      return new DatabaseError(errMsg)
    },
  )
}
