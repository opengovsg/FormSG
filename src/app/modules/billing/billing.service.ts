import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { LoginStatistic } from 'src/types'

import { createLoggerWithLabel } from '../../../config/logger'
import getLoginModel from '../../models/login.server.model'
import { DatabaseError } from '../core/core.errors'

const logger = createLoggerWithLabel(module)
const LoginModel = getLoginModel(mongoose)

export const getSpLoginStats = (
  esrvcId: string,
  minDate: Date,
  maxDate: Date,
): ResultAsync<LoginStatistic[], DatabaseError> => {
  return ResultAsync.fromPromise(
    LoginModel.aggregateLoginStats(esrvcId, minDate, maxDate).exec(),
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
