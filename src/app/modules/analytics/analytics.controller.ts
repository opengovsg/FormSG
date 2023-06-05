import * as A from 'fp-ts/lib/Array'
import * as F from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import { StatusCodes } from 'http-status-codes'

import { AnalyticStatsDto } from '../../../../shared/types'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import {
  getAgencyCount,
  getFormCount,
  getSubmissionCount,
  getUserCount,
} from './analytics.service'

const logger = createLoggerWithLabel(module)

/**
 * Controller for returning application statistics
 */
export const handleGetStatistics: ControllerHandler = async (req, res) => {
  return F.pipe(
    A.sequence(TE.taskEither)([
      getUserCount(),
      getFormCount(),
      getSubmissionCount(),
      getAgencyCount(),
    ]),
    TE.bimap(
      (error) => {
        logger.error({
          message: 'Mongo handleGetStatistics error',
          meta: {
            action: 'handleGetStatistics',
            ...createReqMeta(req),
          },
          error,
        })
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json('Unable to retrieve statistics from the database')
      },
      ([userCount, formCount, submissionCount, agencyCount]) => {
        const stats: AnalyticStatsDto = {
          userCount,
          formCount,
          submissionCount,
          agencyCount,
        }
        return res.json(stats)
      },
    ),
  )()
}
