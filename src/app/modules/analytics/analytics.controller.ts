import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { submissionsTopUp } from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { getRequestIp, getTrace } from '../../utils/request'

import { AnalyticsFactory } from './analytics.factory'
import { getSubmissionCount, getUserCount } from './analytics.service'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /analytics/users
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
        ip: getRequestIp(req),
        url: req.url,
        headers: req.headers,
        trace: getTrace(req),
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
        ip: getRequestIp(req),
        url: req.url,
        headers: req.headers,
        trace: getTrace(req),
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
 * @route GET /analytics/forms
 * @returns 200 with the number of popular forms on the application
 * @returns 500 when database error occurs whilst retrieving form count
 */
export const handleGetFormCount: RequestHandler = async (req, res) => {
  const countResult = await AnalyticsFactory.getFormCount()

  if (countResult.isErr()) {
    logger.error({
      message: 'Mongo form count error',
      meta: {
        action: 'handleGetFormCount',
        ip: getRequestIp(req),
        url: req.url,
        headers: req.headers,
        trace: getTrace(req),
      },
      error: countResult.error,
    })

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json('Unable to retrieve number of forms from the database')
  }

  return res.json(countResult.value)
}
