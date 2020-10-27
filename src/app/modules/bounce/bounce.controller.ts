import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

import { createLoggerWithLabel } from '../../../config/logger'
import { IEmailNotification, ISnsNotification } from '../../../types'
import { EmailType } from '../../services/mail/mail.constants'
import * as FormService from '../form/form.service'

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
    if (
      BounceService.extractEmailType(notification) !== EmailType.AdminResponse
    ) {
      return res.sendStatus(StatusCodes.OK)
    }
    const bounceDoc = await BounceService.getUpdatedBounceDoc(notification)
    // Missing headers in notification
    if (!bounceDoc) return res.sendStatus(StatusCodes.OK)
    const shouldDeactivate = bounceDoc.areAllPermanentBounces()
    if (shouldDeactivate) {
      await FormService.deactivateForm(bounceDoc.formId)
    }
    if (bounceDoc.isCriticalBounce()) {
      let emailRecipients: string[] = []
      if (!bounceDoc.hasNotified()) {
        emailRecipients = await BounceService.notifyAdminOfBounce(bounceDoc)
        bounceDoc.setNotificationState(emailRecipients)
      }
      BounceService.logCriticalBounce(
        bounceDoc,
        notification,
        emailRecipients,
        shouldDeactivate,
      )
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
    // Accept the risk that there might be concurrency problems
    // when multiple server instances try to access the same
    // document, due to notifications arriving asynchronously.
    if (err instanceof mongoose.Error.VersionError) {
      return res.sendStatus(StatusCodes.OK)
    }
    // Malformed request, could not be parsed
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }
}
