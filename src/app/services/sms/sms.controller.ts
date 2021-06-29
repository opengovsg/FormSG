import { StatusCodes } from 'http-status-codes'

import { ErrorDto } from '../../../types/api'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../../modules/core/core.types'
import * as FormService from '../../modules/form/form.service'
import * as UserService from '../../modules/user/user.service'
import * as SmsService from '../../services/sms/sms.service'
import { createReqMeta } from '../../utils/request'

import { SmsCountsMeta } from './sms.types'
import { mapRouteError } from './sms.util'

const logger = createLoggerWithLabel(module)

/**
 * Handler to retrieve the free sms counts remaining for a user and a form belonging to the user
 * This is the controller for GET /:userId/:formId endpoint
 * @param formId The id of the form to retrieve the message service id for
 * @param userId The user id of the form to retrieve sms counts for
 * @returns
 * @returns
 */
export const handleGetFreeSmsCountForUser: ControllerHandler<
  {
    userId: string
    formId: string
  },
  ErrorDto | SmsCountsMeta
> = (req, res) => {
  const { userId, formId } = req.params
  const logMeta = {
    action: 'handleGetFreeSmsCountForUser',
    ...createReqMeta(req),
    formId,
    userId,
  }

  // Step 1: Check that both user and form exist
  return (
    UserService.findUserById(userId)
      .andThen(() => FormService.retrieveFormById(formId))
      // Step 2: Retrieve the free sms count
      .andThen(({ msgSrvcName }) =>
        SmsService.retrieveFreeSmsCounts(userId).map((freeSmsCount) => ({
          msgSrvcSid: msgSrvcName,
          freeSmsCount,
        })),
      )
      // Step 3: Map/MapErr accordingly
      .map((smsCountMeta) => res.status(StatusCodes.OK).json(smsCountMeta))
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
