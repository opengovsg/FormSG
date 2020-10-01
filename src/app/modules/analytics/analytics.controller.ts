import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { submissionsTopUp } from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { getRequestIp } from '../../utils/request'

import { getSubmissionsCount, getUsersCount } from './analytics.service'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /analytics/users
 * @route GET /analytics/users
 * @returns 200 with the number of users building forms
 * @returns 500 when database error occurs whilst retrieving user count
 */
export const handleGetUserAnalytics: RequestHandler = async (req, res) => {
  const countResult = await getUsersCount()

  if (countResult.isErr()) {
    logger.error({
      message: 'Mongo user count error',
      meta: {
        action: 'handleGetUserAnalytics',
        ip: getRequestIp(req),
        url: req.url,
        headers: req.headers,
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
export const handleGetSubmissionsAnalytics: RequestHandler = async (
  req,
  res,
) => {
  const countResult = await getSubmissionsCount()

  if (countResult.isErr()) {
    logger.error({
      message: 'Mongo submissions count error',
      meta: {
        action: 'handleGetSubmissionsAnalytics',
        ip: getRequestIp(req),
        url: req.url,
        headers: req.headers,
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
