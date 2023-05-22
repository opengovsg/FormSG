import { StatusCodes } from 'http-status-codes'

import { FormStatus } from '../../../../shared/types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'

const logger = createLoggerWithLabel(module)

const {
  targetFormId: TARGET_FORM_ID,
  isEnabled: IS_ENABLED,
  maxWaitMinutes: MAX_WAIT_MINUTES,
} = config.waitingRoom

/**
 * Handler for GET /api/v3/waiting-room/status
 * This spreads out the load for the redirect to the target form
 * @returns 404 if targetFormId does not exist
 * @returns 423 if target form is not yet open
 * @returns 200 with 0 wait time seconds if waiting room is not enabled
 * @returns 200 with wait time seconds if waiting room is enabled
 */
export const handleGetWaitingRoomStatus: ControllerHandler<
  unknown,
  Record<string, any>
> = async (_req, res) => {
  const logMeta = {
    action: 'handleGetWaitingRoomStatus',
    waitingRoomConfig: {
      targetFormId: TARGET_FORM_ID,
      isEnabled: IS_ENABLED,
      maxWaitMinutes: MAX_WAIT_MINUTES,
    },
  }

  // Step 1: Check if target form id exists, if not, return 404
  if (!TARGET_FORM_ID) {
    logger.warn({
      message: 'Target form id not defined',
      meta: logMeta,
    })
    return res.sendStatus(StatusCodes.NOT_FOUND)
  }

  const formResult = await FormService.retrieveFormById(TARGET_FORM_ID)
  if (formResult.isErr()) {
    logger.warn({
      message: 'Target form does not exist',
      meta: logMeta,
      error: formResult.error,
    })
    return res.sendStatus(StatusCodes.NOT_FOUND)
  }

  // Step 2: If target form is not open, return 423
  if (formResult.value.status !== FormStatus.Public) {
    logger.warn({
      message: 'Target form is not open',
      meta: logMeta,
    })
    return res.status(StatusCodes.LOCKED).json({
      inactiveMessage: formResult.value.inactiveMessage,
    })
  }

  // Step 3: If waiting room is not enabled, return 200 with waitSeconds of 0

  if (!IS_ENABLED) {
    logger.info({
      message: 'Waiting room not enabled',
      meta: {
        ...logMeta,
      },
    })
    return res.status(StatusCodes.OK).json({
      waitSeconds: 0,
      targetFormId: TARGET_FORM_ID,
      maxWaitMinutes: MAX_WAIT_MINUTES, // We display the same max wait time regardless of the actual waitSeconds, otherwise user will see a different number every time they refresh
    })
  }

  // Step 4: Target form is defined and open, and waiting room is enabled. Return waitSeconds uniformly at random from 1s to maxWaitMinutes * 60s

  const waitSeconds = Math.floor(Math.random() * MAX_WAIT_MINUTES * 60) + 1
  logger.info({
    message: 'Returning wait time',
    meta: {
      ...logMeta,
      waitSeconds,
    },
  })
  return res.status(StatusCodes.OK).json({
    waitSeconds,
    targetFormId: TARGET_FORM_ID,
    maxWaitMinutes: MAX_WAIT_MINUTES,
  })
}
