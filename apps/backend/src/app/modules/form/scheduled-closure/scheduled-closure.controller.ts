import { ErrorDto } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { ControllerHandler } from '../../core/core.types'
import * as FormService from '../form.service'

const logger = createLoggerWithLabel(module)

export type CloseExpiredFormsDto = {
  /** Number of forms this sweep closed. */
  closedCount: number
  /** Ids of the forms closed, for correlating against the cron job's logs. */
  formIds: string[]
  /** Notifications successfully sent to admins and collaborators. */
  notifiedCount: number
  /**
   * Notifications that could not be sent. Non-zero means some admins were not
   * told their form closed — the closure itself still succeeded.
   */
  notifyFailedCount: number
  /**
   * Whether the sweep filled its batch limit, meaning more expired forms are
   * likely still open and awaiting the next run.
   */
  hasMore: boolean
}

/**
 * Handler for POST /cron/close-expired-forms
 *
 * Closes every public form whose scheduled expiry has passed, then tells each
 * form's admin and collaborators. Driven by a periodic cron job because nothing
 * else runs code at the close instant.
 *
 * Notification failures are reported but do not fail the request: the forms are
 * already closed, and a retry would re-send to everyone who did get an email.
 *
 * @returns 200 with a report of what was closed and notified
 * @returns 500 if the sweep itself failed
 */
export const handleCloseExpiredForms: ControllerHandler<
  never,
  CloseExpiredFormsDto | ErrorDto
> = (_req, res) => {
  return FormService.closeExpiredForms()
    .andThen((closedForms) =>
      FormService.notifyFormsClosed(closedForms).map((notified) => ({
        closedForms,
        notified,
      })),
    )
    .map(({ closedForms, notified }) => {
      return res.status(StatusCodes.OK).json({
        closedCount: closedForms.length,
        formIds: closedForms.map((form) => form.formId),
        notifiedCount: notified.sentCount,
        notifyFailedCount: notified.failedCount,
        hasMore:
          closedForms.length === FormService.CLOSE_EXPIRED_FORMS_BATCH_LIMIT,
      })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error running scheduled form closure sweep',
        meta: { action: 'handleCloseExpiredForms' },
        error,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: error.message })
    })
}
