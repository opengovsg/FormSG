import { Request, RequestHandler, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { ISnsNotification } from '../../../types'

import * as snsService from './bounce.service'

const logger = createLoggerWithLabel(module)
/**
 * Validates that a request came from Amazon SNS, then updates the Bounce
 * collection.
 * @param req Express request object
 * @param res - Express response object
 */
export const handleSns: RequestHandler<
  Record<string, string>,
  string,
  ISnsNotification
> = async (req, res) => {
  // Since this function is for a public endpoint, catch all possible errors
  // so we never fail on malformed input. The response code is meaningless since
  // it is meant to go back to AWS.
  try {
    const isValid = await snsService.isValidSnsRequest(req.body)
    if (!isValid) {
      return res.sendStatus(StatusCodes.FORBIDDEN)
    }
    await snsService.updateBounces(req.body)
    return res.sendStatus(StatusCodes.OK)
  } catch (err) {
    logger.warn({
      message: 'Error updating bounces',
      meta: {
        action: 'handleSns',
      },
      error: err,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
}
