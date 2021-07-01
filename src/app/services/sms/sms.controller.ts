import { StatusCodes } from 'http-status-codes'

import { ErrorDto } from '../../../types/api'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../../modules/core/core.types'
import * as FormService from '../../modules/form/form.service'
import * as SmsService from '../../services/sms/sms.service'
import { createReqMeta } from '../../utils/request'

import { SmsCountsMeta } from './sms.types'
import { mapRouteError } from './sms.util'

const logger = createLoggerWithLabel(module)

/**
 * Handler to retrieve the free sms counts remaining for a user and a form belonging to the user
 * This is the controller for GET /admin/forms/:formId/verified-sms/count/free
 * @param formId The id of the form to retrieve the message service id for
 * @returns 200 with msgSrvcId and free sms counts when successful
 * @returns 404 when the formId is not found in the database
 * @returns 500 when a database error occurs during retrieval
 */
export const handleGetFreeSmsCountForFormAdmin: ControllerHandler<
  {
    formId: string
  },
  ErrorDto | SmsCountsMeta
> = (req, res) => {
  const { formId } = req.params
  const logMeta = {
    action: 'handleGetFreeSmsCountForFormAdmin',
    ...createReqMeta(req),
    formId,
  }

  // Step 1: Check that the form exists
  return (
    FormService.retrieveFormById(formId)
      // Step 2: Retrieve the free sms count
      .andThen(({ admin }) => {
        return SmsService.retrieveFreeSmsCounts(String(admin))
      })
      // Step 3: Map/MapErr accordingly
      .map((freeSmsCount) => res.status(StatusCodes.OK).json({ freeSmsCount }))
      .mapErr((error) => {
        logger.error({
          message: 'Error while retrieving sms counts for user',
          meta: logMeta,
          error,
        })
        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}
