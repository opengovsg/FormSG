import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { IEmailNotification, ISnsNotification } from '../../../types'

import * as BounceService from './bounce.service'

const logger = createLoggerWithLabel(module)
/**
 * Validates that a request came from Amazon SNS, then updates the Bounce
 * collection.
 * @param req Express request object
 * @param res - Express response object
 */
export const handleSns: RequestHandler<
  ParamsDictionary,
  never,
  ISnsNotification
> = async (req, res) => {
  // Since this function is for a public endpoint, catch all possible errors
  // so we never fail on malformed input. The response code is meaningless since
  // it is meant to go back to AWS.
  try {
    const isValid = await BounceService.isValidSnsRequest(req.body)
    if (!isValid) return res.sendStatus(StatusCodes.FORBIDDEN)

    const notification: IEmailNotification = JSON.parse(req.body.Message)
    BounceService.logEmailNotification(notification)
    const bounceDoc = await BounceService.getUpdatedBounceDoc(notification)
    // Could not parse notification correctly
    if (!bounceDoc) return res.sendStatus(StatusCodes.BAD_REQUEST)
    // TODO (private #30): enable form deactivation
    // if (bounceDoc.areAllPermanentBounces()) {
    //   await BounceService.deactivateFormFromBounce(bounceDoc)
    // }
    if (bounceDoc.isCriticalBounce()) {
      const emailRecipients = await BounceService.notifyAdminOfBounce(bounceDoc)
      bounceDoc.updateHasEmailed(emailRecipients)
      BounceService.logCriticalBounce(bounceDoc, notification, emailRecipients)
    }
    await bounceDoc.save()
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
