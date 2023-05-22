import { Router } from 'express'

import * as WaitingRoomController from '../../../../modules/waiting-room/waiting-room.controller'

export const WaitingRoomRouter = Router()

/**
 * Checks if user should be redirected
 * @route GET /waiting-room/status
 * @returns 404 if targetFormId does not exist
 * @returns 423 if target form is not yet open
 * @returns 200 with 0 wait time seconds if waiting room is not enabled
 * @returns 200 with wait time seconds if waiting room is enabled
 */
WaitingRoomRouter.route('/status').get(
  WaitingRoomController.handleGetWaitingRoomStatus,
)
