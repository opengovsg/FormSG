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
  /**
   * Whether the sweep filled its batch limit, meaning more expired forms are
   * likely still open and awaiting the next run.
   */
  hasMore: boolean
}

/**
 * Handler for POST /cron/close-expired-forms
 *
 * Closes every public form whose scheduled expiry has passed. Driven by a
 * periodic cron job because nothing else runs code at the close instant.
 *
 * @returns 200 with a report of what was closed
 * @returns 500 if the sweep failed
 */
export const handleCloseExpiredForms: ControllerHandler<
  never,
  CloseExpiredFormsDto | ErrorDto
> = (_req, res) => {
  return FormService.closeExpiredForms()
    .map((closedForms) => {
      return res.status(StatusCodes.OK).json({
        closedCount: closedForms.length,
        formIds: closedForms.map((form) => form.formId),
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
