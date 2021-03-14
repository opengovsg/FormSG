import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import { combine } from 'neverthrow'

import { AnalyticStats } from 'src/types/analytics'

import { submissionsTopUp } from '../../../config/config'
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
  const countResult = await getUserCount()

  if (countResult.isErr()) {
    logger.error({
      message: 'Mongo user count error',
      meta: {
        action: 'handleGetUserCount',
        ...createReqMeta(req),
      },
      error: countResult.error,
    })

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json('Unable to retrieve number of users from the database')
  }

  return res.json(countResult.value)
}

/**
 * Handler for GET /analytics/submissions
 * @deprecated
 * @route GET /analytics/submissions
 * @returns 200 with the number of submissions across forms
 * @returns 500 when database error occurs whilst retrieving submissions count
 */
export const handleGetSubmissionCount: RequestHandler = async (req, res) => {
  const countResult = await getSubmissionCount()

  if (countResult.isErr()) {
    logger.error({
      message: 'Mongo submissions count error',
      meta: {
        action: 'handleGetSubmissionCount',
        ...createReqMeta(req),
      },
      error: countResult.error,
    })

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json('Unable to retrieve number of submissions from the database')
  }

  // Top up submissions from config file that tracks submissions that has been
  // archived (and thus deleted from the database).
  const totalProperCount = countResult.value + submissionsTopUp
  return res.json(totalProperCount)
}

/**
 * Handler for GET /analytics/forms
 * @deprecated
 * @route GET /analytics/forms
 * @returns 200 with the number of popular forms on the application
 * @returns 500 when database error occurs whilst retrieving form count
 */
export const handleGetFormCount: RequestHandler = async (req, res) => {
  const countResult = await getFormCount()

  if (countResult.isErr()) {
    logger.error({
      message: 'Mongo form count error',
      meta: {
        action: 'handleGetFormCount',
        ...createReqMeta(req),
      },
      error: countResult.error,
    })

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json('Unable to retrieve number of forms from the database')
  }

  return res.json(countResult.value)
}

export const handleGetStatistics: RequestHandler = async (req, res) => {
  combine([
    await getUserCount(),
    await getFormCount(),
    await getSubmissionCount(),
  ])
    .map(([userCount, formCount, submissionCount]) => {
      const stats: AnalyticStats = {
        userCount,
        formCount,
        submissionCount,
      }
      return res.json(stats)
    })
    .mapErr((e) => {
      logger.error({
        message: 'Mongo handleGetStatistics error',
        meta: {
          action: 'handleGetStatistics',
          ...createReqMeta(req),
        },
        error: e,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json('Unable to retrieve statistics from the database')
    })
}
