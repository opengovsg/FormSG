import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { getRequestIp } from '../../utils/request'

import { getUsersCount } from './analytics.service'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /anayltics/users
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
