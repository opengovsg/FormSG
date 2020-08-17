import { Request, Response } from 'express'
import HttpStatus from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'

import * as snsService from './sns.service'

const logger = createLoggerWithLabel('sns-controller')
/**
 * Validates that a request came from Amazon SNS, then updates the Bounce
 * collection.
 * @param req Express request object
 * @param res - Express response object
 */
const handleSns = async (req: Request, res: Response) => {
  // Since this function is for a public endpoint, catch all possible errors
  // so we never fail on malformed input. The response code is meaningless since
  // it is meant to go back to AWS.
  try {
    const isValid = await snsService.isValidSnsRequest(req.body)
    if (!isValid) {
      return res.sendStatus(HttpStatus.FORBIDDEN)
    }
    await snsService.updateBounces(req.body)
    return res.sendStatus(HttpStatus.OK)
  } catch (err) {
    logger.warn(err)
    return res.sendStatus(HttpStatus.BAD_REQUEST)
  }
}

export default handleSns
