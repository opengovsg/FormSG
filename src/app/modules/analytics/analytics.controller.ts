import { RequestHandler } from 'express'
import * as A from 'fp-ts/lib/Array'
import * as F from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import { StatusCodes } from 'http-status-codes'

import { AnalyticStats } from 'src/types/analytics'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../utils/request'

import {
  getFormCount,
  getSubmissionCount,
  getUserCount,
} from './analytics.service'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /analytics/users
 * @deprecated
 * @route GET /analytics/users
 * @returns 200 with the number of users building forms
 * @returns 500 when database error occurs whilst retrieving user count
 */
export const handleGetUserCount: RequestHandler = async (req, res) => {
  return F.pipe(
    getUserCount(),
    TE.bimap(
      (error) => {
        logger.error({
          message: 'Mongo user count error',
          meta: {
            action: 'handleGetUserCount',
            ...createReqMeta(req),
          },
          error,
        })

        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json('Unable to retrieve number of users from the database')
      },
      (value) => res.json(value),
    ),
  )()
}

/**
 * Handler for GET /analytics/submissions
 * @deprecated
 * @route GET /analytics/submissions
 * @returns 200 with the number of submissions across forms
 * @returns 500 when database error occurs whilst retrieving submissions count
 */
export const handleGetSubmissionCount: RequestHandler = async (req, res) => {
  return F.pipe(
    getSubmissionCount(),
    TE.bimap(
      (error) => {
        logger.error({
          message: 'Mongo submissions count error',
          meta: {
            action: 'handleGetSubmissionCount',
            ...createReqMeta(req),
          },
          error,
        })

        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json('Unable to retrieve number of submissions from the database')
      },
      (value) => res.json(value),
    ),
  )()
}

/**
 * Handler for GET /analytics/forms
 * @deprecated
 * @route GET /analytics/forms
 * @returns 200 with the number of popular forms on the application
 * @returns 500 when database error occurs whilst retrieving form count
 */
export const handleGetFormCount: RequestHandler = async (req, res) => {
  return F.pipe(
    getFormCount(),
    TE.bimap(
      (error) => {
        logger.error({
          message: 'Mongo form count error',
          meta: {
            action: 'handleGetFormCount',
            ...createReqMeta(req),
          },
          error,
        })

        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json('Unable to retrieve number of forms from the database')
      },
      (value) => res.json(value),
    ),
  )()
}

/**
 * Controller for returning application statistics
 */
export const handleGetStatistics: RequestHandler = async (req, res) => {
  return F.pipe(
    A.sequence(TE.taskEither)([
      getUserCount(),
      getFormCount(),
      getSubmissionCount(),
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
      ([userCount, formCount, submissionCount]) => {
        const stats: AnalyticStats = {
          userCount,
          formCount,
          submissionCount,
        }
        return res.json(stats)
      },
    ),
  )()
}
