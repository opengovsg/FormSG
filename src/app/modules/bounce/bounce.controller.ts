import { StatusCodes } from 'http-status-codes'

import { ISnsNotification } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import { EmailType } from '../../services/mail/mail.constants'
import { DatabaseConflictError } from '../core/core.errors'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'

import * as BounceService from './bounce.service'
import { AdminNotificationRecipients } from './bounce.types'

const logger = createLoggerWithLabel(module)

/**
 * Validates that a request came from Amazon SNS, then updates the Bounce
 * collection. Also informs form admins and collaborators if their form responses
 * bounced. Note that the response code is meaningless as it goes back to AWS.
 * @param req Express request object
 * @param res - Express response object
 */
export const handleSns: ControllerHandler<
  unknown,
  never,
  ISnsNotification
> = async (req, res) => {
  const notificationResult = await BounceService.validateSnsRequest(
    req.body,
  ).andThen(() => BounceService.safeParseNotification(req.body.Message))
  if (notificationResult.isErr()) {
    logger.warn({
      message: 'Unable to parse email notification request',
      meta: {
        action: 'handleSns',
        message: req.body,
      },
      error: notificationResult.error,
    })
    return res.sendStatus(StatusCodes.UNAUTHORIZED)
  }
  const notification = notificationResult.value

  BounceService.logEmailNotification(notification)
  // If not admin response, no more action to be taken
  if (
    BounceService.extractEmailType(notification) !== EmailType.AdminResponse
  ) {
    return res.sendStatus(StatusCodes.OK)
  }

  const bounceDocResult = await BounceService.getUpdatedBounceDoc(notification)
  if (bounceDocResult.isErr()) {
    logger.warn({
      message: 'Error while retrieving or creating new bounce doc',
      meta: {
        action: 'handleSns',
      },
      error: bounceDocResult.error,
    })
    return res.sendStatus(StatusCodes.OK)
  }
  const bounceDoc = bounceDocResult.value

  const formResult = await FormService.retrieveFullFormById(bounceDoc.formId)
  if (formResult.isErr()) {
    // Either database error occurred or the formId saved in the bounce collection
    // doesn't exist, so something went wrong.
    logger.error({
      message: 'Failed to retrieve form corresponding to bounced formId',
      meta: {
        action: 'handleSns',
        formId: bounceDoc.formId,
      },
    })
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
  }
  const form = formResult.value

  if (bounceDoc.isCriticalBounce()) {
    // Send notifications and deactivate form on best-effort basis, ignore errors
    const possibleSmsRecipients =
      await BounceService.getEditorsWithContactNumbers(form).unwrapOr([])

    const notificationRecipients: AdminNotificationRecipients = {
      emailRecipients: [],
      smsRecipients: [],
    }
    // Check if notifications have been sent to form admins and collaborators
    if (!bounceDoc.hasNotified()) {
      notificationRecipients.emailRecipients =
        await BounceService.sendEmailBounceNotification(
          bounceDoc,
          form,
        ).unwrapOr([])
      notificationRecipients.smsRecipients =
        await BounceService.sendSmsBounceNotification(
          bounceDoc,
          form,
          possibleSmsRecipients,
        ).unwrapOr([])
      bounceDoc.setNotificationState(
        notificationRecipients.emailRecipients,
        notificationRecipients.smsRecipients,
      )
    }

    const shouldDeactivate = bounceDoc.areAllPermanentBounces()
    if (shouldDeactivate) {
      await FormService.deactivateForm(bounceDoc.formId)
      await BounceService.notifyAdminsOfDeactivation(
        form,
        possibleSmsRecipients,
      )
    }

    // Important log message for user follow-ups
    BounceService.logCriticalBounce({
      bounceDoc,
      notification,
      autoEmailRecipients: notificationRecipients.emailRecipients,
      autoSmsRecipients: notificationRecipients.smsRecipients,
      hasDeactivated: shouldDeactivate,
    })
  }

  return BounceService.saveBounceDoc(bounceDoc)
    .map(() => res.sendStatus(StatusCodes.OK))
    .mapErr((error) => {
      // Accept the risk that there might be concurrency problems
      // when multiple server instances try to access the same
      // document, due to notifications arriving asynchronously.
      if (error instanceof DatabaseConflictError)
        return res.sendStatus(StatusCodes.OK)
      // Otherwise internal database error
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
    })
}
